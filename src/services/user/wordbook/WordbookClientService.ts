import { 
  Word, 
  WordAddReason, 
  WordQueryParams 
} from '@/types';

/**
 * 客户端单词本服务类
 * 使用 API 调用而不是直接数据库操作
 */
export class WordbookClientService {
  private baseUrl = '/api/wordbook';

  /**
   * 获取单词列表
   */
  public async getWordsList(params?: WordQueryParams): Promise<Word[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.proficiencyLevel !== undefined) {
        searchParams.append('proficiency_level', params.proficiencyLevel.toString());
      }
      if (params?.addReason) {
        searchParams.append('add_reason', params.addReason);
      }
      if (params?.needReview) {
        searchParams.append('need_review', 'true');
      }
      if (params?.search) {
        searchParams.append('search', params.search);
      }
      if (params?.limit) {
        searchParams.append('limit', params.limit.toString());
      }
      if (params?.offset) {
        searchParams.append('offset', params.offset.toString());
      }

      const url = searchParams.toString() ? `${this.baseUrl}?${searchParams}` : this.baseUrl;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`获取单词列表失败: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '获取单词列表失败');
      }

      // 转换日期字段
      return result.data.map((word: any) => this.convertRawWordToWord(word));
    } catch (error) {
      console.error('获取单词列表失败:', error);
      throw error;
    }
  }

  /**
   * 智能添加单词
   */
  public async smartAddWord(
    word: string,
    definition: string,
    addReason: WordAddReason,
    pronunciation?: string
  ): Promise<Word> {
    try {
      // 首先检查单词是否已存在
      const existingWords = await this.getWordsList({ search: word.toLowerCase().trim() });
      const existingWord = existingWords.find(w => w.word === word.toLowerCase().trim());
      
      if (existingWord) {
        // 单词已存在，可以选择更新添加原因或直接返回
        console.log('单词已存在:', existingWord);
        return existingWord;
      }

      // 添加新单词
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          word: word.toLowerCase().trim(),
          definition,
          pronunciation,
          addReason
        }),
      });

      if (!response.ok) {
        throw new Error(`添加单词失败: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '添加单词失败');
      }

      return result.data;
    } catch (error) {
      console.error('添加单词失败:', error);
      throw error;
    }
  }

  /**
   * 更新单词熟练度
   */
  public async updateWordProficiency(
    wordId: number, 
    proficiencyLevel: number,
    reviewCount?: number,
    lastReviewAt?: string,
    nextReviewAt?: string
  ): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: wordId,
          proficiencyLevel,
          reviewCount,
          lastReviewAt,
          nextReviewAt
        }),
      });

      if (!response.ok) {
        throw new Error(`更新单词熟练度失败: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '更新单词熟练度失败');
      }
    } catch (error) {
      console.error('更新单词熟练度失败:', error);
      throw error;
    }
  }

  /**
   * 删除单词
   */
  public async removeWordFromBook(wordId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}?id=${wordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`删除单词失败: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '删除单词失败');
      }
    } catch (error) {
      console.error('删除单词失败:', error);
      throw error;
    }
  }

  /**
   * 获取需要复习的单词
   */
  public async getWordsForReview(): Promise<Word[]> {
    return this.getWordsList({ needReview: true });
  }

  /**
   * 根据单词文本获取单词
   */
  public async getWordByText(word: string): Promise<Word | null> {
    try {
      const words = await this.getWordsList({ search: word.toLowerCase().trim() });
      return words.find(w => w.word === word.toLowerCase().trim()) || null;
    } catch (error) {
      console.error('根据文本获取单词失败:', error);
      return null;
    }
  }

  /**
   * 处理复习结果并更新单词状态
   */
  public async processReviewResult(
    wordId: number, 
    result: 'unknown' | 'familiar' | 'known'
  ): Promise<Word> {
    try {
      // 获取当前单词信息
      const allWords = await this.getWordsList();
      const word = allWords.find(w => w.id === wordId);
      
      if (!word) {
        throw new Error(`单词不存在: ID ${wordId}`);
      }

      let newProficiencyLevel = word.proficiencyLevel;
      let nextReviewAt: Date;

      switch (result) {
        case 'unknown':
          newProficiencyLevel = Math.max(0, word.proficiencyLevel - 1);
          nextReviewAt = new Date(); // 立即复习
          break;
          
        case 'familiar':
          newProficiencyLevel = Math.max(0, word.proficiencyLevel);
          nextReviewAt = new Date();
          nextReviewAt.setHours(nextReviewAt.getHours() + 2); // 2小时后重新复习
          break;
          
        case 'known':
          newProficiencyLevel = Math.min(5, word.proficiencyLevel + 1);
          nextReviewAt = this.calculateNextReviewDate(newProficiencyLevel);
          break;
          
        default:
          throw new Error(`未知的复习结果: ${result}`);
      }

      // 更新单词状态
      await this.updateWordProficiency(
        wordId,
        newProficiencyLevel,
        word.reviewCount + 1,
        new Date().toISOString(),
        nextReviewAt.toISOString()
      );

      // 记录学习活动
      await this.recordLearningActivity({
        activityType: 'reading',
        word: word.word,
        accuracyScore: result === 'known' ? 1 : result === 'familiar' ? 0.7 : 0.3,
        timeSpent: 5 // 设置一个合理的默认时间（秒）
      });

      // 重新获取更新后的单词信息
      const updatedWords = await this.getWordsList();
      const updatedWord = updatedWords.find(w => w.id === wordId);
      
      return updatedWord || word;

    } catch (error) {
      console.error('处理复习结果失败:', error);
      throw error;
    }
  }

  /**
   * 计算下次复习时间
   */
  private calculateNextReviewDate(proficiencyLevel: number): Date {
    const intervals = [0, 1, 3, 7, 15, 30]; // 天数
    const now = new Date();
    const intervalDays = intervals[proficiencyLevel] || 0;
    
    if (intervalDays === 0) {
      return now;
    }

    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + intervalDays);
    
    return nextReview;
  }

  /**
   * 记录学习活动
   */
  private async recordLearningActivity(activity: {
    activityType: string;
    word: string;
    accuracyScore: number;
    timeSpent: number;
  }): Promise<void> {
    try {
      const response = await fetch('/api/learning-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'record_activity',
          data: activity
        }),
      });

      if (!response.ok) {
        console.error('记录学习活动失败:', response.statusText);
      }
    } catch (error) {
      console.error('记录学习活动失败:', error);
    }
  }

  /**
   * 获取单词统计信息
   */
  public async getWordStats(): Promise<{
    totalWords: number;
    masteredWords: number;
    needReviewWords: number;
    wordsByReason: Record<WordAddReason, number>;
    wordsByProficiency: Record<number, number>;
  }> {
    try {
      const allWords = await this.getWordsList();
      const reviewWords = await this.getWordsForReview();

      const stats = {
        totalWords: allWords.length,
        masteredWords: allWords.filter(w => w.proficiencyLevel >= 4).length,
        needReviewWords: reviewWords.length,
        wordsByReason: {
          'translation_lookup': 0,
          'pronunciation_error': 0,
          'listening_difficulty': 0
        } as Record<WordAddReason, number>,
        wordsByProficiency: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>
      };

      // 统计按添加原因分组
      allWords.forEach(word => {
        stats.wordsByReason[word.addReason] = (stats.wordsByReason[word.addReason] || 0) + 1;
      });

      // 统计按熟练度分组
      allWords.forEach(word => {
        stats.wordsByProficiency[word.proficiencyLevel] = (stats.wordsByProficiency[word.proficiencyLevel] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('获取单词统计信息失败:', error);
      throw error;
    }
  }

  /**
   * 转换原始数据库记录为Word对象
   */
  private convertRawWordToWord(rawWord: any): Word {
    return {
      id: rawWord.id,
      word: rawWord.word,
      definition: rawWord.definition,
      pronunciation: rawWord.pronunciation || undefined,
      addReason: rawWord.add_reason,
      proficiencyLevel: rawWord.proficiency_level || 0,
      reviewCount: rawWord.review_count || 0,
      lastReviewAt: rawWord.last_review_at ? new Date(rawWord.last_review_at) : undefined,
      nextReviewAt: rawWord.next_review_at ? new Date(rawWord.next_review_at) : undefined,
      createdAt: new Date(rawWord.created_at)
    };
  }
}