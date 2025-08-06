import { 
  UserProfile, 
  AIConfig, 
  LearningContent, 
  Word, 
  LearningRecord, 
  DatabaseError,
  DatabaseErrorType,
  RecordQueryParams,
  LearningStats,
  StatsQueryParams
} from '@/types';

// 简化的数据库接口，用于客户端存储
interface DatabaseConnection {
  exec(sql: string, params?: unknown[]): any[];
  run(sql: string, params?: unknown[]): void;
  initialize(): Promise<void>;
  saveToStorage(): void;
  close(): void;
}

// 模拟数据库连接实现
class MockDatabaseConnection implements DatabaseConnection {
  private data: Map<string, any[]> = new Map();
  private lastInsertId = 0;

  async initialize(): Promise<void> {
    // 初始化表结构
    this.data.set('user_profile', []);
    this.data.set('ai_config', []);
    this.data.set('learning_content', []);
    this.data.set('wordbook', []);
    this.data.set('learning_records', []);
    this.data.set('exam_records', []);
    
    // 加载已保存的数据
    try {
      const savedData = localStorage.getItem('learning_assistant_db');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        Object.entries(parsedData).forEach(([key, value]) => {
          this.data.set(key, value as any[]);
        });
      }
    } catch (error) {
      console.error('加载本地数据失败:', error);
    }
  }

  exec(sql: string, params: unknown[] = []): any[] {
    // 简化的SQL执行逻辑
    if (sql.includes('SELECT last_insert_rowid()')) {
      return [{ id: this.lastInsertId }];
    }
    
    if (sql.startsWith('SELECT')) {
      return this.handleSelect(sql, params);
    }
    
    return [];
  }

  run(sql: string, params: unknown[] = []): void {
    if (sql.startsWith('INSERT')) {
      this.handleInsert(sql, params);
    } else if (sql.startsWith('UPDATE')) {
      this.handleUpdate(sql, params);
    }
  }

  private handleSelect(sql: string, params: unknown[]): any[] {
    // 简化的SELECT处理
    if (sql.includes('user_profile')) {
      return this.data.get('user_profile') || [];
    }
    if (sql.includes('ai_config')) {
      return this.data.get('ai_config') || [];
    }
    if (sql.includes('learning_content')) {
      return this.data.get('learning_content') || [];
    }
    if (sql.includes('wordbook')) {
      const words = this.data.get('wordbook') || [];
      // 模拟一些示例单词数据
      if (words.length === 0) {
        const sampleWords = [
          { id: 1, word: 'hello', definition: '你好', proficiency_level: 4, created_at: new Date().toISOString() },
          { id: 2, word: 'world', definition: '世界', proficiency_level: 3, created_at: new Date().toISOString() },
          { id: 3, word: 'example', definition: '例子', proficiency_level: 5, created_at: new Date().toISOString() }
        ];
        this.data.set('wordbook', sampleWords);
        return sampleWords;
      }
      return words;
    }
    if (sql.includes('learning_records')) {
      return this.data.get('learning_records') || [];
    }
    
    // 处理统计查询
    if (sql.includes('SUM(time_spent)')) {
      const records = this.data.get('learning_records') || [];
      const totalTime = records.reduce((sum: number, record: any) => sum + (record.time_spent || 0), 0);
      return [{ total_time: totalTime }];
    }
    
    if (sql.includes('COUNT(DISTINCT w.word)')) {
      const words = this.data.get('wordbook') || [];
      const totalWords = words.length;
      const masteredWords = words.filter((w: any) => w.proficiency_level >= 4).length;
      return [{ total_words: totalWords, mastered_words: masteredWords }];
    }
    
    if (sql.includes('AVG(accuracy_score)')) {
      const records = this.data.get('learning_records') || [];
      const validRecords = records.filter((r: any) => r.accuracy_score != null);
      const avgAccuracy = validRecords.length > 0 
        ? validRecords.reduce((sum: number, r: any) => sum + r.accuracy_score, 0) / validRecords.length 
        : 0;
      return [{ avg_accuracy: avgAccuracy }];
    }
    
    if (sql.includes('GROUP BY activity_type')) {
      const records = this.data.get('learning_records') || [];
      const grouped = records.reduce((acc: any, record: any) => {
        const type = record.activity_type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(grouped).map(([activity_type, count]) => ({
        activity_type,
        count
      }));
    }
    
    return [];
  }

  private handleInsert(sql: string, params: unknown[]): void {
    this.lastInsertId++;
    const now = new Date().toISOString();
    
    if (sql.includes('user_profile')) {
      const profiles = this.data.get('user_profile') || [];
      profiles.push({
        id: this.lastInsertId,
        english_level: params[0],
        learning_goal: params[1],
        created_at: now,
        updated_at: now
      });
      this.data.set('user_profile', profiles);
    } else if (sql.includes('learning_records')) {
      const records = this.data.get('learning_records') || [];
      records.push({
        id: this.lastInsertId,
        activity_type: params[0],
        content_id: params[1],
        word: params[2],
        accuracy_score: params[3],
        time_spent: params[4],
        created_at: now
      });
      this.data.set('learning_records', records);
    }
    // 其他表的插入逻辑...
  }

  private handleUpdate(sql: string, params: unknown[]): void {
    // 简化的UPDATE处理
    const now = new Date().toISOString();
    
    if (sql.includes('user_profile')) {
      const profiles = this.data.get('user_profile') || [];
      const profile = profiles.find(p => p.id === params[params.length - 1]);
      if (profile) {
        profile.english_level = params[0];
        profile.learning_goal = params[1];
        profile.updated_at = now;
      }
    }
  }

  saveToStorage(): void {
    // 保存到localStorage
    try {
      localStorage.setItem('learning_assistant_db', JSON.stringify(Object.fromEntries(this.data)));
    } catch (error) {
      console.error('保存数据到本地存储失败:', error);
    }
  }

  close(): void {
    this.saveToStorage();
  }

  static getInstance(): MockDatabaseConnection {
    if (!MockDatabaseConnection.instance) {
      MockDatabaseConnection.instance = new MockDatabaseConnection();
    }
    return MockDatabaseConnection.instance;
  }

  private static instance: MockDatabaseConnection;
}

/**
 * 存储服务基础类
 * 提供数据持久化的统一接口
 */
export class StorageService {
  private dbConnection: DatabaseConnection;

  constructor() {
    this.dbConnection = MockDatabaseConnection.getInstance();
  }

  /**
   * 初始化存储服务
   */
  public async initialize(): Promise<void> {
    await this.dbConnection.initialize();
  }

  /**
   * 保存数据到持久化存储
   */
  public save(): void {
    this.dbConnection.saveToStorage();
  }

  /**
   * 关闭存储服务
   */
  public close(): void {
    this.dbConnection.close();
  }

  // ==================== 用户配置相关操作 ====================

  /**
   * 保存用户配置
   */
  public async saveUserProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    try {
      // 检查是否已存在用户配置
      const existing = await this.getUserProfile();
      
      if (existing) {
        // 更新现有配置
        this.dbConnection.run(
          'UPDATE user_profile SET english_level = ?, learning_goal = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [profile.englishLevel, profile.learningGoal, existing.id]
        );
        
        return {
          ...existing,
          ...profile,
          updatedAt: new Date()
        };
      } else {
        // 创建新配置
        this.dbConnection.run(
          'INSERT INTO user_profile (english_level, learning_goal) VALUES (?, ?)',
          [profile.englishLevel, profile.learningGoal]
        );
        
        const newProfile = await this.getUserProfile();
        
        if (!newProfile) {
          throw new Error('创建用户配置后无法获取数据');
        }
        
        return newProfile;
      }
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '保存用户配置失败',
        details: error
      });
    }
  }

  /**
   * 获取用户配置
   */
  public async getUserProfile(): Promise<UserProfile | null> {
    try {
      const results = this.dbConnection.exec('SELECT * FROM user_profile ORDER BY created_at DESC LIMIT 1');
      
      if (results.length === 0) {
        return null;
      }
      
      const row = results[0] as any;
      return {
        id: row.id as number,
        englishLevel: row.english_level as UserProfile['englishLevel'],
        learningGoal: row.learning_goal as UserProfile['learningGoal'],
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      };
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取用户配置失败',
        details: error
      });
    }
  }

  // ==================== AI配置相关操作 ====================

  /**
   * 保存AI配置
   */
  public async saveAIConfig(config: Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIConfig> {
    try {
      // 检查是否已存在AI配置
      const existing = await this.getAIConfig();
      
      if (existing) {
        // 更新现有配置
        this.dbConnection.run(
          'UPDATE ai_config SET api_url = ?, api_key = ?, model_name = ?, temperature = ?, max_tokens = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [config.apiUrl, config.apiKey, config.modelName, config.temperature || 0.7, config.maxTokens || 2000, existing.id]
        );
        
        return {
          ...existing,
          ...config,
          updatedAt: new Date()
        };
      } else {
        // 创建新配置
        this.dbConnection.run(
          'INSERT INTO ai_config (api_url, api_key, model_name, temperature, max_tokens) VALUES (?, ?, ?, ?, ?)',
          [config.apiUrl, config.apiKey, config.modelName, config.temperature || 0.7, config.maxTokens || 2000]
        );
        
        const newConfig = await this.getAIConfig();
        
        if (!newConfig) {
          throw new Error('创建AI配置后无法获取数据');
        }
        
        return newConfig;
      }
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '保存AI配置失败',
        details: error
      });
    }
  }

  /**
   * 获取AI配置
   */
  public async getAIConfig(): Promise<AIConfig | null> {
    try {
      const results = this.dbConnection.exec('SELECT * FROM ai_config ORDER BY created_at DESC LIMIT 1');
      
      if (results.length === 0) {
        return null;
      }
      
      const row = results[0] as any;
      return {
        id: row.id as number,
        apiUrl: row.api_url as string,
        apiKey: row.api_key as string,
        modelName: row.model_name as string,
        temperature: row.temperature as number,
        maxTokens: row.max_tokens as number,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      };
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取AI配置失败',
        details: error
      });
    }
  }

  // ==================== 学习内容相关操作 ====================

  /**
   * 保存学习内容
   */
  public async saveLearningContent(content: Omit<LearningContent, 'id' | 'createdAt'>): Promise<LearningContent> {
    try {
      this.dbConnection.run(
        'INSERT INTO learning_content (content_type, original_text, translation, difficulty_level, topic) VALUES (?, ?, ?, ?, ?)',
        [content.contentType, content.originalText, content.translation, content.difficultyLevel, content.topic || null]
      );
      
      const result = this.dbConnection.exec('SELECT last_insert_rowid() as id')[0] as any;
      const id = result.id as number;
      
      const savedContent = await this.getLearningContentById(id);
      if (!savedContent) {
        throw new Error('保存学习内容后无法获取数据');
      }
      
      return savedContent;
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '保存学习内容失败',
        details: error
      });
    }
  }

  /**
   * 根据ID获取学习内容
   */
  public async getLearningContentById(id: number): Promise<LearningContent | null> {
    try {
      const results = this.dbConnection.exec('SELECT * FROM learning_content WHERE id = ?', [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      const row = results[0] as any;
      return {
        id: row.id as number,
        contentType: row.content_type as LearningContent['contentType'],
        originalText: row.original_text as string,
        translation: row.translation as string,
        difficultyLevel: row.difficulty_level as LearningContent['difficultyLevel'],
        topic: row.topic as string || undefined,
        createdAt: new Date(row.created_at as string)
      };
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取学习内容失败',
        details: error
      });
    }
  }

  // ==================== 单词本相关操作 ====================

  /**
   * 添加单词到单词本
   */
  public async addWordToBook(word: Omit<Word, 'id' | 'createdAt'>): Promise<Word> {
    try {
      // 检查单词是否已存在
      const existing = await this.getWordByText(word.word);
      
      if (existing) {
        // 更新现有单词的信息
        this.dbConnection.run(
          'UPDATE wordbook SET definition = ?, pronunciation = ?, add_reason = ?, proficiency_level = ?, review_count = ?, last_review_at = ?, next_review_at = ? WHERE id = ?',
          [
            word.definition,
            word.pronunciation || null,
            word.addReason,
            word.proficiencyLevel,
            word.reviewCount,
            word.lastReviewAt ? word.lastReviewAt.toISOString() : null,
            word.nextReviewAt ? word.nextReviewAt.toISOString() : null,
            existing.id
          ]
        );
        
        return {
          ...existing,
          ...word
        };
      } else {
        // 添加新单词
        this.dbConnection.run(
          'INSERT INTO wordbook (word, definition, pronunciation, add_reason, proficiency_level, review_count, last_review_at, next_review_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            word.word,
            word.definition,
            word.pronunciation || null,
            word.addReason,
            word.proficiencyLevel,
            word.reviewCount,
            word.lastReviewAt ? word.lastReviewAt.toISOString() : null,
            word.nextReviewAt ? word.nextReviewAt.toISOString() : null
          ]
        );
        
        const result = this.dbConnection.exec('SELECT last_insert_rowid() as id')[0] as any;
        const id = result.id as number;
        
        const savedWord = await this.getWordById(id);
        if (!savedWord) {
          throw new Error('添加单词后无法获取数据');
        }
        
        return savedWord;
      }
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '添加单词到单词本失败',
        details: error
      });
    }
  }

  /**
   * 根据单词文本获取单词
   */
  public async getWordByText(wordText: string): Promise<Word | null> {
    try {
      const results = this.dbConnection.exec('SELECT * FROM wordbook WHERE word = ?', [wordText]);
      
      if (results.length === 0) {
        return null;
      }
      
      return this.mapRowToWord(results[0]);
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取单词失败',
        details: error
      });
    }
  }

  /**
   * 根据ID获取单词
   */
  public async getWordById(id: number): Promise<Word | null> {
    try {
      const results = this.dbConnection.exec('SELECT * FROM wordbook WHERE id = ?', [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      return this.mapRowToWord(results[0]);
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取单词失败',
        details: error
      });
    }
  }

  /**
   * 获取需要复习的单词
   */
  public async getWordsForReview(): Promise<Word[]> {
    try {
      const results = this.dbConnection.exec(
        'SELECT * FROM wordbook WHERE next_review_at IS NULL OR next_review_at <= datetime("now") ORDER BY next_review_at ASC'
      );
      
      return results.map(row => this.mapRowToWord(row));
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取复习单词失败',
        details: error
      });
    }
  }

  // ==================== 学习记录相关操作 ====================

  /**
   * 记录学习活动
   */
  public async recordLearningActivity(record: Omit<LearningRecord, 'id' | 'createdAt'>): Promise<LearningRecord> {
    try {
      this.dbConnection.run(
        'INSERT INTO learning_records (activity_type, content_id, word, accuracy_score, time_spent) VALUES (?, ?, ?, ?, ?)',
        [
          record.activityType,
          record.contentId || null,
          record.word || null,
          record.accuracyScore || null,
          record.timeSpent
        ]
      );
      
      const result = this.dbConnection.exec('SELECT last_insert_rowid() as id')[0] as any;
      const id = result.id as number;
      
      const savedRecord = await this.getLearningRecordById(id);
      if (!savedRecord) {
        throw new Error('记录学习活动后无法获取数据');
      }
      
      return savedRecord;
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '记录学习活动失败',
        details: error
      });
    }
  }

  /**
   * 根据ID获取学习记录
   */
  public async getLearningRecordById(id: number): Promise<LearningRecord | null> {
    try {
      const results = this.dbConnection.exec('SELECT * FROM learning_records WHERE id = ?', [id]);
      
      if (results.length === 0) {
        return null;
      }
      
      const row = results[0] as any;
      return {
        id: row.id as number,
        activityType: row.activity_type as LearningRecord['activityType'],
        contentId: row.content_id as number || undefined,
        word: row.word as string || undefined,
        accuracyScore: row.accuracy_score as number || undefined,
        timeSpent: row.time_spent as number,
        createdAt: new Date(row.created_at as string)
      };
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取学习记录失败',
        details: error
      });
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 将数据库行映射为Word对象
   */
  public mapRowToWord(row: unknown): Word {
    return {
      id: row.id,
      word: row.word,
      definition: row.definition,
      pronunciation: row.pronunciation || undefined,
      addReason: row.add_reason,
      proficiencyLevel: row.proficiency_level,
      reviewCount: row.review_count,
      lastReviewAt: row.last_review_at ? new Date(row.last_review_at) : undefined,
      nextReviewAt: row.next_review_at ? new Date(row.next_review_at) : undefined,
      createdAt: new Date(row.created_at)
    };
  }

  /**
   * 获取学习记录列表
   */
  public async getLearningRecords(params?: RecordQueryParams): Promise<LearningRecord[]> {
    try {
      let query = 'SELECT * FROM learning_records';
      const conditions: string[] = [];
      const values: unknown[] = [];

      // 构建查询条件
      if (params?.activityType) {
        conditions.push('activity_type = ?');
        values.push(params.activityType);
      }

      if (params?.startDate) {
        conditions.push('created_at >= ?');
        values.push(params.startDate.toISOString());
      }

      if (params?.endDate) {
        conditions.push('created_at <= ?');
        values.push(params.endDate.toISOString());
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      if (params?.limit) {
        query += ' LIMIT ?';
        values.push(params.limit);
      }

      if (params?.offset) {
        query += ' OFFSET ?';
        values.push(params.offset);
      }

      const results = this.dbConnection.exec(query, values);
      
      return results.map(row => this.mapRowToLearningRecord(row));
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取学习记录失败',
        details: error
      });
    }
  }

  /**
   * 获取学习统计数据
   */
  public async getLearningStats(params?: StatsQueryParams): Promise<LearningStats> {
    try {
      // 构建时间范围条件
      let timeCondition = '';
      const timeValues: unknown[] = [];
      
      if (params?.startDate) {
        timeCondition += ' AND lr.created_at >= ?';
        timeValues.push(params.startDate.toISOString());
      }
      
      if (params?.endDate) {
        timeCondition += ' AND lr.created_at <= ?';
        timeValues.push(params.endDate.toISOString());
      }

      // 1. 计算总学习时间
      const totalTimeQuery = `
        SELECT COALESCE(SUM(time_spent), 0) as total_time 
        FROM learning_records lr 
        WHERE 1=1 ${timeCondition}
      `;
      const totalTimeResult = this.dbConnection.exec(totalTimeQuery, timeValues)[0] as any;
      const totalStudyTime = totalTimeResult?.total_time || 0;

      // 2. 计算单词相关统计
      const wordStatsQuery = `
        SELECT 
          COUNT(DISTINCT w.word) as total_words,
          COUNT(DISTINCT CASE WHEN w.proficiency_level >= 4 THEN w.word END) as mastered_words
        FROM wordbook w
      `;
      const wordStatsResult = this.dbConnection.exec(wordStatsQuery)[0] as any;
      const totalWords = wordStatsResult?.total_words || 0;
      const masteredWords = wordStatsResult?.mastered_words || 0;

      // 3. 计算平均准确率
      const accuracyQuery = `
        SELECT AVG(accuracy_score) as avg_accuracy 
        FROM learning_records lr 
        WHERE accuracy_score IS NOT NULL ${timeCondition}
      `;
      const accuracyResult = this.dbConnection.exec(accuracyQuery, timeValues)[0] as any;
      const averageAccuracy = accuracyResult?.avg_accuracy || 0;

      // 4. 计算连续学习天数（简化实现）
      const streakDays = 0; // 这里需要复杂的逻辑，暂时返回0

      // 5. 按活动类型统计
      const activitiesByTypeQuery = `
        SELECT 
          activity_type,
          COUNT(*) as count
        FROM learning_records lr 
        WHERE 1=1 ${timeCondition}
        GROUP BY activity_type
      `;
      const activitiesResult = this.dbConnection.exec(activitiesByTypeQuery, timeValues);
      
      const activitiesByType: Record<string, number> = {
        reading: 0,
        listening: 0,
        speaking: 0,
        translation: 0
      };

      activitiesResult.forEach((row: any) => {
        activitiesByType[row.activity_type] = row.count;
      });

      return {
        totalStudyTime,
        totalWords,
        masteredWords,
        averageAccuracy,
        streakDays,
        activitiesByType: activitiesByType as any
      };
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取学习统计数据失败',
        details: error
      });
    }
  }

  /**
   * 将数据库行映射为LearningRecord对象
   */
  private mapRowToLearningRecord(row: any): LearningRecord {
    return {
      id: row.id,
      activityType: row.activity_type,
      contentId: row.content_id || undefined,
      word: row.word || undefined,
      accuracyScore: row.accuracy_score || undefined,
      timeSpent: row.time_spent,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at)
    };
  }

  /**
   * 获取数据库连接（供其他服务使用）
   */
  public getDatabaseConnection(): DatabaseConnection {
    return this.dbConnection;
  }
}