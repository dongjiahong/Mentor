/**
 * 学习内容服务 - 处理学习内容的API调用
 */

export interface LearningContentItem {
  id: number;
  title?: string;
  content_type: 'dialogue' | 'article' | 'mixed';
  original_text: string;
  translation: string;
  difficulty_level: string;
  topic?: string;
  word_count?: number;
  estimated_reading_time?: number;
  activity_types?: string; // 以逗号分隔的字符串
  is_ai_generated?: boolean;
  created_at: string;
}

export interface CreateLearningContentRequest {
  title?: string;
  contentType: 'dialogue' | 'article' | 'mixed';
  originalText: string;
  translation: string;
  difficultyLevel: string;
  topic?: string;
  wordCount?: number;
  estimatedReadingTime?: number;
  activityTypes?: string[];
}

export interface LearningContentQuery {
  content_type?: string;
  difficulty_level?: string;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class LearningContentService {
  private readonly baseUrl = '/api/learning-content';

  /**
   * 获取学习内容列表
   */
  async getLearningContent(params?: LearningContentQuery): Promise<LearningContentItem[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.content_type) {
        searchParams.append('content_type', params.content_type);
      }
      if (params?.difficulty_level) {
        searchParams.append('difficulty_level', params.difficulty_level);
      }
      if (params?.limit) {
        searchParams.append('limit', params.limit.toString());
      }
      if (params?.offset) {
        searchParams.append('offset', params.offset.toString());
      }

      const url = `${this.baseUrl}?${searchParams.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<LearningContentItem[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || '获取学习内容失败');
      }

      return result.data || [];
    } catch (error) {
      console.error('获取学习内容失败:', error);
      throw error;
    }
  }

  /**
   * 创建学习内容
   */
  async createLearningContent(content: CreateLearningContentRequest): Promise<LearningContentItem> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(content),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<LearningContentItem> = await response.json();

      if (!result.success) {
        throw new Error(result.error || '创建学习内容失败');
      }

      if (!result.data) {
        throw new Error('创建学习内容返回数据为空');
      }

      return result.data;
    } catch (error) {
      console.error('创建学习内容失败:', error);
      throw error;
    }
  }

  /**
   * 更新学习内容
   */
  async updateLearningContent(id: number, updates: Partial<CreateLearningContentRequest>): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.error || '更新学习内容失败');
      }
    } catch (error) {
      console.error('更新学习内容失败:', error);
      throw error;
    }
  }

  /**
   * 删除学习内容
   */
  async deleteLearningContent(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.error || '删除学习内容失败');
      }
    } catch (error) {
      console.error('删除学习内容失败:', error);
      throw error;
    }
  }

  /**
   * 批量创建示例学习内容（用于初始化）
   */
  async initializeSampleContent(): Promise<void> {
    const sampleContents: CreateLearningContentRequest[] = [
      {
        contentType: 'article',
        originalText: 'Technology has revolutionized the way we live, work, and communicate in the modern world. Smartphones have become essential tools that connect us to information and people instantly.',
        translation: '技术已经彻底改变了我们在现代世界中生活、工作和交流的方式。智能手机已成为连接我们与信息和人们的重要工具。',
        difficultyLevel: 'B1',
        topic: '科技与生活'
      },
      {
        contentType: 'article',
        originalText: 'Climate change is one of the most pressing challenges facing humanity in the 21st century. Renewable energy sources like solar and wind power offer sustainable alternatives to fossil fuels.',
        translation: '气候变化是21世纪人类面临的最紧迫挑战之一。太阳能和风能等可再生能源为化石燃料提供了可持续的替代选择。',
        difficultyLevel: 'B2',
        topic: '环保与可持续发展'
      },
      {
        contentType: 'article',
        originalText: 'Regular exercise is essential for maintaining good physical and mental health. A balanced diet with plenty of fruits and vegetables provides the nutrients our body needs.',
        translation: '定期锻炼对保持良好的身心健康至关重要。富含水果和蔬菜的均衡饮食为我们的身体提供所需的营养。',
        difficultyLevel: 'A2',
        topic: '健康生活方式'
      },
      {
        contentType: 'dialogue',
        originalText: 'A: Good morning! How can I help you today?\nB: I\'d like to book a table for dinner tonight.\nA: Certainly! How many people will be dining?\nB: Four people, please. Around 7 PM if possible.',
        translation: 'A: 早上好！今天我能为您做些什么？\nB: 我想预订今晚的晚餐桌位。\nA: 当然可以！请问有几位用餐？\nB: 四个人，如果可能的话，大约7点。',
        difficultyLevel: 'A2',
        topic: '餐厅预订'
      },
      {
        contentType: 'dialogue',
        originalText: 'A: What do you think about remote work?\nB: I believe it offers great flexibility, but it can be challenging to maintain work-life balance.\nA: That\'s true. Communication with colleagues can also be more difficult.',
        translation: 'A: 你对远程工作有什么看法？\nB: 我认为它提供了很大的灵活性，但保持工作与生活的平衡可能会很困难。\nA: 这是真的。与同事的沟通也可能更加困难。',
        difficultyLevel: 'B1',
        topic: '工作讨论'
      }
    ];

    try {
      // 检查是否已有内容，如果有则不重复初始化
      const existingContent = await this.getLearningContent({ limit: 1 });
      if (existingContent.length > 0) {
        console.log('数据库中已有学习内容，跳过初始化');
        return;
      }

      // 批量创建示例内容
      for (const content of sampleContents) {
        await this.createLearningContent(content);
      }

      console.log('示例学习内容初始化完成');
    } catch (error) {
      console.error('初始化示例学习内容失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const learningContentService = new LearningContentService();