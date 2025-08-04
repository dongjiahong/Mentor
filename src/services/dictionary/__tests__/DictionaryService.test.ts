import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { YoudaoDictionaryService, MockDictionaryService } from '../DictionaryService';
import { AppError, ErrorType } from '@/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('YoudaoDictionaryService', () => {
  let service: YoudaoDictionaryService;
  const mockAppKey = 'test-app-key';
  const mockAppSecret = 'test-app-secret';

  beforeEach(() => {
    service = new YoudaoDictionaryService(mockAppKey, mockAppSecret);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('lookupWord', () => {
    it('应该成功查询单词并返回定义', async () => {
      const mockResponse = {
        errorCode: '0',
        query: 'hello',
        translation: ['你好'],
        basic: {
          phonetic: 'həˈloʊ',
          explains: ['int. 你好；喂', 'n. 表示问候的用语']
        },
        web: [
          {
            key: 'Hello',
            value: ['你好', '您好']
          }
        ],
        speakUrl: 'http://example.com/hello.mp3'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await service.lookupWord('hello');

      expect(result).toEqual({
        word: 'hello',
        phonetic: 'həˈloʊ',
        pronunciation: 'http://example.com/hello.mp3',
        definitions: [
          {
            partOfSpeech: 'int.',
            meaning: '你好；喂'
          },
          {
            partOfSpeech: 'n.',
            meaning: '表示问候的用语'
          }
        ],
        examples: ['Hello: 你好, 您好']
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('应该处理空单词输入', async () => {
      await expect(service.lookupWord('')).rejects.toThrow(AppError);
      await expect(service.lookupWord('   ')).rejects.toThrow(AppError);
    });

    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.lookupWord('test')).rejects.toThrow(AppError);
    });

    it('应该处理API错误响应', async () => {
      const mockResponse = {
        errorCode: '108',
        query: 'test'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await expect(service.lookupWord('test')).rejects.toThrow(AppError);
    });

    it('应该处理HTTP错误状态', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(service.lookupWord('test')).rejects.toThrow(AppError);
    });

    it('应该使用缓存避免重复请求', async () => {
      const mockResponse = {
        errorCode: '0',
        query: 'cached',
        translation: ['缓存的'],
        basic: {
          explains: ['adj. 缓存的']
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // 第一次查询
      const result1 = await service.lookupWord('cached');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 第二次查询应该使用缓存
      const result2 = await service.lookupWord('cached');
      expect(mockFetch).toHaveBeenCalledTimes(1); // 仍然是1次
      expect(result1).toEqual(result2);
    });

    it('应该正确处理大小写和空格', async () => {
      const mockResponse = {
        errorCode: '0',
        query: 'test',
        translation: ['测试']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await service.lookupWord('  TEST  ');
      
      // 检查请求参数是否正确标准化
      const callArgs = mockFetch.mock.calls[0][0];
      expect(callArgs).toContain('q=test');
    });
  });

  describe('getWordPronunciation', () => {
    it('应该返回单词的发音URL', async () => {
      const mockResponse = {
        errorCode: '0',
        query: 'hello',
        speakUrl: 'http://example.com/hello.mp3'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const pronunciation = await service.getWordPronunciation('hello');
      expect(pronunciation).toBe('http://example.com/hello.mp3');
    });

    it('应该处理没有发音URL的情况', async () => {
      const mockResponse = {
        errorCode: '0',
        query: 'hello',
        translation: ['你好']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const pronunciation = await service.getWordPronunciation('hello');
      expect(pronunciation).toBe('');
    });
  });

  describe('searchWords', () => {
    it('应该从历史记录中搜索匹配的单词', async () => {
      // 先添加一些历史记录
      const mockResponse = {
        errorCode: '0',
        query: 'hello',
        translation: ['你好']
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await service.lookupWord('hello');
      await service.lookupWord('help');

      const results = await service.searchWords('hel');
      expect(results).toHaveLength(2);
    });

    it('应该处理空查询', async () => {
      const results = await service.searchWords('');
      expect(results).toEqual([]);
    });

    it('应该限制返回结果数量', async () => {
      // 模拟多个历史记录
      for (let i = 0; i < 15; i++) {
        const mockResponse = {
          errorCode: '0',
          query: `test${i}`,
          translation: [`测试${i}`]
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        await service.lookupWord(`test${i}`);
      }

      const results = await service.searchWords('test', 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  describe('查询历史管理', () => {
    it('应该记录查询历史', async () => {
      const mockResponse = {
        errorCode: '0',
        query: 'history',
        translation: ['历史']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await service.lookupWord('history');
      
      const history = service.getQueryHistory();
      expect(history).toHaveLength(1);
      expect(history[0].word).toBe('history');
    });

    it('应该清除查询历史', async () => {
      const mockResponse = {
        errorCode: '0',
        query: 'test',
        translation: ['测试']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await service.lookupWord('test');
      expect(service.getQueryHistory()).toHaveLength(1);

      service.clearHistory();
      expect(service.getQueryHistory()).toHaveLength(0);
    });
  });

  describe('缓存管理', () => {
    it('应该清除缓存', async () => {
      const mockResponse = {
        errorCode: '0',
        query: 'cache',
        translation: ['缓存']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      // 第一次查询
      await service.lookupWord('cache');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // 清除缓存
      service.clearCache();

      // 再次查询应该重新请求API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await service.lookupWord('cache');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('MockDictionaryService', () => {
  let service: MockDictionaryService;

  beforeEach(() => {
    service = new MockDictionaryService();
  });

  describe('lookupWord', () => {
    it('应该返回预定义的单词定义', async () => {
      const result = await service.lookupWord('hello');
      
      expect(result).toEqual({
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
      });
    });

    it('应该处理未知单词', async () => {
      await expect(service.lookupWord('unknown')).rejects.toThrow(AppError);
    });

    it('应该处理大小写不敏感', async () => {
      const result = await service.lookupWord('HELLO');
      expect(result.word).toBe('hello');
    });
  });

  describe('getWordPronunciation', () => {
    it('应该返回空字符串（模拟服务没有音频）', async () => {
      const pronunciation = await service.getWordPronunciation('hello');
      expect(pronunciation).toBe('');
    });
  });

  describe('searchWords', () => {
    it('应该搜索匹配的单词', async () => {
      const results = await service.searchWords('hel');
      expect(results).toHaveLength(1);
      expect(results[0].word).toBe('hello');
    });

    it('应该处理空查询', async () => {
      const results = await service.searchWords('');
      expect(results).toEqual([]);
    });

    it('应该限制返回结果数量', async () => {
      const results = await service.searchWords('o', 1);
      expect(results.length).toBeLessThanOrEqual(1);
    });
  });
});