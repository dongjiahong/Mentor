import { ApiClient } from '../base/ApiClient';

/**
 * 内容客户端服务
 * 处理学习内容的获取和管理
 */
export class ContentClient {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient('/api');
  }

  /**
   * 获取学习内容
   */
  async getLearningContent(params?: {
    content_type?: string;
    difficulty_level?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams: Record<string, string> = {};
    
    if (params?.content_type) {
      searchParams.content_type = params.content_type;
    }
    if (params?.difficulty_level) {
      searchParams.difficulty_level = params.difficulty_level;
    }
    if (params?.limit) {
      searchParams.limit = params.limit.toString();
    }
    if (params?.offset) {
      searchParams.offset = params.offset.toString();
    }

    return this.apiClient.get('/learning-content', searchParams);
  }

  /**
   * 生成内容
   */
  async generateContent(params: {
    type: string;
    level: string;
    topic?: string;
    length?: number;
  }) {
    return this.apiClient.post('/generate-content', params);
  }

  /**
   * 获取写作提示
   */
  async getWritingPrompts(params?: {
    difficulty_level?: string;
    writing_type?: string;
    limit?: number;
    offset?: number;
  }) {
    const searchParams: Record<string, string> = {};
    
    if (params?.difficulty_level) {
      searchParams.difficulty_level = params.difficulty_level;
    }
    if (params?.writing_type) {
      searchParams.writing_type = params.writing_type;
    }
    if (params?.limit) {
      searchParams.limit = params.limit.toString();
    }
    if (params?.offset) {
      searchParams.offset = params.offset.toString();
    }

    return this.apiClient.get('/writing-prompts', searchParams);
  }

  /**
   * 生成写作内容
   */
  async generateWriting(params: {
    prompt: string;
    type: string;
    level: string;
    wordCount?: number;
  }) {
    return this.apiClient.post('/generate-writing', params);
  }

  /**
   * 删除学习内容
   */
  async deleteLearningContent(id: number) {
    return this.apiClient.delete(`/learning-content?id=${id}`);
  }

  /**
   * 初始化示例内容
   */
  async initializeSampleContent() {
    return this.apiClient.post('/learning-content', {
      action: 'initialize_sample'
    });
  }
}

// 创建单例实例
export const contentClient = new ContentClient();