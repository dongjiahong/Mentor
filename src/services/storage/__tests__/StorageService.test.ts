import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../StorageService';
import { DatabaseConnection } from '../../database/connection';
// 导入类型用于测试

// Mock DatabaseConnection
vi.mock('../../database/connection');

describe('StorageService', () => {
  let storageService: StorageService;
  let mockDbConnection: any;

  beforeEach(() => {
    mockDbConnection = {
      initialize: vi.fn(),
      saveToStorage: vi.fn(),
      close: vi.fn(),
      exec: vi.fn(),
      run: vi.fn()
    };
    
    (DatabaseConnection.getInstance as unknown).mockReturnValue(mockDbConnection);
    storageService = new StorageService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialize', () => {
    it('应该初始化数据库连接', async () => {
      await storageService.initialize();
      
      expect(mockDbConnection.initialize).toHaveBeenCalled();
    });
  });

  describe('saveUserProfile', () => {
    const mockProfile = {
      englishLevel: 'B1' as const,
      learningGoal: 'daily_conversation' as const
    };

    it('应该创建新的用户配置', async () => {
      // Mock getUserProfile返回null（不存在用户配置）
      mockDbConnection.exec
        .mockReturnValueOnce([]) // getUserProfile查询返回空
        .mockReturnValueOnce([{ id: 1 }]) // last_insert_rowid查询
        .mockReturnValueOnce([{ // 新创建的用户配置
          id: 1,
          english_level: 'B1',
          learning_goal: 'daily_conversation',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }]);

      const result = await storageService.saveUserProfile(mockProfile);

      expect(mockDbConnection.run).toHaveBeenCalledWith(
        'INSERT INTO user_profile (english_level, learning_goal) VALUES (?, ?)',
        ['B1', 'daily_conversation']
      );
      expect(result.englishLevel).toBe('B1');
      expect(result.learningGoal).toBe('daily_conversation');
    });

    it('应该更新现有的用户配置', async () => {
      // 现有用户配置数据（用于mock）

      // Mock getUserProfile返回现有配置
      mockDbConnection.exec.mockReturnValue([{
        id: 1,
        english_level: 'A2',
        learning_goal: 'business_english',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }]);

      const result = await storageService.saveUserProfile(mockProfile);

      expect(mockDbConnection.run).toHaveBeenCalledWith(
        'UPDATE user_profile SET english_level = ?, learning_goal = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        ['B1', 'daily_conversation', 1]
      );
      expect(result.englishLevel).toBe('B1');
      expect(result.learningGoal).toBe('daily_conversation');
    });
  });

  describe('getUserProfile', () => {
    it('应该返回用户配置', async () => {
      const mockProfileData = {
        id: 1,
        english_level: 'B1',
        learning_goal: '提高口语能力',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };

      mockDbConnection.exec.mockReturnValue([mockProfileData]);

      const result = await storageService.getUserProfile();

      expect(result).toEqual({
        id: 1,
        englishLevel: 'B1',
        learningGoal: '提高口语能力',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z')
      });
    });

    it('不存在用户配置时应该返回null', async () => {
      mockDbConnection.exec.mockReturnValue([]);

      const result = await storageService.getUserProfile();

      expect(result).toBeNull();
    });
  });

  describe('saveAIConfig', () => {
    const mockConfig = {
      apiUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test123',
      modelName: 'gpt-3.5-turbo'
    };

    it('应该创建新的AI配置', async () => {
      // Mock getAIConfig返回null（不存在AI配置）
      mockDbConnection.exec
        .mockReturnValueOnce([]) // getAIConfig查询返回空
        .mockReturnValueOnce([{ // 新创建的AI配置
          id: 1,
          api_url: 'https://api.openai.com/v1',
          api_key: 'sk-test123',
          model_name: 'gpt-3.5-turbo',
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z'
        }]);

      const result = await storageService.saveAIConfig(mockConfig);

      expect(mockDbConnection.run).toHaveBeenCalledWith(
        'INSERT INTO ai_config (api_url, api_key, model_name) VALUES (?, ?, ?)',
        ['https://api.openai.com/v1', 'sk-test123', 'gpt-3.5-turbo']
      );
      expect(result.apiUrl).toBe('https://api.openai.com/v1');
    });
  });

  describe('addWordToBook', () => {
    const mockWord = {
      word: 'hello',
      definition: '你好',
      pronunciation: '/həˈloʊ/',
      addReason: 'translation_lookup' as const,
      proficiencyLevel: 0,
      reviewCount: 0
    };

    it('应该添加新单词到单词本', async () => {
      // Mock getWordByText返回null（单词不存在）
      mockDbConnection.exec
        .mockReturnValueOnce([]) // getWordByText查询返回空
        .mockReturnValueOnce([{ id: 1 }]) // last_insert_rowid查询
        .mockReturnValueOnce([{ // 新添加的单词
          id: 1,
          word: 'hello',
          definition: '你好',
          pronunciation: '/həˈloʊ/',
          add_reason: 'translation_lookup',
          proficiency_level: 0,
          review_count: 0,
          last_review_at: null,
          next_review_at: null,
          created_at: '2024-01-01T00:00:00.000Z'
        }]);

      const result = await storageService.addWordToBook(mockWord);

      expect(mockDbConnection.run).toHaveBeenCalledWith(
        'INSERT INTO wordbook (word, definition, pronunciation, add_reason, proficiency_level, review_count, last_review_at, next_review_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        ['hello', '你好', '/həˈloʊ/', 'translation_lookup', 0, 0, null, null]
      );
      expect(result.word).toBe('hello');
      expect(result.definition).toBe('你好');
    });

    it('应该更新现有单词', async () => {
      // 现有单词数据（用于mock）

      // Mock getWordByText返回现有单词
      mockDbConnection.exec.mockReturnValue([{
        id: 1,
        word: 'hello',
        definition: '旧定义',
        pronunciation: null,
        add_reason: 'translation_lookup',
        proficiency_level: 1,
        review_count: 5,
        last_review_at: null,
        next_review_at: null,
        created_at: '2024-01-01T00:00:00.000Z'
      }]);

      await storageService.addWordToBook(mockWord);

      expect(mockDbConnection.run).toHaveBeenCalledWith(
        'UPDATE wordbook SET definition = ?, pronunciation = ?, add_reason = ?, proficiency_level = ?, review_count = ?, last_review_at = ?, next_review_at = ? WHERE id = ?',
        ['你好', '/həˈloʊ/', 'translation_lookup', 0, 0, null, null, 1]
      );
    });
  });

  describe('getWordsForReview', () => {
    it('应该返回需要复习的单词列表', async () => {
      const mockWords = [
        {
          id: 1,
          word: 'hello',
          definition: '你好',
          pronunciation: '/həˈloʊ/',
          add_reason: 'translation_lookup',
          proficiency_level: 0,
          review_count: 0,
          last_review_at: null,
          next_review_at: null,
          created_at: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 2,
          word: 'world',
          definition: '世界',
          pronunciation: '/wɜːrld/',
          add_reason: 'pronunciation_error',
          proficiency_level: 1,
          review_count: 2,
          last_review_at: '2024-01-01T00:00:00.000Z',
          next_review_at: '2024-01-02T00:00:00.000Z',
          created_at: '2024-01-01T00:00:00.000Z'
        }
      ];

      mockDbConnection.exec.mockReturnValue(mockWords);

      const result = await storageService.getWordsForReview();

      expect(result).toHaveLength(2);
      expect(result[0].word).toBe('hello');
      expect(result[1].word).toBe('world');
      expect(mockDbConnection.exec).toHaveBeenCalledWith(
        'SELECT * FROM wordbook WHERE next_review_at IS NULL OR next_review_at <= datetime("now") ORDER BY next_review_at ASC'
      );
    });
  });

  describe('recordLearningActivity', () => {
    const mockRecord = {
      activityType: 'reading' as const,
      contentId: 1,
      word: 'hello',
      accuracyScore: 0.85,
      timeSpent: 300
    };

    it('应该记录学习活动', async () => {
      mockDbConnection.exec
        .mockReturnValueOnce([{ id: 1 }]) // last_insert_rowid查询
        .mockReturnValueOnce([{ // 新记录的学习活动
          id: 1,
          activity_type: 'reading',
          content_id: 1,
          word: 'hello',
          accuracy_score: 0.85,
          time_spent: 300,
          created_at: '2024-01-01T00:00:00.000Z'
        }]);

      const result = await storageService.recordLearningActivity(mockRecord);

      expect(mockDbConnection.run).toHaveBeenCalledWith(
        'INSERT INTO learning_records (activity_type, content_id, word, accuracy_score, time_spent) VALUES (?, ?, ?, ?, ?)',
        ['reading', 1, 'hello', 0.85, 300]
      );
      expect(result.activityType).toBe('reading');
      expect(result.timeSpent).toBe(300);
    });
  });

  describe('save and close', () => {
    it('save应该调用数据库连接的saveToStorage', () => {
      storageService.save();
      
      expect(mockDbConnection.saveToStorage).toHaveBeenCalled();
    });

    it('close应该调用数据库连接的close', () => {
      storageService.close();
      
      expect(mockDbConnection.close).toHaveBeenCalled();
    });
  });
});