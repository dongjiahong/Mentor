import { LearningModule } from '@/types';

export interface ModuleRealStats {
  content: {
    totalContents: number;
    newThisWeek: number;
    categories: number;
    recentContents: string[];
  };
  listening: {
    totalExercises: number;
    avgAccuracy: number;
    popularTopics: string[];
    recentSessions: number;
  };
  speaking: {
    totalExercises: number;
    avgPronunciation: number;
    practiceTypes: string[];
    recentSessions: number;
  };
  reading: {
    totalArticles: number;
    avgReadingSpeed: number;
    topics: string[];
    recentSessions: number;
  };
  writing: {
    totalExercises: number;
    avgScore: number;
    types: string[];
    recentSessions: number;
  };
}

/**
 * 模块统计客户端
 * 获取各个学习模块的真实统计数据
 */
export class ModuleStatsClient {
  
  /**
   * 获取所有模块的统计数据
   */
  static async getAllModuleStats(): Promise<ModuleRealStats> {
    try {
      const response = await fetch('/api/module-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_all_stats'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch module stats');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取模块统计失败:', error);
      // 返回默认值，避免界面崩溃
      return this.getDefaultStats();
    }
  }

  /**
   * 获取单个模块的统计数据
   */
  static async getModuleStats(module: LearningModule): Promise<any> {
    try {
      const response = await fetch('/api/module-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_module_stats',
          data: { module }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${module} stats`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error(`获取${module}模块统计失败:`, error);
      return this.getDefaultModuleStats(module);
    }
  }

  /**
   * 获取内容模块的详细统计
   */
  static async getContentModuleStats(): Promise<{
    totalContents: number;
    newThisWeek: number;
    categories: number;
    recentContents: string[];
    contentsByType: Record<string, number>;
    contentsByDifficulty: Record<string, number>;
  }> {
    try {
      const response = await fetch('/api/content-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch content stats');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取内容统计失败:', error);
      return {
        totalContents: 0,
        newThisWeek: 0,
        categories: 0,
        recentContents: [],
        contentsByType: {},
        contentsByDifficulty: {}
      };
    }
  }

  /**
   * 默认统计数据（用作回退）
   */
  private static getDefaultStats(): ModuleRealStats {
    return {
      content: {
        totalContents: 0,
        newThisWeek: 0,
        categories: 0,
        recentContents: []
      },
      listening: {
        totalExercises: 0,
        avgAccuracy: 0,
        popularTopics: ['日常对话', '新闻听力'],
        recentSessions: 0
      },
      speaking: {
        totalExercises: 0,
        avgPronunciation: 0,
        practiceTypes: ['跟读练习', '对话练习'],
        recentSessions: 0
      },
      reading: {
        totalArticles: 0,
        avgReadingSpeed: 0,
        topics: ['科技', '文化'],
        recentSessions: 0
      },
      writing: {
        totalExercises: 0,
        avgScore: 0,
        types: ['邮件写作', '议论文'],
        recentSessions: 0
      }
    };
  }

  /**
   * 单个模块的默认统计数据
   */
  private static getDefaultModuleStats(module: LearningModule): any {
    switch (module) {
      case 'content':
        return {
          totalContents: 0,
          newThisWeek: 0,
          categories: 0,
          recentContents: []
        };
      case 'listening':
        return {
          totalExercises: 0,
          avgAccuracy: 0,
          popularTopics: ['日常对话'],
          recentSessions: 0
        };
      case 'speaking':
        return {
          totalExercises: 0,
          avgPronunciation: 0,
          practiceTypes: ['跟读练习'],
          recentSessions: 0
        };
      case 'reading':
        return {
          totalArticles: 0,
          avgReadingSpeed: 0,
          topics: ['综合阅读'],
          recentSessions: 0
        };
      case 'writing':
        return {
          totalExercises: 0,
          avgScore: 0,
          types: ['自由写作'],
          recentSessions: 0
        };
      default:
        return {};
    }
  }

  /**
   * 刷新模块统计数据（用于数据更新后）
   */
  static async refreshModuleStats(module: LearningModule): Promise<void> {
    try {
      await fetch('/api/module-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'refresh_stats',
          data: { module }
        })
      });
    } catch (error) {
      console.error(`刷新${module}模块统计失败:`, error);
    }
  }
}