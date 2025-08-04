import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  MockDictionaryService 
} from '../DictionaryService';
import { 
  DictionaryConfigManager, 
  DictionaryServiceFactory,
  DictionaryConfig 
} from '../DictionaryConfig';
import { ErrorType } from '@/types';

describe('词典服务集成测试', () => {
  beforeEach(() => {
    // 清理localStorage
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('配置管理', () => {
    it('应该能够保存和获取配置', () => {
      const config = {
        provider: 'mock' as const,
        appKey: '',
        appSecret: '',
        enabled: true,
      };

      const savedConfig = DictionaryConfigManager.saveConfig(config);
      expect(savedConfig).toMatchObject(config);
      expect(savedConfig.id).toBeDefined();
      expect(savedConfig.createdAt).toBeInstanceOf(Date);
      expect(savedConfig.updatedAt).toBeInstanceOf(Date);

      const retrievedConfig = DictionaryConfigManager.getConfig();
      expect(retrievedConfig).toMatchObject(savedConfig);
    });

    it('应该能够更新配置', async () => {
      const initialConfig = {
        provider: 'mock' as const,
        appKey: '',
        appSecret: '',
        enabled: true,
      };

      const savedConfig = DictionaryConfigManager.saveConfig(initialConfig);
      
      // 添加小延迟确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const updatedConfig = DictionaryConfigManager.updateConfig({
        enabled: false,
      });

      expect(updatedConfig.enabled).toBe(false);
      expect(updatedConfig.id).toBe(savedConfig.id);
      expect(updatedConfig.updatedAt.getTime()).toBeGreaterThanOrEqual(savedConfig.updatedAt.getTime());
    });

    it('应该能够删除配置', () => {
      const config = {
        provider: 'mock' as const,
        appKey: '',
        appSecret: '',
        enabled: true,
      };

      DictionaryConfigManager.saveConfig(config);
      expect(DictionaryConfigManager.getConfig()).not.toBeNull();

      DictionaryConfigManager.deleteConfig();
      expect(DictionaryConfigManager.getConfig()).toBeNull();
    });

    it('应该验证配置的有效性', () => {
      // 测试有效的模拟服务配置
      const validMockConfig = {
        provider: 'mock' as const,
        appKey: '',
        appSecret: '',
        enabled: true,
      };

      const mockValidation = DictionaryConfigManager.validateConfig(validMockConfig);
      expect(mockValidation.isValid).toBe(true);
      expect(mockValidation.errors).toHaveLength(0);

      // 测试有效的有道词典配置
      const validYoudaoConfig = {
        provider: 'youdao' as const,
        appKey: '123456789',
        appSecret: 'abcdefghijklmnop',
        enabled: true,
      };

      const youdaoValidation = DictionaryConfigManager.validateConfig(validYoudaoConfig);
      expect(youdaoValidation.isValid).toBe(true);
      expect(youdaoValidation.errors).toHaveLength(0);

      // 测试无效配置
      const invalidConfig = {
        provider: 'invalid' as any,
        appKey: '',
        appSecret: '',
        enabled: true,
      };

      const invalidValidation = DictionaryConfigManager.validateConfig(invalidConfig);
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors.length).toBeGreaterThan(0);
    });

    it('应该检查配置状态', () => {
      expect(DictionaryConfigManager.isConfigured()).toBe(false);

      const config = {
        provider: 'mock' as const,
        appKey: '',
        appSecret: '',
        enabled: true,
      };

      DictionaryConfigManager.saveConfig(config);
      expect(DictionaryConfigManager.isConfigured()).toBe(true);

      DictionaryConfigManager.updateConfig({ enabled: false });
      expect(DictionaryConfigManager.isConfigured()).toBe(false);
    });
  });

  describe('服务工厂', () => {
    it('应该能够创建模拟服务', async () => {
      const config: DictionaryConfig = {
        id: 1,
        provider: 'mock',
        appKey: '',
        appSecret: '',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const service = await DictionaryServiceFactory.createService(config);
      expect(service).toBeInstanceOf(MockDictionaryService);
    });

    it('应该处理无效配置', async () => {
      const invalidConfig: DictionaryConfig = {
        id: 1,
        provider: 'invalid' as any,
        appKey: '',
        appSecret: '',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(DictionaryServiceFactory.createService(invalidConfig))
        .rejects
        .toThrow('词典服务配置无效');
    });

    it('应该处理禁用的服务', async () => {
      const disabledConfig: DictionaryConfig = {
        id: 1,
        provider: 'mock',
        appKey: '',
        appSecret: '',
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(DictionaryServiceFactory.createService(disabledConfig))
        .rejects
        .toThrow('词典服务已禁用');
    });

    it('应该从本地存储创建服务', async () => {
      const config = {
        provider: 'mock' as const,
        appKey: '',
        appSecret: '',
        enabled: true,
      };

      DictionaryConfigManager.saveConfig(config);

      const service = await DictionaryServiceFactory.createService();
      expect(service).toBeInstanceOf(MockDictionaryService);
    });

    it('应该获取可用的服务提供商', () => {
      const providers = DictionaryServiceFactory.getAvailableProviders();
      
      expect(providers).toHaveLength(2);
      expect(providers.find(p => p.id === 'youdao')).toBeDefined();
      expect(providers.find(p => p.id === 'mock')).toBeDefined();

      const youdaoProvider = providers.find(p => p.id === 'youdao')!;
      expect(youdaoProvider.requiresConfig).toBe(true);
      expect(youdaoProvider.configFields).toHaveLength(2);

      const mockProvider = providers.find(p => p.id === 'mock')!;
      expect(mockProvider.requiresConfig).toBe(false);
      expect(mockProvider.configFields).toHaveLength(0);
    });
  });

  describe('端到端测试', () => {
    it('应该完成完整的配置和查询流程', async () => {
      // 1. 保存配置
      const config = {
        provider: 'mock' as const,
        appKey: '',
        appSecret: '',
        enabled: true,
      };

      const savedConfig = DictionaryConfigManager.saveConfig(config);
      expect(DictionaryConfigManager.isConfigured()).toBe(true);

      // 2. 创建服务
      const service = await DictionaryServiceFactory.createService(savedConfig);
      expect(service).toBeInstanceOf(MockDictionaryService);

      // 3. 查询单词
      const result = await service.lookupWord('hello');
      expect(result.word).toBe('hello');
      expect(result.definitions).toHaveLength(2);
      expect(result.examples).toHaveLength(2);

      // 4. 获取发音
      const pronunciation = await service.getWordPronunciation('hello');
      expect(pronunciation).toBe('');

      // 5. 搜索单词
      const searchResults = await service.searchWords('hel');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].word).toBe('hello');
    });

    it('应该处理配置更新后的服务重建', async () => {
      // 初始配置
      const initialConfig = {
        provider: 'mock' as const,
        appKey: '',
        appSecret: '',
        enabled: true,
      };

      DictionaryConfigManager.saveConfig(initialConfig);
      const service1 = await DictionaryServiceFactory.createService();
      
      // 查询单词验证服务工作
      const result1 = await service1.lookupWord('hello');
      expect(result1.word).toBe('hello');

      // 更新配置
      const updatedConfig = DictionaryConfigManager.updateConfig({
        enabled: false,
      });

      // 尝试创建新服务应该失败
      await expect(DictionaryServiceFactory.createService(updatedConfig))
        .rejects
        .toThrow('词典服务已禁用');

      // 重新启用服务
      const reenabledConfig = DictionaryConfigManager.updateConfig({
        enabled: true,
      });

      const service2 = await DictionaryServiceFactory.createService(reenabledConfig);
      const result2 = await service2.lookupWord('world');
      expect(result2.word).toBe('world');
    });
  });

  describe('错误处理', () => {
    it.skip('应该处理localStorage错误', () => {
      // 模拟localStorage错误
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const config = {
        provider: 'mock' as const,
        appKey: '',
        appSecret: '',
        enabled: true,
      };

      expect(() => DictionaryConfigManager.saveConfig(config))
        .toThrow();

      // 恢复localStorage
      localStorage.setItem = originalSetItem;
    });

    it('应该处理无效的JSON数据', () => {
      // 设置无效的JSON数据
      localStorage.setItem('dictionary_config', 'invalid json');

      const config = DictionaryConfigManager.getConfig();
      expect(config).toBeNull();
    });

    it('应该处理缺失的配置', () => {
      expect(() => DictionaryConfigManager.updateConfig({ enabled: false }))
        .toThrow('没有找到现有的词典配置');
    });
  });
});