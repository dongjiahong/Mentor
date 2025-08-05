/**
 * 记忆曲线算法模块
 * 基于艾宾浩斯遗忘曲线和SuperMemo算法实现
 */

export interface MemoryInterval {
  level: number;
  days: number;
  description: string;
}

export interface ReviewResult {
  wordId: number;
  accuracyScore: number;
  responseTime: number; // 响应时间（毫秒）
  difficulty: number;   // 主观难度评分 1-5
}

export interface MemoryState {
  proficiencyLevel: number;
  easinessFactor: number;    // 简易因子（SuperMemo算法）
  interval: number;          // 当前间隔天数
  repetitions: number;       // 重复次数
  lastReview: Date;
  nextReview: Date;
}

/**
 * 记忆曲线算法类
 * 结合艾宾浩斯遗忘曲线和SuperMemo算法
 */
export class MemoryAlgorithm {
  // 基础间隔配置（天）
  private static readonly BASE_INTERVALS: MemoryInterval[] = [
    { level: 0, days: 0, description: '立即复习' },
    { level: 1, days: 1, description: '1天后' },
    { level: 2, days: 3, description: '3天后' },
    { level: 3, days: 7, description: '1周后' },
    { level: 4, days: 15, description: '2周后' },
    { level: 5, days: 30, description: '1个月后' },
    { level: 6, days: 60, description: '2个月后' },
    { level: 7, days: 120, description: '4个月后' },
    { level: 8, days: 240, description: '8个月后' },
    { level: 9, days: 365, description: '1年后' }
  ];

  // SuperMemo算法参数
  private static readonly MIN_EASINESS_FACTOR = 1.3;
  private static readonly DEFAULT_EASINESS_FACTOR = 2.5;
  private static readonly EASINESS_FACTOR_MODIFIER = 0.1;

  // 准确率阈值
  private static readonly ACCURACY_THRESHOLDS = {
    EXCELLENT: 0.9,   // 优秀
    GOOD: 0.8,        // 良好
    FAIR: 0.6,        // 一般
    POOR: 0.4         // 较差
  };

  /**
   * 计算下次复习时间（基础艾宾浩斯曲线）
   */
  public static calculateBasicNextReview(proficiencyLevel: number): Date {
    const now = new Date();
    const interval = this.BASE_INTERVALS[Math.min(proficiencyLevel, this.BASE_INTERVALS.length - 1)];
    
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + interval.days);
    
