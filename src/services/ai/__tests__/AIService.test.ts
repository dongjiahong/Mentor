import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService } from '../AIService';
import {
  AIConfig,
  ContentGenerationParams,
  ExamGenerationParams,
  PronunciationEvaluationParams,
  ErrorType
} from '@/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AIService', () => {
  let aiService: AIService;
  let mockConfig: AIConfig;

  beforeEach(() => {
    mockConfig = {
      id: 1,
      apiUrl: 'https://api.openai.com/v1',
      apiKey: 'test-api-key',
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    aiService = new AIService(mockConfig);
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('构造函数和配置管理', () => {
    it('应该正确初始化AI服务', () => {
      const service = new AIService();
      expect(service.getConfig()).toBeNull();
    });

    it('应该正确设置配置', () => {
      const service = new AIService();
      service.setConfig(mockConfig);
      expect(service.getConfig()).toEqual(mockConfig);
    });

    it('应该正确获取配置', () => {
      expect(aiService.getConfig()).toEqual(mockConfig);
    });
  });

  describe('配置验证', () => {
    it('应该验证有效的配置', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'gpt-3.5-turbo' }] })
      });

      const isValid = await aiService.validateConfig(mockConfig);
      expect(isValid).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });

    it('应该拒绝无效的URL配置', async () => {
      const invalidConfig = { ...mockConfig, apiUrl: 'invalid-url' };
      const isValid = await aiService.validateConfig(invalidConfig);
      expect(isValid).toBe(false);
    });

    it('应该拒绝缺少必要字段的配置', async () => {
      const invalidConfig = { ...mockConfig, apiKey: '' };
      const isValid = await aiService.validateConfig(invalidConfig);
      expect(isValid).toBe(false);
    });

    it('应该处理API连接失败', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      const isValid = await aiService.validateConfig(mockConfig);
      expect(isValid).toBe(false);
    });

    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const isValid = await aiService.validateConfig(mockConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('内容生成', () => {
    const mockContentParams: ContentGenerationParams = {
      level: 'B1',
      goal: 'daily_conversation',
      type: 'dialogue',
      topic: 'Shopping',
      wordCount: 200
    };

    const mockApiResponse = {
      choices: [{
        message: {
          role: 'assistant' as const,
          content: JSON.stringify({
            originalText: 'Hello, how can I help you today?',
            translation: '你好，今天我能为您做些什么？',
            topic: 'Shopping',
            wordCount: 8,
            estimatedReadingTime: 1
          })
        },
        finish_reason: 'stop',
        index: 0
      }],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150
      },
      model: 'gpt-3.5-turbo',
      created: Date.now()
    };

    it('应该成功生成学习内容', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      const content = await aiService.generateContent(mockContentParams);

      expect(content).toMatchObject({
        contentType: 'dialogue',
        originalText: 'Hello, how can I help you today?',
        translation: '你好，今天我能为您做些什么？',
        difficultyLevel: 'B1',
        topic: 'Shopping',
        wordCount: 8,
        estimatedReadingTime: 1
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('gpt-3.5-turbo')
        })
      );
    });

    it('应该在没有配置时抛出错误', async () => {
      const serviceWithoutConfig = new AIService();
      
      await expect(serviceWithoutConfig.generateContent(mockContentParams))
        .rejects.toThrow('AI配置未设置');
    });

    it('应该处理API错误响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid request'
      });

      await expect(aiService.generateContent(mockContentParams))
        .rejects.toThrow('生成学习内容失败');
    });

    it('应该处理无效的JSON响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              role: 'assistant' as const,
              content: 'invalid json'
            },
            finish_reason: 'stop',
            index: 0
          }]
        })
      });

      await expect(aiService.generateContent(mockContentParams))
        .rejects.toThrow('解析AI响应失败');
    });

    it('应该处理空的API响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [] })
      });

      await expect(aiService.generateContent(mockContentParams))
        .rejects.toThrow('API返回数据格式错误');
    });
  });

  describe('考试题目生成', () => {
    const mockExamParams: ExamGenerationParams = {
      level: 'B1',
      examType: 'vocabulary',
      questionCount: 5,
      words: [
        {
          id: 1,
          word: 'apple',
          definition: 'a fruit',
          addReason: 'translation_lookup',
          proficiencyLevel: 2,
          reviewCount: 3,
          createdAt: new Date()
        }
      ]
    };

    const mockExamResponse = {
      choices: [{
        message: {
          role: 'assistant' as const,
          content: JSON.stringify({
            questions: [
              {
                id: 'vocab_1',
                type: 'multiple_choice',
                question: 'What is an apple?',
                options: ['A fruit', 'A vegetable', 'A meat', 'A drink'],
                correctAnswer: 'A fruit',
                difficulty: 'B1',
                word: 'apple'
              }
            ]
          })
        },
        finish_reason: 'stop',
        index: 0
      }]
    };

    it('应该成功生成考试题目', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockExamResponse
      });

      const questions = await aiService.generateExamQuestions(mockExamParams);

      expect(questions).toHaveLength(1);
      expect(questions[0]).toMatchObject({
        id: 'vocab_1',
        type: 'multiple_choice',
        question: 'What is an apple?',
        options: ['A fruit', 'A vegetable', 'A meat', 'A drink'],
        correctAnswer: 'A fruit',
        difficulty: 'B1',
        word: 'apple'
      });
    });

    it('应该在没有配置时抛出错误', async () => {
      const serviceWithoutConfig = new AIService();
      
      await expect(serviceWithoutConfig.generateExamQuestions(mockExamParams))
        .rejects.toThrow('AI配置未设置');
    });

    it('应该处理无效的考试响应格式', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              role: 'assistant' as const,
              content: JSON.stringify({ invalid: 'format' })
            },
            finish_reason: 'stop',
            index: 0
          }]
        })
      });

      await expect(aiService.generateExamQuestions(mockExamParams))
        .rejects.toThrow('解析考试题目响应失败');
    });
  });

  describe('发音评估', () => {
    const mockPronunciationParams: PronunciationEvaluationParams = {
      originalText: 'Hello world',
      spokenText: 'Helo world',
      word: 'Hello'
    };

    const mockPronunciationResponse = {
      choices: [{
        message: {
          role: 'assistant' as const,
          content: JSON.stringify({
            overallScore: 85,
            accuracyScore: 80,
            fluencyScore: 90,
            pronunciationScore: 85,
            feedback: 'Good pronunciation overall',
            mistakes: [
              {
                word: 'Hello',
                expected: 'Hello',
                actual: 'Helo',
                suggestion: 'Pay attention to the double L sound'
              }
            ]
          })
        },
        finish_reason: 'stop',
        index: 0
      }]
    };

    it('应该成功评估发音', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPronunciationResponse
      });

      const score = await aiService.evaluatePronunciation(mockPronunciationParams);

      expect(score).toMatchObject({
        overallScore: 85,
        accuracyScore: 80,
        fluencyScore: 90,
        pronunciationScore: 85,
        feedback: 'Good pronunciation overall',
        mistakes: [
          {
            word: 'Hello',
            expected: 'Hello',
            actual: 'Helo',
            suggestion: 'Pay attention to the double L sound'
          }
        ]
      });
    });

    it('应该在没有配置时抛出错误', async () => {
      const serviceWithoutConfig = new AIService();
      
      await expect(serviceWithoutConfig.evaluatePronunciation(mockPronunciationParams))
        .rejects.toThrow('AI配置未设置');
    });

    it('应该处理无效的发音评估响应', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              role: 'assistant' as const,
              content: 'invalid json'
            },
            finish_reason: 'stop',
            index: 0
          }]
        })
      });

      await expect(aiService.evaluatePronunciation(mockPronunciationParams))
        .rejects.toThrow('解析发音评估响应失败');
    });
  });

  describe('重试机制', () => {
    const mockContentParams: ContentGenerationParams = {
      level: 'B1',
      goal: 'daily_conversation',
      type: 'dialogue'
    };

    it('应该在可重试错误时进行重试', async () => {
      // 第一次请求失败（429 Too Many Requests）
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests'
        })
        // 第二次请求成功
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                role: 'assistant' as const,
                content: JSON.stringify({
                  originalText: 'Test content',
                  translation: '测试内容'
                })
              },
              finish_reason: 'stop',
              index: 0
            }]
          })
        });

      const content = await aiService.generateContent(mockContentParams);
      
      expect(content.originalText).toBe('Test content');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('应该在网络错误时进行重试', async () => {
      // 第一次网络错误
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        // 第二次请求成功
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{
              message: {
                role: 'assistant' as const,
                content: JSON.stringify({
                  originalText: 'Test content',
                  translation: '测试内容'
                })
              },
              finish_reason: 'stop',
              index: 0
            }]
          })
        });

      const content = await aiService.generateContent(mockContentParams);
      
      expect(content.originalText).toBe('Test content');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('应该在达到最大重试次数后抛出错误', async () => {
      // 所有请求都失败
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(aiService.generateContent(mockContentParams))
        .rejects.toThrow('生成学习内容失败');
      
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1次初始请求 + 3次重试
    });

    it('应该不重试非可重试错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(aiService.generateContent(mockContentParams))
        .rejects.toThrow('生成学习内容失败');
      
      expect(mockFetch).toHaveBeenCalledTimes(1); // 只调用一次，不重试
    });
  });

  describe('超时处理', () => {
    it('应该在请求超时时抛出错误', async () => {
      // Mock AbortController
      const mockAbortController = {
        abort: vi.fn(),
        signal: { aborted: false }
      };
      vi.stubGlobal('AbortController', vi.fn(() => mockAbortController));

      // Mock fetch to simulate timeout
      mockFetch.mockImplementationOnce(() => {
        const error = new Error('Request timeout');
        error.name = 'AbortError';
        return Promise.reject(error);
      });

      const mockContentParams: ContentGenerationParams = {
        level: 'B1',
        goal: 'daily_conversation',
        type: 'dialogue'
      };

      await expect(aiService.generateContent(mockContentParams))
        .rejects.toThrow('生成学习内容失败');
    });
  });

  describe('错误处理', () => {
    const mockContentParams: ContentGenerationParams = {
      level: 'B1',
      goal: 'daily_conversation',
      type: 'dialogue'
    };

    it('应该正确处理认证错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });

      try {
        await aiService.generateContent(mockContentParams);
      } catch (error) {
        expect(error).toMatchObject({
          type: ErrorType.AUTHENTICATION_ERROR,
          message: expect.stringContaining('API密钥无效')
        });
      }
    });

    it('应该正确处理频率限制错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      // 模拟所有重试都失败
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      });

      try {
        await aiService.generateContent(mockContentParams);
      } catch (error) {
        expect(error).toMatchObject({
          type: ErrorType.RATE_LIMIT_ERROR,
          message: expect.stringContaining('API调用频率超限')
        });
      }
    });

    it('应该正确处理网络错误', async () => {
      mockFetch.mockRejectedValue(new Error('Network connection failed'));

      try {
        await aiService.generateContent(mockContentParams);
      } catch (error) {
        expect(error).toMatchObject({
          type: ErrorType.NETWORK_ERROR,
          message: expect.stringContaining('网络连接失败')
        });
      }
    });

    it('应该正确处理超时错误', async () => {
      mockFetch.mockRejectedValue(new Error('Request timeout'));

      try {
        await aiService.generateContent(mockContentParams);
      } catch (error) {
        expect(error).toMatchObject({
          type: ErrorType.TIMEOUT_ERROR,
          message: expect.stringContaining('请求超时')
        });
      }
    });
  });
});