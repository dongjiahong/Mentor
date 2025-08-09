import { ProficiencyAssessment, EnglishLevel } from '@/types/proficiency-assessment';

/**
 * 能力评估客户端服务
 * 提供前端调用的能力评估和升级判断接口
 */
export class ProficiencyAssessmentClient {
  
  /**
   * 获取当前用户的语言能力评估
   */
  static async assessUserProficiency(): Promise<{
    assessment: ProficiencyAssessment;
    recommendations: string[];
  }> {
    try {
      const response = await fetch('/api/proficiency-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'assess_proficiency'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to assess proficiency');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('评估能力失败:', error);
      throw error;
    }
  }

  /**
   * 获取升级建议和要求
   */
  static async getUpgradeRecommendations(): Promise<{
    currentLevel: EnglishLevel;
    canUpgrade: boolean;
    nextLevel: EnglishLevel | null;
    progress: number;
    requirements: any[];
    recommendations: string[];
    moduleStrengths: {
      strongest: string;
      weakest: string;
    };
  }> {
    try {
      const response = await fetch('/api/proficiency-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_upgrade_recommendations'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get upgrade recommendations');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取升级建议失败:', error);
      throw error;
    }
  }

  /**
   * 检查特定级别的要求
   */
  static async checkLevelRequirements(targetLevel?: EnglishLevel): Promise<{
    currentLevel: EnglishLevel;
    targetLevel: EnglishLevel;
    requirements: any[];
    progress: {
      metRequirements: number;
      totalRequirements: number;
      percentage: number;
    };
    canUpgrade: boolean;
    estimatedTimeToUpgrade: string;
    priorityAreas: string[];
  }> {
    try {
      const response = await fetch('/api/proficiency-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check_level_requirements',
          data: { targetLevel }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check level requirements');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('检查级别要求失败:', error);
      throw error;
    }
  }

  /**
   * 获取实时的模块准确率统计（用于界面显示）
   */
  static async getModuleStats(module: 'reading' | 'listening' | 'speaking' | 'writing'): Promise<{
    todayAccuracy: number;
    weekAccuracy: number;
    totalAttempts: number;
    recentTrend: 'up' | 'down' | 'stable';
  }> {
    try {
      const response = await fetch('/api/learning-records', {
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
        throw new Error('Failed to get module stats');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('获取模块统计失败:', error);
      return {
        todayAccuracy: 0,
        weekAccuracy: 0,
        totalAttempts: 0,
        recentTrend: 'stable'
      };
    }
  }

  /**
   * 获取用户成长轨迹数据
   */
  static async getUserProgressTrajectory(): Promise<{
    levelHistory: Array<{
      level: EnglishLevel;
      achievedAt: Date;
      moduleScores: {
        reading: number;
        listening: number;
        speaking: number;
        writing: number;
      };
    }>;
    currentTrajectory: {
      currentLevel: EnglishLevel;
      progressToNext: number;
      estimatedUpgradeDate?: Date;
    };
    milestones: Array<{
      description: string;
      achievedAt: Date;
      level: EnglishLevel;
    }>;
  }> {
    // 这是一个模拟实现，实际应该从数据库获取历史记录
    // 为了演示，返回一些示例数据
    return {
      levelHistory: [
        {
          level: 'A1',
          achievedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90天前
          moduleScores: {
            reading: 65,
            listening: 60,
            speaking: 55,
            writing: 50
          }
        },
        {
          level: 'A2',
          achievedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
          moduleScores: {
            reading: 75,
            listening: 70,
            speaking: 65,
            writing: 60
          }
        }
      ],
      currentTrajectory: {
        currentLevel: 'A2',
        progressToNext: 65,
        estimatedUpgradeDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45天后
      },
      milestones: [
        {
          description: '首次完成阅读理解练习',
          achievedAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
          level: 'A1'
        },
        {
          description: '听力准确率突破70%',
          achievedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
          level: 'A1'
        },
        {
          description: '达到A2级别',
          achievedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          level: 'A2'
        }
      ]
    };
  }

  /**
   * 预测用户升级时间
   */
  static async predictUpgradeTime(targetLevel: EnglishLevel): Promise<{
    estimatedDays: number;
    estimatedDate: Date;
    confidence: 'high' | 'medium' | 'low';
    factors: {
      currentProgress: number;
      recentTrend: 'improving' | 'stable' | 'declining';
      practiceFrequency: 'high' | 'medium' | 'low';
      weakestArea: string;
    };
    recommendations: string[];
  }> {
    try {
      const assessment = await this.assessUserProficiency();
      const requirements = await this.checkLevelRequirements(targetLevel);
      
      // 基于当前进度和要求计算预测
      const totalProgress = requirements.progress.percentage;
      const remainingProgress = 100 - totalProgress;
      
      // 简化的预测算法
      let estimatedDays = 0;
      let confidence: 'high' | 'medium' | 'low' = 'medium';
      
      if (remainingProgress <= 20) {
        estimatedDays = 14; // 2周
        confidence = 'high';
      } else if (remainingProgress <= 40) {
        estimatedDays = 30; // 1个月
        confidence = 'medium';
      } else if (remainingProgress <= 60) {
        estimatedDays = 60; // 2个月
        confidence = 'medium';
      } else {
        estimatedDays = 90; // 3个月
        confidence = 'low';
      }

      const estimatedDate = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000);
      
      return {
        estimatedDays,
        estimatedDate,
        confidence,
        factors: {
          currentProgress: totalProgress,
          recentTrend: 'stable', // 简化实现
          practiceFrequency: 'medium', // 简化实现
          weakestArea: assessment.assessment.weakestModule
        },
        recommendations: requirements.priorityAreas
      };
    } catch (error) {
      console.error('预测升级时间失败:', error);
      throw error;
    }
  }
}