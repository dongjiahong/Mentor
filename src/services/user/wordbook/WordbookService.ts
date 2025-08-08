import { StorageService } from '../../core/storage/StorageService';
import { 
  Word, 
  WordAddReason, 
  WordQueryParams,
  DatabaseError,
  DatabaseErrorType
} from '@/types';

/**
 * 记忆曲线算法配置
 * 基于艾宾浩斯遗忘曲线和SuperMemo算法
 */
interface MemoryConfig {
  // 不同熟练度等级的复习间隔（天）
  intervals: number[];
  // 熟练度提升的准确率阈值
  accuracyThreshold: number;
  // 熟练度降低的准确率阈值
  degradeThreshold: number;
}

const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  // 0级: 立即, 1级: 1天, 2级: 3天, 3级: 7天, 4级: 15天, 5级: 30天
  intervals: [0, 1, 3, 7, 15, 30],
  accuracyThreshold: 0.8, // 80%准确率提升熟练度
  degradeThreshold: 0.5,  // 50%以下准确率降低熟练度
};

/**
 * 单词本服务类
 * 负责单词的添加、管理、复习安排和熟练度更新
 */
export class WordbookService {
  private storageService: StorageService;
  private memoryConfig: MemoryConfig;

  constructor(storageService?: StorageService, memoryConfig?: MemoryConfig) {
    this.storageService = storageService || new StorageService();
    this.memoryConfig = memoryConfig || DEFAULT_MEMORY_CONFIG;
  }

  /**
   * 初始化单词本服务
   */
  public async initialize(): Promise<void> {
    await this.storageService.initialize();
  }

  // ==================== 单词添加逻辑 ====================

  /**
   * 自动添加单词到单词本（基于查询翻译）
   */
  public async addWordFromTranslationLookup(
    word: string, 
    definition: string, 
    pronunciation?: string
  ): Promise<Word> {
    return this.addWordToBook({
      word: word.toLowerCase().trim(),
      definition,
      pronunciation,
      addReason: 'translation_lookup',
      proficiencyLevel: 0,
      reviewCount: 0,
      nextReviewAt: this.calculateNextReviewDate(0)
    });
  }

  /**
   * 自动添加单词到单词本（基于发音错误）
   */
  public async addWordFromPronunciationError(
    word: string, 
    definition: string, 
    pronunciation?: string
  ): Promise<Word> {
    return this.addWordToBook({
      word: word.toLowerCase().trim(),
      definition,
      pronunciation,
      addReason: 'pronunciation_error',
      proficiencyLevel: 0,
      reviewCount: 0,
      nextReviewAt: this.calculateNextReviewDate(0)
    });
  }

  /**
   * 自动添加单词到单词本（基于听力困难）
   */
  public async addWordFromListeningDifficulty(
    word: string, 
    definition: string, 
    pronunciation?: string
  ): Promise<Word> {
    return this.addWordToBook({
      word: word.toLowerCase().trim(),
      definition,
      pronunciation,
      addReason: 'listening_difficulty',
      proficiencyLevel: 0,
      reviewCount: 0,
      nextReviewAt: this.calculateNextReviewDate(0)
    });
  }

  /**
   * 智能添加单词（检查是否已存在，如果存在则更新添加原因）
   */
  public async smartAddWord(
    word: string,
    definition: string,
    addReason: WordAddReason,
    pronunciation?: string
  ): Promise<Word> {
    const existingWord = await this.storageService.getWordByText(word.toLowerCase().trim());
    
    if (existingWord) {
      // 如果单词已存在，更新添加原因（如果新原因更严重）
      const reasonPriority = {
        'translation_lookup': 1,
        'listening_difficulty': 2,
        'pronunciation_error': 3
      };
      
      if (reasonPriority[addReason] > reasonPriority[existingWord.addReason]) {
        return this.updateWordAddReason(existingWord.id, addReason);
      }
      
      return existingWord;
    }

    // 添加新单词
    switch (addReason) {
      case 'translation_lookup':
        return this.addWordFromTranslationLookup(word, definition, pronunciation);
      case 'pronunciation_error':
        return this.addWordFromPronunciationError(word, definition, pronunciation);
      case 'listening_difficulty':
        return this.addWordFromListeningDifficulty(word, definition, pronunciation);
      default:
        throw new Error(`未知的添加原因: ${addReason}`);
    }
  }

  // ==================== 单词查询和管理 ====================

  /**
   * 获取单词详情
   */
  public async getWord(id: number): Promise<Word | null> {
    return this.storageService.getWordById(id);
  }

  /**
   * 根据单词文本获取单词
   */
  public async getWordByText(word: string): Promise<Word | null> {
    return this.storageService.getWordByText(word.toLowerCase().trim());
  }

