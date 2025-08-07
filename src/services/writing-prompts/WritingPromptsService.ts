/**
 * 写作提示服务 - 处理写作练习提示的API调用
 */

export interface WritingPromptItem {
  id: number;
  title: string;
  prompt_text: string;
  writing_type: 'essay' | 'letter' | 'report' | 'story' | 'description' | 'argument';
  difficulty_level: string;
  topic?: string;
  word_count_requirement?: string;
  time_limit?: number;
  evaluation_criteria?: string;
  sample_outline?: string;
  is_ai_generated?: boolean;
  created_at: string;
}

export interface CreateWritingPromptRequest {
  title: string;
  promptText: string;
  writingType: 'essay' | 'letter' | 'report' | 'story' | 'description' | 'argument';
  difficultyLevel: string;
  topic?: string;
  wordCountRequirement?: string;
  timeLimit?: number;
  evaluationCriteria?: string;
  sampleOutline?: string;
}

export interface WritingPromptsQuery {
  writing_type?: string;
  difficulty_level?: string;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export class WritingPromptsService {
  private readonly baseUrl = '/api/writing-prompts';

  /**
   * 获取写作提示列表
   */
  async getWritingPrompts(params?: WritingPromptsQuery): Promise<WritingPromptItem[]> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.writing_type) {
        searchParams.append('writing_type', params.writing_type);
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

      const result: ApiResponse<WritingPromptItem[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || '获取写作提示失败');
      }

      return result.data || [];
    } catch (error) {
      console.error('获取写作提示失败:', error);
      throw error;
    }
  }

  /**
   * 创建写作提示
   */
  async createWritingPrompt(prompt: CreateWritingPromptRequest): Promise<WritingPromptItem> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prompt),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<WritingPromptItem> = await response.json();

      if (!result.success) {
        throw new Error(result.error || '创建写作提示失败');
      }

      if (!result.data) {
        throw new Error('创建写作提示返回数据为空');
      }

      return result.data;
    } catch (error) {
      console.error('创建写作提示失败:', error);
      throw error;
    }
  }

  /**
   * 更新写作提示
   */
  async updateWritingPrompt(id: number, updates: Partial<CreateWritingPromptRequest>): Promise<void> {
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
        throw new Error(result.error || '更新写作提示失败');
      }
    } catch (error) {
      console.error('更新写作提示失败:', error);
      throw error;
    }
  }

  /**
   * 删除写作提示
   */
  async deleteWritingPrompt(id: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.error || '删除写作提示失败');
      }
    } catch (error) {
      console.error('删除写作提示失败:', error);
      throw error;
    }
  }

  /**
   * 批量创建示例写作提示（用于初始化）
   */
  async initializeSamplePrompts(): Promise<void> {
    const samplePrompts: CreateWritingPromptRequest[] = [
      {
        title: '我的梦想职业',
        promptText: '请写一篇关于你理想职业的短文。描述这个职业是什么，为什么你对它感兴趣，以及你需要具备哪些技能和资质。',
        writingType: 'essay',
        difficultyLevel: 'A2',
        topic: '职业规划',
        wordCountRequirement: '150-200词',
        timeLimit: 30,
        evaluationCriteria: JSON.stringify({
          grammar: '语法正确性',
          vocabulary: '词汇使用',
          content: '内容完整性',
          organization: '结构组织'
        }),
        sampleOutline: '1. 介绍理想职业\n2. 说明感兴趣的原因\n3. 描述所需技能\n4. 总结未来计划'
      },
      {
        title: '商务邮件：会议安排',
        promptText: '作为公司的项目经理，你需要给团队成员发送一封邮件，安排下周的项目讨论会议。请包括会议目的、时间、地点和准备事项。',
        writingType: 'letter',
        difficultyLevel: 'B1',
        topic: '商务沟通',
        wordCountRequirement: '120-180词',
        timeLimit: 25,
        evaluationCriteria: JSON.stringify({
          format: '邮件格式',
          clarity: '表达清晰度',
          professionalism: '专业性',
          completeness: '信息完整性'
        }),
        sampleOutline: '1. 邮件标题\n2. 问候语\n3. 会议安排详情\n4. 准备事项\n5. 结束语'
      },
      {
        title: '环境保护调查报告',
        promptText: '请根据假设的数据，写一份关于本地区环境保护现状的简短报告。包括问题分析、影响评估和改进建议。',
        writingType: 'report',
        difficultyLevel: 'B2',
        topic: '环境保护',
        wordCountRequirement: '250-300词',
        timeLimit: 40,
        evaluationCriteria: JSON.stringify({
          structure: '报告结构',
          analysis: '分析深度',
          evidence: '证据支撑',
          recommendations: '建议实用性'
        }),
        sampleOutline: '1. 报告摘要\n2. 现状分析\n3. 问题识别\n4. 影响评估\n5. 改进建议\n6. 结论'
      },
      {
        title: '童年趣事',
        promptText: '请写一个关于你童年时期有趣或难忘经历的短故事。描述当时的情景、人物和你的感受。',
        writingType: 'story',
        difficultyLevel: 'A2',
        topic: '个人经历',
        wordCountRequirement: '180-250词',
        timeLimit: 35,
        evaluationCriteria: JSON.stringify({
          creativity: '创意性',
          narrative: '叙事技巧',
          engagement: '趣味性',
          language: '语言表达'
        }),
        sampleOutline: '1. 故事背景\n2. 主要情节\n3. 转折点\n4. 结局和感受'
      }
    ];

    try {
      // 检查是否已有内容，如果有则不重复初始化
      const existingPrompts = await this.getWritingPrompts({ limit: 1 });
      if (existingPrompts.length > 0) {
        console.log('数据库中已有写作提示，跳过初始化');
        return;
      }

      // 批量创建示例提示
      for (const prompt of samplePrompts) {
        await this.createWritingPrompt(prompt);
      }

      console.log('示例写作提示初始化完成');
    } catch (error) {
      console.error('初始化示例写作提示失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const writingPromptsService = new WritingPromptsService();