import { DictionaryService, WordDefinition, Definition, AppError, ErrorType } from '@/types';
import CryptoJS from 'crypto-js';

// 有道词典API响应接口
interface YoudaoApiResponse {
  errorCode: string;
  query: string;
  translation?: string[];
  basic?: {
    phonetic?: string;
    'uk-phonetic'?: string;
    'us-phonetic'?: string;
    'uk-speech'?: string;
    'us-speech'?: string;
    explains: string[];
  };
  web?: Array<{
    key: string;
    value: string[];
  }>;
  l: string;
  tSpeakUrl?: string;
  speakUrl?: string;
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
 * 有道词典服务实现
 * 提供单词查询、释义显示、查询历史记录和缓存功能
 */
export class YoudaoDictionaryService implements DictionaryService {
  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly baseUrl = 'https://openapi.youdao.com/api';
  
  // 查询历史记录 (存储在内存中，可以后续扩展到数据库)
  private queryHistory: QueryHistory[] = [];
  
  // 缓存机制 (存储在内存中，可以后续扩展到localStorage)
  private cache = new Map<string, CacheItem>();
  private readonly cacheExpireTime = 24 * 60 * 60 * 1000; // 24小时缓存
  private readonly maxCacheSize = 1000; // 最大缓存条目数
  
  constructor(appKey: string, appSecret: string) {
    this.appKey = appKey;
    this.appSecret = appSecret;
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
      // 调用有道词典API
      const apiResponse = await this.callYoudaoApi(normalizedWord);
      
      // 解析API响应
      const wordDefinition = this.parseApiResponse(apiResponse, normalizedWord);
      
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
   * 调用有道词典API
   * @param word 要查询的单词
   * @returns API响应
   */
  private async callYoudaoApi(word: string): Promise<YoudaoApiResponse> {
    const salt = Date.now().toString();
    const curtime = Math.round(Date.now() / 1000).toString();
    
    // 生成签名
    const sign = this.generateSign(this.appKey, word, salt, curtime, this.appSecret);
    
    const params = new URLSearchParams({
      q: word,
      from: 'en',
      to: 'zh-CHS',
      appKey: this.appKey,
      salt,
      sign,
      signType: 'v3',
      curtime
    });

    const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new AppError({
        type: ErrorType.NETWORK_ERROR,
        message: `网络请求失败: ${response.status} ${response.statusText}`,
        details: { status: response.status, statusText: response.statusText }
      });
    }

    const data: YoudaoApiResponse = await response.json();
    
    // 检查API错误码
    if (data.errorCode !== '0') {
      const errorMessage = this.getErrorMessage(data.errorCode);
      throw new AppError({
        type: ErrorType.API_ERROR,
        message: errorMessage,
        details: { errorCode: data.errorCode, query: word }
      });
    }

    return data;
  }

  /**
   * 生成有道API签名
   */
  private generateSign(appKey: string, query: string, salt: string, curtime: string, appSecret: string): string {
    const input = query.length <= 20 ? query : query.substring(0, 10) + query.length + query.substring(query.length - 10);
    const str = appKey + input + salt + curtime + appSecret;
    
    // 使用Web Crypto API生成SHA256哈希
    return this.sha256(str);
  }

  /**
   * SHA256哈希函数
   */
  private sha256(str: string): string {
    return CryptoJS.SHA256(str).toString(CryptoJS.enc.Hex);
  }

