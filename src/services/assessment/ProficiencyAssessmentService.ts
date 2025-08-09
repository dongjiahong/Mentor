import { DatabaseConnection } from '@/types/database';
import { 
  EnglishLevel, 
  LearningModule, 
  ProficiencyAssessment, 
  ModuleAssessment,
  LevelRequirement,
  LEVEL_REQUIREMENTS,
  LEVEL_PROGRESSION,
  LevelStats
} from '@/types/proficiency-assessment';

/**
 * 语言能力评估服务
 * 基于4个学习模块的准确率数据评估用户的语言水平(A1-C2)
 */
export class ProficiencyAssessmentService {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * 评估用户当前的语言能力水平
   */
  public async assessProficiency(): Promise<ProficiencyAssessment> {
    // 1. 获取每个模块的统计数据
    const moduleStats = await this.getModuleStats();
    
    // 2. 评估每个模块的水平
    const moduleAssessments = await this.assessModules(moduleStats);
    
    // 3. 计算综合水平
    const overallLevel = this.calculateOverallLevel(moduleAssessments);
    
    // 4. 检查升级可能性
    const levelUpgrade = this.assessLevelUpgrade(overallLevel, moduleAssessments);
    
    // 5. 找出最强和最弱模块
    const { strongest, weakest } = this.findExtremeModules(moduleAssessments);

    return {
      overallLevel,
      modules: {
        reading: moduleAssessments.reading,
        listening: moduleAssessments.listening,
        speaking: moduleAssessments.speaking,
        writing: moduleAssessments.writing
      },
      levelUpgrade,
      weakestModule: weakest,
      strongestModule: strongest
    };
  }

  /**
   * 获取每个模块的统计数据
   */
  private async getModuleStats(): Promise<Record<LearningModule, LevelStats>> {
    const modules: LearningModule[] = ['reading', 'listening', 'speaking', 'writing'];
    const stats: Record<string, LevelStats> = {};

    for (const module of modules) {
      // 获取基础统计
      const basicStatsQuery = `
        SELECT 
          COUNT(*) as total_attempts,
          SUM(CASE WHEN accuracy_score >= 50 THEN 1 ELSE 0 END) as correct_attempts,
          AVG(accuracy_score) as avg_accuracy,
          AVG(time_spent) as avg_time,
          MAX(created_at) as last_attempt
        FROM learning_records 
        WHERE activity_type = ? AND accuracy_score IS NOT NULL
      `;
      
      const basicResult = this.db.prepare(basicStatsQuery).get(module) as any;
      
      // 获取趋势数据
      const trendStats = await this.calculateTrendStats(module);
      
      stats[module] = {
        totalAttempts: basicResult?.total_attempts || 0,
        correctAttempts: basicResult?.correct_attempts || 0,
        accuracy: basicResult?.avg_accuracy || 0,
        averageTime: basicResult?.avg_time || 0,
        lastAttemptDate: basicResult?.last_attempt ? new Date(basicResult.last_attempt) : undefined,
        trend: trendStats
      };
    }

    return stats as Record<LearningModule, LevelStats>;
  }

  /**
   * 计算趋势统计
   */
  private async calculateTrendStats(module: LearningModule): Promise<{ last7Days: number; last30Days: number; overall: number }> {
    // 最近7天准确率
    const last7DaysQuery = `
      SELECT AVG(accuracy_score) as accuracy
      FROM learning_records 
      WHERE activity_type = ? 
        AND accuracy_score IS NOT NULL 
        AND created_at >= datetime('now', '-7 days')
    `;
    const last7Days = this.db.prepare(last7DaysQuery).get(module) as { accuracy?: number } || {};

    // 最近30天准确率
    const last30DaysQuery = `
      SELECT AVG(accuracy_score) as accuracy
      FROM learning_records 
      WHERE activity_type = ? 
        AND accuracy_score IS NOT NULL 
        AND created_at >= datetime('now', '-30 days')
    `;
    const last30Days = this.db.prepare(last30DaysQuery).get(module) as { accuracy?: number } || {};

    // 总体准确率
    const overallQuery = `
      SELECT AVG(accuracy_score) as accuracy
      FROM learning_records 
      WHERE activity_type = ? AND accuracy_score IS NOT NULL
    `;
    const overall = this.db.prepare(overallQuery).get(module) as { accuracy?: number } || {};

    return {
      last7Days: last7Days.accuracy || 0,
      last30Days: last30Days.accuracy || 0,
      overall: overall.accuracy || 0
    };
  }

