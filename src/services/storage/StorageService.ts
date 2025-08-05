import { DatabaseConnection } from '../database/connection';
import { 
  UserProfile, 
  AIConfig, 
  LearningContent, 
  Word, 
  LearningRecord, 
  DatabaseError,
  DatabaseErrorType 
} from '@/types';

/**
 * 存储服务基础类
 * 提供数据持久化的统一接口
 */
export class StorageService {
  private dbConnection: DatabaseConnection;

  constructor() {
    this.dbConnection = DatabaseConnection.getInstance();
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
          'UPDATE ai_config SET api_url = ?, api_key = ?, model_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [config.apiUrl, config.apiKey, config.modelName, existing.id]
        );
        
        return {
          ...existing,
          ...config,
          updatedAt: new Date()
        };
      } else {
        // 创建新配置
        this.dbConnection.run(
          'INSERT INTO ai_config (api_url, api_key, model_name) VALUES (?, ?, ?)',
          [config.apiUrl, config.apiKey, config.modelName]
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
   * 获取数据库连接（供其他服务使用）
   */
  public getDatabaseConnection(): DatabaseConnection {
    return this.dbConnection;
  }
}