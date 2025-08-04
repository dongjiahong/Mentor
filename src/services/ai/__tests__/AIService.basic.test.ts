import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService } from '../AIService';
import {
  AIConfig,
  ContentGenerationParams,
  ErrorType
} from '@/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AIService - 基础功能测试', () => {
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
  });

  describe('配置验证', () => {
    it('应该验证有效的配置', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'gpt-3.5-turbo' }] })
      });

      const isValid = await aiService.validateConfig(mockConfig);
      expect(isValid).toBe(true);
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
  });

  describe('内容生成', () => {
    const mockContentParams: ContentGenerationParams = {
      level: 'B1',
      goal: 'daily_conversation',
      type: 'dialogue',
      topic: 'Shopping',
      wordCount: 200
    };

    it('应该在没有配置时抛出错误', async () => {
      const serviceWithoutConfig = new AIService();
      
      await expect(serviceWithoutConfig.generateContent(mockContentParams))
        .rejects.toThrow('AI配置未设置');
    });

    it('应该成功生成学习内容', async () => {
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
        }]
      };

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
        wordCount: 7, // 修正单词计数
        estimatedReadingTime: 1
      });
    });
  });
});