  /**
   * 评估每个模块的水平
   */
  private async assessModules(moduleStats: Record<LearningModule, LevelStats>): Promise<Record<LearningModule, ModuleAssessment>> {
    const modules: LearningModule[] = ['reading', 'listening', 'speaking', 'writing'];
    const assessments: Record<string, ModuleAssessment> = {};

    for (const module of modules) {
      const stats = moduleStats[module];
      const currentLevel = this.determineModuleLevel(module, stats.accuracy, stats.totalAttempts);
      const nextLevel = this.getNextLevel(currentLevel);
      
      let nextLevelRequirement = {
        targetAccuracy: 0,
        minimumAttempts: 0,
        currentProgress: 100
      };

      if (nextLevel) {
        const requirement = LEVEL_REQUIREMENTS[nextLevel][module];
        nextLevelRequirement = {
          targetAccuracy: requirement.accuracy,
          minimumAttempts: requirement.minAttempts,
          currentProgress: Math.min(100, (stats.accuracy / requirement.accuracy) * 100)
        };
      }

      assessments[module] = {
        module,
        currentLevel,
        accuracy: stats.accuracy,
        totalAttempts: stats.totalAttempts,
        correctAttempts: stats.correctAttempts,
        recentTrend: stats.trend.last7Days - stats.trend.last30Days,
        nextLevelRequirement
      };
    }

    return assessments as Record<LearningModule, ModuleAssessment>;
  }

  /**
   * 根据准确率和尝试次数确定模块水平
   */
  private determineModuleLevel(module: LearningModule, accuracy: number, totalAttempts: number): EnglishLevel {
    // 从最高级别开始检查
    const levels = [...LEVEL_PROGRESSION].reverse();
    
    for (const level of levels) {
      const requirement = LEVEL_REQUIREMENTS[level][module];
      if (accuracy >= requirement.accuracy && totalAttempts >= requirement.minAttempts) {
        return level;
      }
    }
    
    return 'A1'; // 默认最低级别
  }

  /**
   * 获取下一个级别
   */
  private getNextLevel(currentLevel: EnglishLevel): EnglishLevel | null {
    const currentIndex = LEVEL_PROGRESSION.indexOf(currentLevel);
    return currentIndex < LEVEL_PROGRESSION.length - 1 ? LEVEL_PROGRESSION[currentIndex + 1] : null;
  }

  /**
   * 计算综合语言水平
   */
  private calculateOverallLevel(moduleAssessments: Record<LearningModule, ModuleAssessment>): EnglishLevel {
    const modules = Object.values(moduleAssessments);
    
    // 计算加权平均（不同模块权重可能不同）
    const weights = {
      reading: 0.3,
      listening: 0.3,
      speaking: 0.2,
      writing: 0.2
    };

    let weightedScore = 0;
    let totalWeight = 0;

    modules.forEach(assessment => {
      const levelIndex = LEVEL_PROGRESSION.indexOf(assessment.currentLevel);
      const weight = weights[assessment.module];
      weightedScore += levelIndex * weight;
      totalWeight += weight;
    });

    const averageIndex = Math.round(weightedScore / totalWeight);
    return LEVEL_PROGRESSION[Math.max(0, Math.min(LEVEL_PROGRESSION.length - 1, averageIndex))];
  }