  /**
   * 解析API响应为标准格式
   */
  private parseApiResponse(response: YoudaoApiResponse, word: string): WordDefinition {
    const definitions: Definition[] = [];
    
    // 解析基本释义
    if (response.basic?.explains) {
      response.basic.explains.forEach(explain => {
        // 尝试解析词性和释义
        const match = explain.match(/^([a-z]+\.)\s*(.+)$/);
        if (match) {
          definitions.push({
            partOfSpeech: match[1],
            meaning: match[2],
          });
        } else {
          definitions.push({
            partOfSpeech: '',
            meaning: explain,
          });
        }
      });
    }

    // 如果没有基本释义，使用翻译结果
    if (definitions.length === 0 && response.translation) {
      definitions.push({
        partOfSpeech: '',
        meaning: response.translation.join('; '),
      });
    }

    // 收集例句
    const examples: string[] = [];
    if (response.web) {
      response.web.forEach(webItem => {
        if (webItem.value && webItem.value.length > 0) {
          examples.push(`${webItem.key}: ${webItem.value.join(', ')}`);
        }
      });
    }

    return {
      word: word,
      phonetic: response.basic?.phonetic || response.basic?.['us-phonetic'] || response.basic?.['uk-phonetic'],
      pronunciation: response.speakUrl || response.tSpeakUrl,
      definitions,
      examples: examples.slice(0, 3), // 限制例句数量
    };
  }

  /**
   * 获取错误信息
   */
  private getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      '101': '缺少必填的参数',
      '102': '不支持的语言类型',
      '103': '翻译文本过长',
      '104': '不支持的API类型',
      '105': '不支持的签名类型',
      '106': '不支持的响应类型',
      '107': '不支持的传输加密类型',
      '108': 'appKey无效',
      '109': 'batchLog格式不正确',
      '110': '无相关服务的有效实例',
      '111': '开发者账号无效',
      '113': 'q不能为空',
      '201': '解密失败',
      '202': '签名检验失败',
      '203': '访问IP地址不在可访问IP列表',
      '301': '辞典查询失败',
      '302': '翻译查询失败',
      '303': '服务端的其它异常',
      '401': '账户已经欠费',
      '411': '访问频率受限',
      '412': '长请求过于频繁',
    };

    return errorMessages[errorCode] || `未知错误 (${errorCode})`;
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
 * 创建有道词典服务实例
 * @param appKey 有道API应用Key
 * @param appSecret 有道API应用密钥
 * @returns 词典服务实例
 */
export function createYoudaoDictionaryService(appKey: string, appSecret: string): DictionaryService {
  return new YoudaoDictionaryService(appKey, appSecret);
}

/**
 * 模拟词典服务 (用于开发和测试)
 */
export class MockDictionaryService implements DictionaryService {
  private mockData: Record<string, WordDefinition> = {
    'hello': {
      word: 'hello',
      phonetic: '/həˈloʊ/',
      pronunciation: '',
      definitions: [
        {
          partOfSpeech: 'int.',
          meaning: '你好；喂',
        },
        {
          partOfSpeech: 'n.',
          meaning: '表示问候，惊奇或唤起注意时的用语',
        }
      ],
      examples: [
        'Hello, how are you? 你好，你好吗？',
        'Say hello to your parents. 向你的父母问好。'
      ]
    },
    'world': {
      word: 'world',
      phonetic: '/wɜːrld/',
      pronunciation: '',
      definitions: [
        {
          partOfSpeech: 'n.',
          meaning: '世界；地球；世人；世间',
        }
      ],
      examples: [
        'The world is beautiful. 世界是美丽的。'
      ]
    }
  };

  async lookupWord(word: string): Promise<WordDefinition> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const normalizedWord = word.toLowerCase().trim();
    const result = this.mockData[normalizedWord];
    
    if (!result) {
      throw new AppError({
        type: ErrorType.API_ERROR,
        message: `未找到单词 "${word}" 的释义`,
        details: { word }
      });
    }

    return result;
  }

  async getWordPronunciation(word: string): Promise<string> {
    const definition = await this.lookupWord(word);
    return definition.pronunciation || '';
  }

  async searchWords(query: string, limit: number = 10): Promise<WordDefinition[]> {
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return [];
    }
    
    const normalizedQuery = query.toLowerCase();
    const results = Object.values(this.mockData)
      .filter(def => def.word.includes(normalizedQuery))
      .slice(0, limit);
    
    return results;
  }
}