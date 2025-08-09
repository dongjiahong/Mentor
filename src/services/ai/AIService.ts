import {
  AIService as IAIService,
  AIConfig,
  LearningContent,
  ExamQuestion,
  ContentGenerationParams,
  ExamGenerationParams,
  PronunciationEvaluationParams,
  PronunciationScore,
  WordTranslation,
  AppError,
  ErrorType,
  AIApiResponse,
  AIMessage,
  DEFAULT_AI_CONFIG
} from '@/types';
import { PromptTemplates } from './PromptTemplates';
import { ContentValidator } from './ContentValidator';

/**
 * AI服务实现类
 * 提供与OpenAI兼容API的交互功能
 */
export class AIService implements IAIService {
  private config: AIConfig | null = null;
  private readonly baseTimeout = 30000; // 30秒基础超时
  private readonly maxRetries = 3; // 最大重试次数

  constructor(config?: AIConfig) {
    if (config) {
      this.config = config;
    }
  }

  /**
   * 设置AI配置
   */
  setConfig(config: AIConfig): void {
    this.config = config;
  }

  /**
   * 获取当前配置
   */
  getConfig(): AIConfig | null {
    return this.config;
  }

  /**
   * 验证AI配置
   */
  async validateConfig(config: AIConfig): Promise<boolean> {
    try {
      // 基础验证
      if (!config.apiUrl || !config.apiKey || !config.modelName) {
        return false;
      }

      // URL格式验证
      try {
        new URL(config.apiUrl);
      } catch {
        return false;
      }

      // 测试API连接
      const response = await this.makeRequest('/models', 'GET', undefined, config);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 生成学习内容
   */
  async generateContent(params: ContentGenerationParams): Promise<LearningContent> {
    if (!this.config) {
      throw this.createAppError(ErrorType.INVALID_CONFIG, 'AI配置未设置');
    }

    // 使用新的模板系统生成提示词
    const systemPrompt = PromptTemplates.getContentSystemPrompt();
    const userPrompt = PromptTemplates.buildContentPrompt(params);

    try {
      const response = await this.callChatCompletionPrivate([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      const content = this.parseContentResponse(response, params);
      return content;
    } catch (error) {
      throw this.handleError(error, '生成学习内容失败');
    }
  }

  /**
   * 生成考试题目
   */
  async generateExamQuestions(params: ExamGenerationParams): Promise<ExamQuestion[]> {
    if (!this.config) {
      throw this.createAppError(ErrorType.INVALID_CONFIG, 'AI配置未设置');
    }

    // 使用新的模板系统生成提示词
    const systemPrompt = PromptTemplates.getExamSystemPrompt();
    const userPrompt = PromptTemplates.buildExamPrompt(params);

    try {
      const response = await this.callChatCompletionPrivate([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      const questions = this.parseExamResponse(response, params);
      return questions;
    } catch (error) {
      throw this.handleError(error, '生成考试题目失败');
    }
  }

  /**
   * 评估发音
   */
  async evaluatePronunciation(params: PronunciationEvaluationParams): Promise<PronunciationScore> {
    if (!this.config) {
      throw this.createAppError(ErrorType.INVALID_CONFIG, 'AI配置未设置');
    }

    // 使用新的模板系统生成提示词
    const systemPrompt = PromptTemplates.getPronunciationSystemPrompt();
    const userPrompt = PromptTemplates.buildPronunciationPrompt(params);

    try {
      const response = await this.callChatCompletionPrivate([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      const score = this.parsePronunciationResponse(response);
      return score;
    } catch (error) {
      throw this.handleError(error, '评估发音失败');
    }
  }

  /**
   * 翻译单词
   */
  async translateWords(words: string[]): Promise<WordTranslation[]> {
    if (!this.config) {
      throw this.createAppError(ErrorType.INVALID_CONFIG, 'AI配置未设置');
    }

    if (!words || words.length === 0) {
      throw this.createAppError(ErrorType.INVALID_INPUT, '单词列表不能为空');
    }

    // 限制每次最多翻译10个单词
    const wordsToTranslate = words.slice(0, 10);

    const systemPrompt = PromptTemplates.getWordTranslationSystemPrompt();
    const userPrompt = PromptTemplates.buildWordTranslationPrompt(wordsToTranslate);

    try {
      const response = await this.callChatCompletionPrivate([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);

      const translations = this.parseWordTranslationResponse(response, wordsToTranslate);
      return translations;
    } catch (error) {
      throw this.handleError(error, '翻译单词失败');
    }
  }

  /**
   * 公共的聊天完成API调用方法
   */
  public async callChatCompletion(messages: AIMessage[]): Promise<string> {
    return this.callChatCompletionPrivate(messages);
  }

  /**
   * 私有的聊天完成API调用方法
   */
  private async callChatCompletionPrivate(messages: AIMessage[]): Promise<string> {
    if (!this.config) {
      throw new Error('AI配置未设置');
    }

    const requestBody = {
      model: this.config.modelName,
      messages,
      temperature: this.config.temperature || DEFAULT_AI_CONFIG.temperature,
      max_tokens: this.config.maxTokens || DEFAULT_AI_CONFIG.maxTokens,
      stream: false
    };

    const response = await this.makeRequestWithRetry('/chat/completions', 'POST', requestBody);
    const data: AIApiResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('API返回数据格式错误');
    }

    return data.choices[0].message.content;
  }

  /**
   * 发起HTTP请求（带重试机制）
   */
  private async makeRequestWithRetry(
    endpoint: string,
    method: string,
    body?: unknown,
    retryCount = 0
  ): Promise<Response> {
    try {
      const response = await this.makeRequest(endpoint, method, body);

      if (!response.ok) {
        // 如果是可重试的错误且还有重试次数
        if (this.isRetryableError(response.status) && retryCount < this.maxRetries) {
          const delay = this.calculateRetryDelay(retryCount);
          await this.sleep(delay);
          return this.makeRequestWithRetry(endpoint, method, body, retryCount + 1);
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      // 网络错误重试
      if (retryCount < this.maxRetries && this.isNetworkError(error)) {
        const delay = this.calculateRetryDelay(retryCount);
        await this.sleep(delay);
        return this.makeRequestWithRetry(endpoint, method, body, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * 发起HTTP请求
   */
  private async makeRequest(
    endpoint: string,
    method: string,
    body?: unknown,
    config?: AIConfig
  ): Promise<Response> {
    const currentConfig = config || this.config;
    if (!currentConfig) {
      throw new Error('AI配置未设置');
    }

    const url = `${currentConfig.apiUrl.replace(/\/$/, '')}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.baseTimeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${currentConfig.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'English-Learning-Assistant/1.0'
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时');
      }

      throw error;
    }
  }



  /**
   * 解析内容生成响应
   */
  private parseContentResponse(response: string, params: ContentGenerationParams): LearningContent {
    // 使用新的验证器解析和验证内容
    const parseResult = ContentValidator.safeJsonParse(response);

    if (!parseResult.success) {
      throw new Error(`解析AI响应失败: ${parseResult.error}`);
    }

    const validationResult = ContentValidator.validateLearningContent(parseResult.data, params);

    if (!validationResult.isValid) {
      throw new Error(`内容验证失败: ${validationResult.errors.join(', ')}`);
    }

    if (!validationResult.content) {
      throw new Error('验证后的内容为空');
    }

    return {
      id: 0, // 将由数据库分配
      ...validationResult.content,
      createdAt: new Date()
    } as LearningContent;
  }

  /**
   * 解析考试题目响应
   */
  private parseExamResponse(response: string, params: ExamGenerationParams): ExamQuestion[] {
    // 使用新的验证器解析和验证题目
    const parseResult = ContentValidator.safeJsonParse(response);

    if (!parseResult.success) {
      throw new Error(`解析AI响应失败: ${parseResult.error}`);
    }

    const validationResult = ContentValidator.validateExamQuestions(parseResult.data, params);

    if (!validationResult.isValid) {
      throw new Error(`题目验证失败: ${validationResult.errors.join(', ')}`);
    }

    if (!validationResult.questions) {
      throw new Error('验证后的题目为空');
    }

    return validationResult.questions;
  }

  /**
   * 解析发音评估响应
   */
  private parsePronunciationResponse(response: string): PronunciationScore {
    // 使用新的验证器解析和验证发音评分
    const parseResult = ContentValidator.safeJsonParse(response);

    if (!parseResult.success) {
      throw new Error(`解析AI响应失败: ${parseResult.error}`);
    }

    const validationResult = ContentValidator.validatePronunciationScore(parseResult.data);

    if (!validationResult.isValid) {
      throw new Error(`发音评分验证失败: ${validationResult.errors.join(', ')}`);
    }

    if (!validationResult.score) {
      throw new Error('验证后的评分为空');
    }

    return validationResult.score;
  }

  /**
   * 解析单词翻译响应
   */
  private parseWordTranslationResponse(response: string, requestedWords: string[]): WordTranslation[] {
    const parseResult = ContentValidator.safeJsonParse(response);

    if (!parseResult.success) {
      throw new Error(`解析AI翻译响应失败: ${parseResult.error}`);
    }

    const data = parseResult.data;
    if (!data || !data.translations || !Array.isArray(data.translations)) {
      throw new Error('翻译响应格式错误：缺少translations数组');
    }

    const translations: WordTranslation[] = [];
    
    for (const translation of data.translations) {
      // 验证必需字段
      if (!translation.word || !translation.partOfSpeech || 
          !translation.chineseDefinition || !translation.englishDefinition ||
          !translation.example || !translation.exampleTranslation ||
          !translation.memoryAid || !translation.memoryAid.method || !translation.memoryAid.content) {
        continue; // 跳过不完整的翻译
      }

      // 确保翻译的单词在请求列表中
      if (!requestedWords.includes(translation.word.toLowerCase())) {
        continue;
      }

      // 验证记忆辅助方法
      const validMethods = ['visual', 'etymology'];
      if (!validMethods.includes(translation.memoryAid.method)) {
        continue; // 跳过无效的记忆方法
      }

      translations.push({
        word: translation.word,
        partOfSpeech: translation.partOfSpeech,
        chineseDefinition: translation.chineseDefinition,
        englishDefinition: translation.englishDefinition,
        example: translation.example,
        exampleTranslation: translation.exampleTranslation,
        memoryAid: {
          method: translation.memoryAid.method as 'visual' | 'etymology',
          content: translation.memoryAid.content
        }
      });
    }

    if (translations.length === 0) {
      throw new Error('没有获取到有效的翻译结果');
    }

    return translations;
  }

  /**
   * 判断是否为可重试的错误
   */
  private isRetryableError(status: number): boolean {
    return [429, 500, 502, 503, 504].includes(status);
  }

  /**
   * 判断是否为网络错误
   */
  private isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('timeout');
    }
    return false;
  }

  /**
   * 计算重试延迟（指数退避）
   */
  private calculateRetryDelay(retryCount: number): number {
    return Math.min(1000 * Math.pow(2, retryCount), 10000);
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 创建AppError实例
   */
  private createAppError(type: ErrorType, message: string, details?: unknown): Error {
    const error = new Error(message);
    (error as any).type = type;
    (error as any).details = details;
    return error;
  }

  /**
   * 检查是否为AppError
   */
  private isAppError(error: unknown): error is AppError {
    return error !== null &&
      typeof error === 'object' &&
      'type' in error &&
      'message' in error;
  }

  /**
   * 处理错误
   */
  private handleError(error: unknown, message: string): Error {
    if (this.isAppError(error)) {
      // 创建一个标准Error对象，保留AppError的信息
      const standardError = new Error(error.message);
      (standardError as any).type = error.type;
      (standardError as any).details = error.details;
      return standardError;
    }

    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('超时')) {
        return this.createAppError(
          ErrorType.TIMEOUT_ERROR,
          `${message}: 请求超时`,
          error.message
        );
      }

      if (error.message.includes('network') || error.message.includes('fetch')) {
        return this.createAppError(
          ErrorType.NETWORK_ERROR,
          `${message}: 网络连接失败`,
          error.message
        );
      }

      if (error.message.includes('401') || error.message.includes('403')) {
        return this.createAppError(
          ErrorType.AUTHENTICATION_ERROR,
          `${message}: API密钥无效或权限不足`,
          error.message
        );
      }

      if (error.message.includes('429')) {
        return this.createAppError(
          ErrorType.RATE_LIMIT_ERROR,
          `${message}: API调用频率超限`,
          error.message
        );
      }
    }

    return this.createAppError(ErrorType.API_ERROR, message, error);
  }
}

/**
 * 创建AI服务实例的工厂函数
 */
export function createAIService(config?: AIConfig): AIService {
  return new AIService(config);
}

/**
 * 默认AI服务实例
 */
export const defaultAIService = new AIService();