import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDictionary, useDictionaryQuery } from '../useDictionary';
import { DictionaryConfigManager } from '@/services';
import { AppError, ErrorType } from '@/types';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock DictionaryConfigManager
vi.mock('@/services', () => ({
  DictionaryConfigManager: {
    getConfig: vi.fn(),
    saveConfig: vi.fn(),
    updateConfig: vi.fn(),
    validateConfig: vi.fn(),
    isConfigured: vi.fn(),
    getDefaultConfig: vi.fn(),
  },
  DictionaryServiceFactory: {
    createService: vi.fn(),
    getAvailableProviders: vi.fn(() => [
      {
        id: 'mock',
        name: '模拟服务',
        description: '用于测试的模拟服务',
        requiresConfig: false,
        configFields: []
      }
    ]),
  },
}));

describe('useDictionary', () => {
  const mockConfig = {
    id: 1,
    provider: 'mock' as const,
    appKey: '',
    appSecret: '',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    lookupWord: vi.fn(),
    getWordPronunciation: vi.fn(),
    searchWords: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 默认模拟配置已存在且有效
    vi.mocked(DictionaryConfigManager.getConfig).mockReturnValue(mockConfig);
    vi.mocked(DictionaryConfigManager.isConfigured).mockReturnValue(true);
    vi.mocked(DictionaryConfigManager.validateConfig).mockReturnValue({
      isValid: true,
      errors: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始化', () => {
    it('应该成功初始化词典服务', async () => {
      const { DictionaryServiceFactory } = await import('@/services');
      vi.mocked(DictionaryServiceFactory.createService).mockResolvedValue(mockService);

      const { result } = renderHook(() => useDictionary());

      // 初始状态应该是加载中
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isConfigured).toBe(false);

      // 等待初始化完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isConfigured).toBe(true);
      expect(result.current.service).toBe(mockService);
      expect(result.current.config).toEqual(mockConfig);
      expect(result.current.error).toBeNull();
    });

    it('应该处理未配置的情况', async () => {
      vi.mocked(DictionaryConfigManager.isConfigured).mockReturnValue(false);

      const { result } = renderHook(() => useDictionary());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isConfigured).toBe(false);
      expect(result.current.service).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('应该处理初始化错误', async () => {
      const { DictionaryServiceFactory } = await import('@/services');
      const error = new AppError({
        type: ErrorType.INVALID_CONFIG,
        message: '配置无效'
      });
      
      vi.mocked(DictionaryServiceFactory.createService).mockRejectedValue(error);

      const { result } = renderHook(() => useDictionary());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isConfigured).toBe(false);
      expect(result.current.service).toBeNull();
      expect(result.current.error).toEqual(error);
    });
  });

  describe('配置管理', () => {
    it('应该成功更新配置', async () => {
      const { DictionaryServiceFactory } = await import('@/services');
      vi.mocked(DictionaryServiceFactory.createService).mockResolvedValue(mockService);

      const { result } = renderHook(() => useDictionary());

      // 等待初始化完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const newConfig = {
        provider: 'youdao' as const,
        appKey: 'test-key',
        appSecret: 'test-secret',
        enabled: true,
      };

      const savedConfig = { ...mockConfig, ...newConfig };
      vi.mocked(DictionaryConfigManager.saveConfig).mockReturnValue(savedConfig);
      vi.mocked(DictionaryServiceFactory.createService).mockResolvedValue(mockService);

      await act(async () => {
        await result.current.updateConfig(newConfig);
      });

      expect(DictionaryConfigManager.validateConfig).toHaveBeenCalledWith(newConfig);
      expect(DictionaryConfigManager.saveConfig).toHaveBeenCalledWith(newConfig);
      expect(result.current.config).toEqual(savedConfig);
    });

    it('应该处理配置验证失败', async () => {
      const { result } = renderHook(() => useDictionary());

      vi.mocked(DictionaryConfigManager.validateConfig).mockReturnValue({
        isValid: false,
        errors: ['配置无效'],
      });

      const newConfig = {
        provider: 'youdao' as const,
        appKey: '',
        appSecret: '',
        enabled: true,
      };

      await act(async () => {
        try {
          await result.current.updateConfig(newConfig);
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).type).toBe(ErrorType.VALIDATION_ERROR);
        }
      });
    });
  });

  describe('单词查询', () => {
    it('应该成功查询单词', async () => {
      const { DictionaryServiceFactory } = await import('@/services');
      const mockDefinition = {
        word: 'hello',
        phonetic: '/həˈloʊ/',
        definitions: [{ partOfSpeech: 'int.', meaning: '你好' }],
        examples: ['Hello, world!']
      };

      mockService.lookupWord.mockResolvedValue(mockDefinition);
      vi.mocked(DictionaryServiceFactory.createService).mockResolvedValue(mockService);

      const { result } = renderHook(() => useDictionary());

      // 等待初始化完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let queryResult;
      await act(async () => {
        queryResult = await result.current.lookupWord('hello');
      });

      expect(queryResult).toEqual(mockDefinition);
      expect(result.current.queryState.status).toBe('success');
      expect(result.current.queryState.data).toEqual(mockDefinition);
      expect(result.current.queryState.word).toBe('hello');
    });

    it('应该处理查询错误', async () => {
      const { DictionaryServiceFactory } = await import('@/services');
      const error = new AppError({
        type: ErrorType.API_ERROR,
        message: '查询失败'
      });

      mockService.lookupWord.mockRejectedValue(error);
      vi.mocked(DictionaryServiceFactory.createService).mockResolvedValue(mockService);

      const { result } = renderHook(() => useDictionary());

      // 等待初始化完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        try {
          await result.current.lookupWord('unknown');
        } catch (err) {
          expect(err).toEqual(error);
        }
      });

      expect(result.current.queryState.status).toBe('error');
      expect(result.current.queryState.error).toEqual(error);
      expect(result.current.queryState.word).toBe('unknown');
    });

    it('应该处理空单词输入', async () => {
      const { DictionaryServiceFactory } = await import('@/services');
      vi.mocked(DictionaryServiceFactory.createService).mockResolvedValue(mockService);

      const { result } = renderHook(() => useDictionary());

      // 等待初始化完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        try {
          await result.current.lookupWord('');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).type).toBe(ErrorType.VALIDATION_ERROR);
        }
      });
    });

    it('应该处理服务未初始化的情况', async () => {
      vi.mocked(DictionaryConfigManager.isConfigured).mockReturnValue(false);

      const { result } = renderHook(() => useDictionary());

      // 等待初始化完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        try {
          await result.current.lookupWord('hello');
        } catch (error) {
          expect(error).toBeInstanceOf(AppError);
          expect((error as AppError).type).toBe(ErrorType.INVALID_CONFIG);
        }
      });
    });
  });

  describe('其他功能', () => {
    it('应该获取单词发音', async () => {
      const { DictionaryServiceFactory } = await import('@/services');
      mockService.getWordPronunciation.mockResolvedValue('http://example.com/hello.mp3');
      vi.mocked(DictionaryServiceFactory.createService).mockResolvedValue(mockService);

      const { result } = renderHook(() => useDictionary());

      // 等待初始化完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let pronunciation;
      await act(async () => {
        pronunciation = await result.current.getWordPronunciation('hello');
      });

      expect(pronunciation).toBe('http://example.com/hello.mp3');
      expect(mockService.getWordPronunciation).toHaveBeenCalledWith('hello');
    });

    it('应该搜索单词', async () => {
      const { DictionaryServiceFactory } = await import('@/services');
      const mockResults = [
        { word: 'hello', definitions: [], examples: [] },
        { word: 'help', definitions: [], examples: [] }
      ];

      mockService.searchWords.mockResolvedValue(mockResults);
      vi.mocked(DictionaryServiceFactory.createService).mockResolvedValue(mockService);

      const { result } = renderHook(() => useDictionary());

      // 等待初始化完成
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      let searchResults;
      await act(async () => {
        searchResults = await result.current.searchWords('hel');
      });

      expect(searchResults).toEqual(mockResults);
      expect(mockService.searchWords).toHaveBeenCalledWith('hel', undefined);
    });

    it('应该清除查询状态', async () => {
      const { result } = renderHook(() => useDictionary());

      act(() => {
        result.current.clearQueryState();
      });

      expect(result.current.queryState.status).toBe('idle');
    });
  });
});

describe('useDictionaryQuery', () => {
  it('应该提供简化的查询接口', () => {
    const { result } = renderHook(() => useDictionaryQuery());

    expect(result.current).toHaveProperty('lookupWord');
    expect(result.current).toHaveProperty('getWordPronunciation');
    expect(result.current).toHaveProperty('searchWords');
    expect(result.current).toHaveProperty('queryState');
    expect(result.current).toHaveProperty('clearQueryState');
    expect(result.current).toHaveProperty('isAvailable');
    expect(result.current).toHaveProperty('serviceError');
  });
});