    return nextReview;
  }

  /**
   * 使用SuperMemo算法计算下次复习时间
   */
  public static calculateSuperMemoNextReview(
    currentState: MemoryState,
    reviewResult: ReviewResult
  ): MemoryState {
    const { accuracyScore, responseTime, difficulty } = reviewResult;
    
    // 计算质量评分（0-5）
    const quality = this.calculateQuality(accuracyScore, responseTime, difficulty);
    
    let newEasinessFactor = currentState.easinessFactor;
    let newInterval = currentState.interval;
    let newRepetitions = currentState.repetitions;
    let newProficiencyLevel = currentState.proficiencyLevel;

    if (quality >= 3) {
      // 回答正确
      if (currentState.repetitions === 0) {
        newInterval = 1;
      } else if (currentState.repetitions === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(currentState.interval * newEasinessFactor);
      }
      
      newRepetitions += 1;
      
      // 提升熟练度
      if (quality >= 4 && newProficiencyLevel < 9) {
        newProficiencyLevel += 1;
      }
    } else {
      // 回答错误，重置间隔
      newRepetitions = 0;
      newInterval = 1;
      
      // 降低熟练度
      if (newProficiencyLevel > 0) {
        newProficiencyLevel = Math.max(0, newProficiencyLevel - 1);
      }
    }

    // 更新简易因子
    newEasinessFactor = Math.max(
      this.MIN_EASINESS_FACTOR,
      newEasinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + newInterval);

    return {
      proficiencyLevel: newProficiencyLevel,
      easinessFactor: newEasinessFactor,
      interval: newInterval,
      repetitions: newRepetitions,
      lastReview: now,
      nextReview
    };
  }

  /**
   * 计算质量评分（SuperMemo算法）
   */
  private static calculateQuality(
    accuracyScore: number,
    responseTime: number,
    difficulty: number
  ): number {
    let quality = 0;

    // 基于准确率的基础评分
    if (accuracyScore >= this.ACCURACY_THRESHOLDS.EXCELLENT) {
      quality = 5; // 完美
    } else if (accuracyScore >= this.ACCURACY_THRESHOLDS.GOOD) {
      quality = 4; // 正确且容易
    } else if (accuracyScore >= this.ACCURACY_THRESHOLDS.FAIR) {
      quality = 3; // 正确但困难
    } else if (accuracyScore >= this.ACCURACY_THRESHOLDS.POOR) {
      quality = 2; // 错误但记得
    } else {
      quality = 1; // 错误且不记得
    }

    // 根据响应时间调整（响应时间越短，质量越高）
    const timeBonus = this.calculateTimeBonus(responseTime);
    quality = Math.min(5, quality + timeBonus);

    // 根据主观难度调整
    const difficultyPenalty = (difficulty - 3) * 0.2; // 难度3为中性
    quality = Math.max(0, Math.min(5, quality - difficultyPenalty));

    return Math.round(quality);
  }

  /**
   * 计算响应时间奖励
   */
  private static calculateTimeBonus(responseTime: number): number {
    // 响应时间阈值（毫秒）
    const FAST_RESPONSE = 2000;   // 2秒
    const NORMAL_RESPONSE = 5000; // 5秒
    const SLOW_RESPONSE = 10000;  // 10秒

    if (responseTime <= FAST_RESPONSE) {
      return 0.5; // 快速响应奖励
    } else if (responseTime <= NORMAL_RESPONSE) {
      return 0; // 正常响应无奖励
    } else if (responseTime <= SLOW_RESPONSE) {
      return -0.2; // 慢响应小惩罚
    } else {
      return -0.5; // 很慢响应大惩罚
    }
  }

  /**
   * 获取推荐的复习优先级
   */
  public static calculateReviewPriority(memoryState: MemoryState): number {
    const now = new Date();
    const overdueDays = Math.max(0, 
      (now.getTime() - memoryState.nextReview.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // 优先级计算：过期天数 + 熟练度权重
    const proficiencyWeight = (5 - memoryState.proficiencyLevel) * 0.1;
    const priority = overdueDays + proficiencyWeight;
    
    return Math.max(0, priority);
  }

  /**
   * 批量计算复习优先级
   */
  public static sortByReviewPriority(memoryStates: MemoryState[]): MemoryState[] {
    return memoryStates
      .map(state => ({
        ...state,
        priority: this.calculateReviewPriority(state)
      }))
      .sort((a, b) => (b as any).priority - (a as unknown).priority);
  }

  /**
   * 获取间隔描述
   */
  public static getIntervalDescription(days: number): string {
    const interval = this.BASE_INTERVALS.find(i => i.days === days);
    if (interval) {
      return interval.description;
    }

    if (days < 1) {
      return '立即复习';
    } else if (days === 1) {
      return '明天';
    } else if (days < 7) {
      return `${days}天后`;
    } else if (days < 30) {
      const weeks = Math.round(days / 7);
      return `${weeks}周后`;
    } else if (days < 365) {
      const months = Math.round(days / 30);
      return `${months}个月后`;
    } else {
      const years = Math.round(days / 365);
      return `${years}年后`;
    }
  }

  /**
   * 创建默认记忆状态
   */
  public static createDefaultMemoryState(): MemoryState {
    const now = new Date();
    return {
      proficiencyLevel: 0,
      easinessFactor: this.DEFAULT_EASINESS_FACTOR,
      interval: 0,
      repetitions: 0,
      lastReview: now,
      nextReview: now
    };
  }

  /**
   * 验证记忆状态
   */
  public static validateMemoryState(state: MemoryState): boolean {
    return (
      state.proficiencyLevel >= 0 && state.proficiencyLevel <= 9 &&
      state.easinessFactor >= this.MIN_EASINESS_FACTOR &&
      state.interval >= 0 &&
      state.repetitions >= 0 &&
      state.lastReview instanceof Date &&
      state.nextReview instanceof Date
    );
  }

  /**
   * 获取学习建议
   */
  public static getLearningAdvice(memoryState: MemoryState): string {
    const { proficiencyLevel, repetitions } = memoryState;
    
    if (proficiencyLevel === 0) {
      return '这是一个新单词，建议多次练习以建立初步记忆。';
    } else if (proficiencyLevel <= 2) {
      return '单词还不够熟悉，建议结合例句和语境进行学习。';
    } else if (proficiencyLevel <= 4) {
      return '单词掌握程度良好，继续保持复习频率。';
    } else if (proficiencyLevel <= 6) {
      return '单词掌握较好，可以适当延长复习间隔。';
    } else {
      return '单词掌握优秀，只需要偶尔复习以保持记忆。';
    }
  }

  /**
   * 计算遗忘概率
   */
  public static calculateForgettingProbability(memoryState: MemoryState): number {
    const now = new Date();
    const daysSinceLastReview = (now.getTime() - memoryState.lastReview.getTime()) / (1000 * 60 * 60 * 24);
    
    // 基于艾宾浩斯遗忘曲线的简化模型
    // P(t) = e^(-t/S) 其中 t 是时间，S 是记忆强度
    const memoryStrength = Math.max(0.1, memoryState.proficiencyLevel * memoryState.easinessFactor);
    const forgettingProbability = Math.exp(-daysSinceLastReview / memoryStrength);
    
    return Math.max(0, Math.min(1, 1 - forgettingProbability));
  }
}