  /**
   * 评估升级可能性
   */
  private assessLevelUpgrade(
    currentLevel: EnglishLevel, 
    moduleAssessments: Record<LearningModule, ModuleAssessment>
  ): {
    canUpgrade: boolean;
    nextLevel: EnglishLevel | null;
    requirements: LevelRequirement[];
    overallProgress: number;
  } {
    const nextLevel = this.getNextLevel(currentLevel);
    if (!nextLevel) {
      return {
        canUpgrade: false,
        nextLevel: null,
        requirements: [],
        overallProgress: 100
      };
    }

    const requirements: LevelRequirement[] = [];
    let totalProgress = 0;
    let metRequirements = 0;

    Object.values(moduleAssessments).forEach(assessment => {
      const requirement = LEVEL_REQUIREMENTS[nextLevel][assessment.module];
      const met = assessment.accuracy >= requirement.accuracy && assessment.totalAttempts >= requirement.minAttempts;
      
      if (met) metRequirements++;
      
      const progress = Math.min(100, (assessment.accuracy / requirement.accuracy) * 100);
      totalProgress += progress;

      requirements.push({
        module: assessment.module,
        currentAccuracy: assessment.accuracy,
        requiredAccuracy: requirement.accuracy,
        minimumAttempts: requirement.minAttempts,
        currentAttempts: assessment.totalAttempts,
        met,
        description: this.generateRequirementDescription(assessment.module, requirement, assessment)
      });
    });

    const overallProgress = totalProgress / 4;
    const canUpgrade = metRequirements >= 3; // 至少3个模块达到要求

    return {
      canUpgrade,
      nextLevel,
      requirements,
      overallProgress
    };
  }

  /**
   * 生成要求描述
   */
  private generateRequirementDescription(
    module: LearningModule,
    requirement: { accuracy: number; minAttempts: number },
    assessment: ModuleAssessment
  ): string {
    const moduleNames = {
      reading: '阅读',
      listening: '听力',
      speaking: '口语',
      writing: '写作'
    };

    const accuracyGap = requirement.accuracy - assessment.accuracy;
    const attemptsGap = requirement.minAttempts - assessment.totalAttempts;

    if (accuracyGap > 0 && attemptsGap > 0) {
      return `${moduleNames[module]}：需要提高${accuracyGap.toFixed(1)}%准确率，还需要${attemptsGap}次练习`;
    } else if (accuracyGap > 0) {
      return `${moduleNames[module]}：需要提高${accuracyGap.toFixed(1)}%准确率`;
    } else if (attemptsGap > 0) {
      return `${moduleNames[module]}：还需要${attemptsGap}次练习`;
    } else {
      return `${moduleNames[module]}：已达到要求 ✓`;
    }
  }

  /**
   * 找出最强和最弱的模块
   */
  private findExtremeModules(moduleAssessments: Record<LearningModule, ModuleAssessment>): {
    strongest: LearningModule;
    weakest: LearningModule;
  } {
    const modules = Object.values(moduleAssessments);
    
    let strongest = modules[0];
    let weakest = modules[0];

    modules.forEach(assessment => {
      if (assessment.accuracy > strongest.accuracy) {
        strongest = assessment;
      }
      if (assessment.accuracy < weakest.accuracy) {
        weakest = assessment;
      }
    });

    return {
      strongest: strongest.module,
      weakest: weakest.module
    };
  }

  /**
   * 获取升级建议
   */
  public generateUpgradeRecommendations(assessment: ProficiencyAssessment): string[] {
    const recommendations: string[] = [];
    
    // 基于最弱模块的建议
    const weakestModule = assessment.modules[assessment.weakestModule];
    const moduleNames = {
      reading: '阅读理解',
      listening: '听力理解',
      speaking: '口语表达',
      writing: '写作能力'
    };

    recommendations.push(`重点提升${moduleNames[assessment.weakestModule]}，当前准确率为${weakestModule.accuracy.toFixed(1)}%`);

    // 基于升级要求的建议
    if (!assessment.levelUpgrade.canUpgrade && assessment.levelUpgrade.nextLevel) {
      assessment.levelUpgrade.requirements
        .filter(req => !req.met)
        .slice(0, 2) // 只显示前2个最重要的
        .forEach(req => {
          recommendations.push(req.description);
        });
    }

    // 基于趋势的建议
    Object.values(assessment.modules).forEach(module => {
      if (module.recentTrend < -5) { // 准确率下降超过5%
        recommendations.push(`${moduleNames[module.module]}最近表现下降，建议加强练习`);
      }
    });

    return recommendations.slice(0, 5); // 最多5条建议
  }
}