  /**
   * 获取单词列表
   */
  public async getWordsList(params?: WordQueryParams): Promise<Word[]> {
    try {
      let sql = 'SELECT * FROM wordbook WHERE 1=1';
      const sqlParams: any[] = [];

      // 构建查询条件
      if (params?.proficiencyLevel !== undefined) {
        sql += ' AND proficiency_level = ?';
        sqlParams.push(params.proficiencyLevel);
      }

      if (params?.addReason) {
        sql += ' AND add_reason = ?';
        sqlParams.push(params.addReason);
      }

      if (params?.needReview) {
        sql += ' AND (next_review_at IS NULL OR next_review_at <= datetime("now"))';
      }

      if (params?.search) {
        sql += ' AND (word LIKE ? OR definition LIKE ?)';
        const searchTerm = `%${params.search}%`;
        sqlParams.push(searchTerm, searchTerm);
      }

      // 排序
      sql += ' ORDER BY created_at DESC';

      // 分页
      if (params?.limit) {
        sql += ' LIMIT ?';
        sqlParams.push(params.limit);
        
        if (params?.offset) {
          sql += ' OFFSET ?';
          sqlParams.push(params.offset);
        }
      }

      const results = this.storageService.getDatabaseConnection().exec(sql, sqlParams);
      return results.map((row: any) => this.storageService.mapRowToWord(row));
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取单词列表失败',
        details: error
      });
    }
  }

  /**
   * 获取需要复习的单词
   */
  public async getWordsForReview(): Promise<Word[]> {
    return this.storageService.getWordsForReview();
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
      // 总单词数
      const totalResult = this.storageService.getDatabaseConnection().exec('SELECT COUNT(*) as count FROM wordbook');
      const totalWords = (totalResult[0] as any).count as number;

      // 掌握的单词数（熟练度 >= 4）
      const masteredResult = this.storageService.getDatabaseConnection().exec('SELECT COUNT(*) as count FROM wordbook WHERE proficiency_level >= 4');
      const masteredWords = (masteredResult[0] as any).count as number;

      // 需要复习的单词数
      const reviewResult = this.storageService.getDatabaseConnection().exec('SELECT COUNT(*) as count FROM wordbook WHERE next_review_at IS NULL OR next_review_at <= datetime("now")');
      const needReviewWords = (reviewResult[0] as any).count as number;

      // 按添加原因分组
      const reasonResults = this.storageService.getDatabaseConnection().exec('SELECT add_reason, COUNT(*) as count FROM wordbook GROUP BY add_reason');
      const wordsByReason: Record<WordAddReason, number> = {
        'translation_lookup': 0,
        'pronunciation_error': 0,
        'listening_difficulty': 0
      };
      reasonResults.forEach((row: any) => {
        wordsByReason[row.add_reason as WordAddReason] = row.count as number;
      });

      // 按熟练度分组
      const proficiencyResults = this.storageService.getDatabaseConnection().exec('SELECT proficiency_level, COUNT(*) as count FROM wordbook GROUP BY proficiency_level');
      const wordsByProficiency: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      proficiencyResults.forEach((row: any) => {
        wordsByProficiency[row.proficiency_level as number] = row.count as number;
      });

      return {
        totalWords,
        masteredWords,
        needReviewWords,
        wordsByReason,
        wordsByProficiency
      };
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取单词统计信息失败',
        details: error
      });
    }
  }

  // ==================== 熟练度管理 ====================

  /**
   * 更新单词熟练度
   */
  public async updateWordProficiency(
    wordId: number, 
    accuracyScore: number,
    timeSpent?: number
  ): Promise<Word> {
    const word = await this.getWord(wordId);
    if (!word) {
      throw new Error(`单词不存在: ID ${wordId}`);
    }

    // 根据准确率调整熟练度
    let newProficiencyLevel = word.proficiencyLevel;
    
    if (accuracyScore >= this.memoryConfig.accuracyThreshold) {
      // 准确率高，提升熟练度
      newProficiencyLevel = Math.min(5, word.proficiencyLevel + 1);
    } else if (accuracyScore < this.memoryConfig.degradeThreshold) {
      // 准确率低，降低熟练度
      newProficiencyLevel = Math.max(0, word.proficiencyLevel - 1);
    }

    // 计算下次复习时间
    const nextReviewAt = this.calculateNextReviewDate(newProficiencyLevel);
    
    // 更新数据库
    try {
      this.storageService.getDatabaseConnection().run(
        `UPDATE wordbook SET 
         proficiency_level = ?, 
         review_count = review_count + 1, 
         last_review_at = CURRENT_TIMESTAMP, 
         next_review_at = ? 
         WHERE id = ?`,
        [newProficiencyLevel, nextReviewAt.toISOString(), wordId]
      );

      // 记录学习活动
      await this.storageService.recordLearningActivity({
        activityType: 'reading', // 可以根据实际情况调整
        word: word.word,
        accuracyScore,
        timeSpent: timeSpent || 0
      });

      // 保存到持久化存储
      this.save();

      // 返回更新后的单词
      const updatedWord = await this.getWord(wordId);
      if (!updatedWord) {
        throw new Error('更新单词后无法获取数据');
      }

      return updatedWord;
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '更新单词熟练度失败',
        details: error
      });
    }
  }

  /**
   * 手动设置单词熟练度
   */
  public async setWordProficiency(wordId: number, proficiencyLevel: number): Promise<Word> {
    if (proficiencyLevel < 0 || proficiencyLevel > 5) {
      throw new Error('熟练度等级必须在0-5之间');
    }

    const word = await this.getWord(wordId);
    if (!word) {
      throw new Error(`单词不存在: ID ${wordId}`);
    }

    const nextReviewAt = this.calculateNextReviewDate(proficiencyLevel);

    try {
      this.storageService.getDatabaseConnection().run(
        `UPDATE wordbook SET 
         proficiency_level = ?, 
         next_review_at = ? 
         WHERE id = ?`,
        [proficiencyLevel, nextReviewAt.toISOString(), wordId]
      );

      // 保存到持久化存储
      this.save();

      const updatedWord = await this.getWord(wordId);
      if (!updatedWord) {
        throw new Error('更新单词后无法获取数据');
      }

      return updatedWord;
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '设置单词熟练度失败',
        details: error
      });
    }
  }

  /**
   * 标记单词为已掌握
   */
  public async markWordAsMastered(wordId: number): Promise<Word> {
    return this.setWordProficiency(wordId, 5);
  }

  /**
   * 重置单词学习进度
   */
  public async resetWordProgress(wordId: number): Promise<Word> {
    return this.setWordProficiency(wordId, 0);
  }

  // ==================== 单词删除和修改 ====================

  /**
   * 从单词本中删除单词
   */
  public async removeWordFromBook(wordId: number): Promise<void> {
    try {
      this.storageService.getDatabaseConnection().run('DELETE FROM wordbook WHERE id = ?', [wordId]);
      // 保存到持久化存储
      this.save();
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '删除单词失败',
        details: error
      });
    }
  }

  /**
   * 更新单词定义
   */
  public async updateWordDefinition(wordId: number, definition: string): Promise<Word> {
    try {
      this.storageService.getDatabaseConnection().run(
        'UPDATE wordbook SET definition = ? WHERE id = ?',
        [definition, wordId]
      );

      // 保存到持久化存储
      this.save();

      const updatedWord = await this.getWord(wordId);
      if (!updatedWord) {
        throw new Error('更新单词后无法获取数据');
      }

      return updatedWord;
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '更新单词定义失败',
        details: error
      });
    }
  }

  /**
   * 更新单词发音
   */
  public async updateWordPronunciation(wordId: number, pronunciation: string): Promise<Word> {
    try {
      this.storageService.getDatabaseConnection().run(
        'UPDATE wordbook SET pronunciation = ? WHERE id = ?',
        [pronunciation, wordId]
      );

      // 保存到持久化存储
      this.save();

      const updatedWord = await this.getWord(wordId);
      if (!updatedWord) {
        throw new Error('更新单词后无法获取数据');
      }

      return updatedWord;
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '更新单词发音失败',
        details: error
      });
    }
  }

  /**
   * 更新单词添加原因
   */
  public async updateWordAddReason(wordId: number, addReason: WordAddReason): Promise<Word> {
    try {
      this.storageService.getDatabaseConnection().run(
        'UPDATE wordbook SET add_reason = ? WHERE id = ?',
        [addReason, wordId]
      );

      // 保存到持久化存储
      this.save();

      const updatedWord = await this.getWord(wordId);
      if (!updatedWord) {
        throw new Error('更新单词后无法获取数据');
      }

      return updatedWord;
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '更新单词添加原因失败',
        details: error
      });
    }
  }

  // ==================== 记忆曲线算法 ====================

  /**
   * 计算下次复习时间
   * 基于艾宾浩斯遗忘曲线和SuperMemo算法
   */
  private calculateNextReviewDate(proficiencyLevel: number): Date {
    const now = new Date();
    const intervalDays = this.memoryConfig.intervals[proficiencyLevel] || 0;
    
    if (intervalDays === 0) {
      // 熟练度为0，立即复习
      return now;
    }

    // 计算下次复习时间
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + intervalDays);
    
    return nextReview;
  }

  /**
   * 获取推荐的复习单词（基于记忆曲线）
   */
  public async getRecommendedReviewWords(limit: number = 20): Promise<Word[]> {
    try {
      // 优先级：过期时间越长的单词优先级越高
      const sql = `
        SELECT * FROM wordbook 
        WHERE next_review_at IS NULL OR next_review_at <= datetime("now")
        ORDER BY 
          CASE 
            WHEN next_review_at IS NULL THEN 0
            ELSE julianday("now") - julianday(next_review_at)
          END DESC,
          proficiency_level ASC,
          last_review_at ASC
        LIMIT ?
      `;
      
      const results = this.storageService.getDatabaseConnection().exec(sql, [limit]);
      return results.map((row: unknown) => this.storageService.mapRowToWord(row));
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取推荐复习单词失败',
        details: error
      });
    }
  }

  /**
   * 获取今日复习队列（只包含当天和之前需要复习的单词）
   */
  public async getTodayReviewQueue(): Promise<Word[]> {
    try {
      const sql = `
        SELECT * FROM wordbook 
        WHERE next_review_at IS NULL OR date(next_review_at) <= date("now")
        ORDER BY 
          CASE 
            WHEN next_review_at IS NULL THEN 0
            ELSE julianday(next_review_at)
          END ASC,
          proficiency_level ASC,
          created_at ASC
      `;
      
      const results = this.storageService.getDatabaseConnection().exec(sql);
      return results.map((row: unknown) => this.storageService.mapRowToWord(row));
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取今日复习队列失败',
        details: error
      });
    }
  }

  /**
   * 处理复习结果并更新单词状态
   */
  public async processReviewResult(
    wordId: number, 
    result: 'unknown' | 'familiar' | 'known'
  ): Promise<Word> {
    const word = await this.getWord(wordId);
    if (!word) {
      throw new Error(`单词不存在: ID ${wordId}`);
    }

    let newProficiencyLevel = word.proficiencyLevel;
    let nextReviewAt: Date;

    switch (result) {
      case 'unknown':
        // 不会：熟练度降低，立即重新排队到今天复习队列的后面
        newProficiencyLevel = Math.max(0, word.proficiencyLevel - 1);
        nextReviewAt = new Date(); // 立即复习
        break;
        
      case 'familiar':
        // 查看释义：表明知道但不确定，需要重新排队
        // 熟练度保持不变或略微降低
        newProficiencyLevel = Math.max(0, word.proficiencyLevel);
        nextReviewAt = new Date();
        nextReviewAt.setHours(nextReviewAt.getHours() + 2); // 2小时后重新复习
        break;
        
      case 'known':
        // 记忆：表明了解单词，根据记忆曲线设置下次复习时间
        newProficiencyLevel = Math.min(5, word.proficiencyLevel + 1);
        nextReviewAt = this.calculateNextReviewDate(newProficiencyLevel);
        break;
        
      default:
        throw new Error(`未知的复习结果: ${result}`);
    }

    // 更新数据库
    try {
      this.storageService.getDatabaseConnection().run(
        `UPDATE wordbook SET 
         proficiency_level = ?, 
         review_count = review_count + 1, 
         last_review_at = CURRENT_TIMESTAMP, 
         next_review_at = ? 
         WHERE id = ?`,
        [newProficiencyLevel, nextReviewAt.toISOString(), wordId]
      );

      // 记录学习活动
      await this.storageService.recordLearningActivity({
        activityType: 'reading',
        word: word.word,
        accuracyScore: result === 'known' ? 1 : result === 'familiar' ? 0.7 : 0.3,
        timeSpent: 0
      });

      // 保存到持久化存储
      this.save();

      // 返回更新后的单词
      const updatedWord = await this.getWord(wordId);
      if (!updatedWord) {
        throw new Error('更新单词后无法获取数据');
      }

      return updatedWord;
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '处理复习结果失败',
        details: error
      });
    }
  }

  /**
   * 批量更新单词复习状态
   */
  public async batchUpdateReviewStatus(
    wordIds: number[], 
    accuracyScores: number[]
  ): Promise<Word[]> {
    if (wordIds.length !== accuracyScores.length) {
      throw new Error('单词ID数组和准确率数组长度不匹配');
    }

    const updatedWords: Word[] = [];
    
    // 使用事务确保数据一致性
    await this.storageService.getDatabaseConnection().transaction(async () => {
      for (let i = 0; i < wordIds.length; i++) {
        const updatedWord = await this.updateWordProficiency(wordIds[i], accuracyScores[i]);
        updatedWords.push(updatedWord);
      }
    });

    // 保存到持久化存储
    this.save();

    return updatedWords;
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 添加单词到单词本的通用方法
   */
  private async addWordToBook(wordData: Omit<Word, 'id' | 'createdAt'>): Promise<Word> {
    const word = await this.storageService.addWordToBook(wordData);
    this.save(); // 自动保存到持久化存储
    return word;
  }

  /**
   * 保存数据到持久化存储
   */
  public save(): void {
    this.storageService.save();
  }

  /**
   * 关闭服务
   */
  public close(): void {
    this.storageService.close();
  }
}