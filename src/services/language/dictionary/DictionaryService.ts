import { DictionaryService, WordDefinition, Definition, AppError, ErrorType } from '@/types';

// Free Dictionary API响应接口
interface FreeDictionaryResponse {
  word: string;
  phonetic?: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
      synonyms?: string[];
      antonyms?: string[];
    }>;
  }>;
}

// 查询历史记录接口
interface QueryHistory {
  word: string;
  timestamp: Date;
  result: WordDefinition;
}

// 缓存项接口
interface CacheItem {
  data: WordDefinition;
  timestamp: number;
  expiresAt: number;
}

/**
 * 免费词典服务实现
 * 使用 Free Dictionary API 提供真实的单词查询功能
 */
export class FreeDictionaryService implements DictionaryService {
  private readonly apiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en';
  
  // 查询历史记录 (存储在内存中，可以后续扩展到数据库)
  private queryHistory: QueryHistory[] = [];
  
  // 缓存机制 (存储在内存中，可以后续扩展到localStorage)
  private cache = new Map<string, CacheItem>();
  private readonly cacheExpireTime = 24 * 60 * 60 * 1000; // 24小时缓存
  private readonly maxCacheSize = 1000; // 最大缓存条目数
  
  constructor() {
    // 免费API，无需配置
  }

  /**
   * 查询单词释义
   * @param word 要查询的单词
   * @returns 单词定义信息
   */
  async lookupWord(word: string): Promise<WordDefinition> {
    if (!word || typeof word !== 'string') {
      throw new AppError({
        type: ErrorType.VALIDATION_ERROR,
        message: '单词不能为空',
        details: { word }
      });
    }

    const normalizedWord = word.toLowerCase().trim();
    
    // 检查缓存
    const cachedResult = this.getCachedResult(normalizedWord);
    if (cachedResult) {
      console.log(`从缓存获取单词: ${normalizedWord}`);
      return cachedResult;
    }

    try {
      // 调用免费词典API
      const apiResponse = await this.callFreeDictionaryApi(normalizedWord);
      
      // 解析API响应
      const wordDefinition = this.parseFreeDictionaryResponse(apiResponse);
      
      // 缓存结果
      this.cacheResult(normalizedWord, wordDefinition);
      
      // 记录查询历史
      this.addToHistory(normalizedWord, wordDefinition);
      
      return wordDefinition;
    } catch (error) {
      console.error('查询单词失败:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError({
        type: ErrorType.API_ERROR,
        message: `查询单词 "${word}" 失败`,
        details: error
      });
    }
  }

  /**
   * 获取单词发音URL
   * @param word 单词
   * @returns 发音URL
   */
  async getWordPronunciation(word: string): Promise<string> {
    const wordDefinition = await this.lookupWord(word);
    return wordDefinition.pronunciation || '';
  }

  /**
   * 搜索单词 (模糊匹配)
   * @param query 查询字符串
   * @param limit 返回结果数量限制
   * @returns 匹配的单词定义列表
   */
  async searchWords(query: string, limit: number = 10): Promise<WordDefinition[]> {
    if (!query || typeof query !== 'string') {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    // 从查询历史中搜索匹配的单词
    const matchedWords = this.queryHistory
      .filter(item => item.word.includes(normalizedQuery))
      .slice(0, limit)
      .map(item => item.result);

    return matchedWords;
  }

  /**
   * 获取查询历史记录
   * @param limit 返回数量限制
   * @returns 查询历史列表
   */
  getQueryHistory(limit: number = 50): QueryHistory[] {
    return this.queryHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * 清除查询历史
   */
  clearHistory(): void {
    this.queryHistory = [];
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 调用免费词典API
   * @param word 要查询的单词
   * @returns API响应
   */
  private async callFreeDictionaryApi(word: string): Promise<FreeDictionaryResponse[]> {
    const response = await fetch(`${this.apiUrl}/${encodeURIComponent(word)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new AppError({
          type: ErrorType.API_ERROR,
          message: `未找到单词 "${word}" 的释义`,
          details: { status: response.status, word }
        });
      }
      
      throw new AppError({
        type: ErrorType.NETWORK_ERROR,
        message: `网络请求失败: ${response.status} ${response.statusText}`,
        details: { status: response.status, statusText: response.statusText }
      });
    }

    const data: FreeDictionaryResponse[] = await response.json();
    
    if (!data || data.length === 0) {
      throw new AppError({
        type: ErrorType.API_ERROR,
        message: `未找到单词 "${word}" 的释义`,
        details: { word }
      });
    }

    return data;
  }

  /**
   * 解析免费词典API响应为标准格式
   */
  private parseFreeDictionaryResponse(response: FreeDictionaryResponse[]): WordDefinition {
    const firstEntry = response[0];
    const definitions: Definition[] = [];
    const examples: string[] = [];

    // 提取音标
    let phonetic = firstEntry.phonetic;
    if (!phonetic && firstEntry.phonetics.length > 0) {
      phonetic = firstEntry.phonetics.find(p => p.text)?.text;
    }

    // 提取发音URL
    let pronunciation = '';
    const audioPhonetic = firstEntry.phonetics.find(p => p.audio);
    if (audioPhonetic?.audio) {
      pronunciation = audioPhonetic.audio;
    }

    // 解析释义
    firstEntry.meanings.forEach(meaning => {
      meaning.definitions.forEach(def => {
        // 过滤掉过于简短或不完整的定义
        if (def.definition && def.definition.length > 10 && !def.definition.startsWith('(of ')) {
          definitions.push({
            partOfSpeech: meaning.partOfSpeech,
            meaning: def.definition,
          });

          // 收集例句
          if (def.example) {
            examples.push(def.example);
          }
        }
      });
    });

    return {
      word: firstEntry.word,
      phonetic,
      pronunciation,
      definitions,
      examples: examples.slice(0, 3), // 限制例句数量
    };
  }

  /**
   * 从缓存获取结果
   */
  private getCachedResult(word: string): WordDefinition | null {
    const cacheItem = this.cache.get(word);
    
    if (!cacheItem) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > cacheItem.expiresAt) {
      this.cache.delete(word);
      return null;
    }

    return cacheItem.data;
  }

  /**
   * 缓存查询结果
   */
  private cacheResult(word: string, result: WordDefinition): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(word, {
      data: result,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.cacheExpireTime,
    });
  }

  /**
   * 添加到查询历史
   */
  private addToHistory(word: string, result: WordDefinition): void {
    // 检查是否已存在
    const existingIndex = this.queryHistory.findIndex(item => item.word === word);
    
    if (existingIndex >= 0) {
      // 更新现有记录的时间戳
      this.queryHistory[existingIndex].timestamp = new Date();
    } else {
      // 添加新记录
      this.queryHistory.push({
        word,
        timestamp: new Date(),
        result,
      });

      // 限制历史记录数量
      if (this.queryHistory.length > 500) {
        this.queryHistory = this.queryHistory
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 500);
      }
    }
  }
}

/**
 * 创建免费词典服务实例
 * @returns 词典服务实例
 */
export function createFreeDictionaryService(): DictionaryService {
  return new FreeDictionaryService();
}