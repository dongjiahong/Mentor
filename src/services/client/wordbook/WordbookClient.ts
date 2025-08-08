import { 
  Word, 
  WordAddReason, 
  WordQueryParams 
} from '@/types';
import { ApiClient } from '../base/ApiClient';

/**
 * 单词本客户端服务
 * 纯客户端实现，通过 API 与服务端通信
 */
export class WordbookClient {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient('/api');
  }

  /**
   * 获取单词列表
   */
  async getWordsList(params?: WordQueryParams): Promise<Word[]> {
    const searchParams: Record<string, string> = {};
    
    if (params?.proficiencyLevel !== undefined) {
      searchParams.proficiency_level = params.proficiencyLevel.toString();
    }
    if (params?.addReason) {
      searchParams.add_reason = params.addReason;
    }
    if (params?.needReview) {
      searchParams.need_review = 'true';
    }
    if (params?.search) {
      searchParams.search = params.search;
    }
    if (params?.limit) {
      searchParams.limit = params.limit.toString();
    }
    if (params?.offset) {
      searchParams.offset = params.offset.toString();
    }

    return this.apiClient.get<Word[]>('/wordbook', searchParams);
  }

  /**
   * 智能添加单词
   */
  async smartAddWord(
    word: string, 
    definition: string,
    reason: WordAddReason, 
    pronunciation?: string
  ): Promise<Word> {
    const requestData = {
      action: 'add_word',
      data: {
        word: word.toLowerCase().trim(),
        addReason: reason,
        context: definition,
        pronunciation
      }
    };
    console.log('WordbookClient - 发送请求数据:', JSON.stringify(requestData, null, 2));
    return this.apiClient.post<Word>('/wordbook', requestData);
  }

  /**
   * 更新单词熟练度
   */
  async updateWordProficiency(
    wordId: number, 
    proficiencyLevel: number,
    reviewCount?: number,
    lastReviewAt?: string,
    nextReviewAt?: string
  ): Promise<Word> {
    return this.apiClient.post<Word>('/wordbook', {
      action: 'update_proficiency',
      data: {
        wordId,
        newProficiency: proficiencyLevel
      }
    });
  }

  /**
   * 从单词本中移除单词
   */
  async removeWordFromBook(wordId: number): Promise<void> {
    await this.apiClient.post('/wordbook', {
      action: 'remove_word',
      data: { wordId }
    });
  }

  /**
   * 获取需要复习的单词
   */
  async getWordsForReview(): Promise<Word[]> {
    return this.getWordsList({ needReview: true });
  }

  /**
   * 根据单词文本获取单词
   */
  async getWordByText(word: string): Promise<Word | null> {
    const words = await this.getWordsList({ 
      search: word.toLowerCase().trim(), 
      limit: 1 
    });
    return words.length > 0 ? words[0] : null;
  }

  /**
   * 处理复习结果
   */
  async processReviewResult(
    wordId: number,
    result: 'unknown' | 'familiar' | 'known'
  ): Promise<Word> {
    return this.apiClient.post<Word>('/wordbook', {
      action: 'process_review',
      data: {
        wordId,
        result
      }
    });
  }

  /**
   * 获取单词统计
   */
  async getWordStats(): Promise<{
    totalWords: number;
    masteredWords: number;
    needReviewWords: number;
    wordsByReason: Record<WordAddReason, number>;
    wordsByProficiency: Record<number, number>;
    averageProficiency: number;
    todayReviewCount: number;
    streakDays: number;
  }> {
    return this.apiClient.post('/wordbook', {
      action: 'get_stats'
    });
  }

  /**
   * 获取学习建议
   */
  async getLearningRecommendations(): Promise<{
    dailyReviewTarget: number;
    focusAreas: string[];
    suggestedActivities: string[];
    difficultyAdjustments: string[];
  }> {
    return this.apiClient.post('/wordbook', {
      action: 'get_recommendations'
    });
  }

  /**
   * 批量更新单词状态
   */
  async batchUpdateWords(updates: Array<{
    wordId: number;
    proficiency?: number;
    reviewResult?: 'correct' | 'incorrect' | 'partially_correct';
  }>): Promise<Word[]> {
    return this.apiClient.post('/wordbook', {
      action: 'batch_update',
      data: { updates }
    });
  }

  /**
   * 导出单词本数据
   */
  async exportWordbook(format: 'json' | 'csv' = 'json'): Promise<string> {
    return this.apiClient.post('/wordbook', {
      action: 'export',
      data: { format }
    });
  }

  /**
   * 导入单词本数据
   */
  async importWordbook(data: string, format: 'json' | 'csv' = 'json'): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    return this.apiClient.post('/wordbook', {
      action: 'import',
      data: { data, format }
    });
  }

  /**
   * 获取单个单词信息
   */
  async getWord(wordId: number): Promise<Word | null> {
    try {
      const words = await this.getWordsList();
      return words.find(w => w.id === wordId) || null;
    } catch (error) {
      console.error('获取单词失败:', error);
      return null;
    }
  }

  /**
   * 搜索单词建议
   */
  async searchWordSuggestions(query: string, limit: number = 10): Promise<string[]> {
    return this.apiClient.post('/wordbook', {
      action: 'search_suggestions',
      data: { query, limit }
    });
  }

  /**
   * 更新单词定义
   */
  async updateWordDefinition(wordId: number, definition: string): Promise<Word> {
    return this.apiClient.post<Word>('/wordbook', {
      action: 'update_definition',
      data: {
        wordId,
        definition
      }
    });
  }

  /**
   * 更新单词发音
   */
  async updateWordPronunciation(wordId: number, pronunciation: string): Promise<Word> {
    return this.apiClient.post<Word>('/wordbook', {
      action: 'update_pronunciation',
      data: {
        wordId,
        pronunciation
      }
    });
  }
}

// 创建单例实例
export const wordbookClient = new WordbookClient();