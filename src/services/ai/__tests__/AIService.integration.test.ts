import { describe, it, expect, beforeAll } from 'vitest';
import { AIService } from '../AIService';
import {
  AIConfig,
  ContentGenerationParams,
  ExamGenerationParams,
  PronunciationEvaluationParams
} from '@/types';

describe('AIService 集成测试', () => {
  let aiService: AIService;
  let testConfig: AIConfig;

  beforeAll(() => {
    // 使用.env.local中的配置进行测试
    const apiUrl = 'https://api-inference.modelscope.cn/v1/';
    const apiKey = 'ms-b73a047d-0609-4ab7-8040-3e6ebd633839';
    const modelName = 'Qwen/Qwen3-235B-A22B-Instruct-2507';

    testConfig = {
      id: 1,
      apiUrl,
      apiKey,
      modelName,
      temperature: 0.7,
      maxTokens: 1000,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    aiService = new AIService(testConfig);
  });

  describe('配置验证', () => {
    it('应该验证真实的AI配置', async () => {
      if (!testConfig) {
        console.log('跳过测试：无有效配置');
        return;
      }

      const isValid = await aiService.validateConfig(testConfig);
      expect(isValid).toBe(true);
    }, 30000); // 30秒超时
  });

  describe('内容生成', () => {
    it('应该生成简单的学习内容', async () => {
      if (!testConfig) {
        console.log('跳过测试：无有效配置');
        return;
      }

      const params: ContentGenerationParams = {
        level: 'A1',
        goal: 'daily_conversation',
        type: 'dialogue',
        wordCount: 100
      };

      const content = await aiService.generateContent(params);

      expect(content).toBeDefined();
      expect(content.originalText).toBeTruthy();
      expect(content.translation).toBeTruthy();
      expect(content.contentType).toBe('dialogue');
      expect(content.difficultyLevel).toBe('A1');
      
      console.log('生成的内容:', {
        originalText: content.originalText.substring(0, 100) + '...',
        translation: content.translation.substring(0, 100) + '...'
      });
    }, 60000); // 60秒超时
  });

  describe('考试题目生成', () => {
    it('应该生成简单的考试题目', async () => {
      if (!testConfig) {
        console.log('跳过测试：无有效配置');
        return;
      }

      const params: ExamGenerationParams = {
        level: 'A1',
        examType: 'vocabulary',
        questionCount: 3
      };

      const questions = await aiService.generateExamQuestions(params);

      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
      
      const firstQuestion = questions[0];
      expect(firstQuestion.id).toBeTruthy();
      expect(firstQuestion.question).toBeTruthy();
      expect(firstQuestion.correctAnswer).toBeTruthy();
      
      console.log('生成的题目:', {
        count: questions.length,
        firstQuestion: {
          question: firstQuestion.question,
          correctAnswer: firstQuestion.correctAnswer
        }
      });
    }, 60000); // 60秒超时
  });

  describe('发音评估', () => {
    it('应该评估发音准确性', async () => {
      if (!testConfig) {
        console.log('跳过测试：无有效配置');
        return;
      }

      const params: PronunciationEvaluationParams = {
        originalText: 'Hello, how are you?',
        spokenText: 'Helo, how are you?'
      };

      const score = await aiService.evaluatePronunciation(params);

      expect(score).toBeDefined();
      expect(typeof score.overallScore).toBe('number');
      expect(score.overallScore).toBeGreaterThanOrEqual(0);
      expect(score.overallScore).toBeLessThanOrEqual(100);
      expect(score.feedback).toBeTruthy();
      
      console.log('发音评估结果:', {
        overallScore: score.overallScore,
        feedback: score.feedback.substring(0, 100) + '...'
      });
    }, 60000); // 60秒超时
  });
});