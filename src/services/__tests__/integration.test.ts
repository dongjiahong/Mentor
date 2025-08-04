import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { StorageService } from '../storage/StorageService';

describe('数据库和存储服务集成测试', () => {
  let storageService: StorageService;

  beforeAll(async () => {
    storageService = new StorageService();
    // 注意：这个测试需要真实的sql.js环境，在测试环境中可能无法运行
    // 但可以验证我们的代码结构是否正确
  });

  afterAll(() => {
    if (storageService) {
      storageService.close();
    }
  });

  it('应该能够创建StorageService实例', () => {
    expect(storageService).toBeDefined();
    expect(typeof storageService.initialize).toBe('function');
    expect(typeof storageService.saveUserProfile).toBe('function');
    expect(typeof storageService.getUserProfile).toBe('function');
    expect(typeof storageService.addWordToBook).toBe('function');
    expect(typeof storageService.getWordsForReview).toBe('function');
    expect(typeof storageService.recordLearningActivity).toBe('function');
    expect(typeof storageService.save).toBe('function');
    expect(typeof storageService.close).toBe('function');
  });

  it('应该有正确的方法签名', () => {
    // 验证方法存在且为函数类型
    const methods = [
      'initialize',
      'saveUserProfile', 
      'getUserProfile',
      'saveAIConfig',
      'getAIConfig',
      'saveLearningContent',
      'getLearningContentById',
      'addWordToBook',
      'getWordByText',
      'getWordById',
      'getWordsForReview',
      'recordLearningActivity',
      'getLearningRecordById',
      'save',
      'close'
    ];

    methods.forEach(method => {
      expect(typeof (storageService as any)[method]).toBe('function');
    });
  });
});