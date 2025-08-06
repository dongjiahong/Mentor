import {
  ActivityType,
  LearningRecord,
  LearningStats,
  RecordQueryParams,
  StatsQueryParams,
  EnglishLevel
} from '@/types';

/**
 * 学习记录客户端服务
 * 为React组件提供简化的学习记录接口
 */
export class LearningRecordsClientService {
  private isInitialized = false;

  constructor() {
    // 客户端服务不需要复杂的初始化
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  /**
   * 调用API的通用方法
   */
  private async callAPI(action: string, data?: any): Promise<any> {
    const response = await fetch('/api/learning-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, data }),
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'API调用失败');
    }

    return result.data;
  }

  /**
   * 记录阅读活动
   */
  public async recordReading(params: {
    contentId?: number;
    timeSpent: number;
    wordsRead?: number;
    comprehensionScore?: number;
  }): Promise<LearningRecord> {
    return this.callAPI('record_activity', {
      activityType: 'reading',
      contentId: params.contentId,
      timeSpent: params.timeSpent,
      accuracyScore: params.comprehensionScore
    });
  }

  /**
   * 记录听力活动
   */
  public async recordListening(params: {
    contentId?: number;
    timeSpent: number;
    comprehensionScore?: number;
    playbackSpeed?: number;
  }): Promise<LearningRecord> {
    return this.callAPI('record_activity', {
      activityType: 'listening',
      contentId: params.contentId,
      timeSpent: params.timeSpent,
      accuracyScore: params.comprehensionScore
    });
  }

  /**
   * 记录口语练习活动
   */
  public async recordSpeaking(params: {
    word?: string;
    timeSpent: number;
    pronunciationScore?: number;
    attempts?: number;
  }): Promise<LearningRecord> {
    return this.callAPI('record_activity', {
      activityType: 'speaking',
      word: params.word,
      timeSpent: params.timeSpent,
      accuracyScore: params.pronunciationScore
    });
  }

  /**
   * 记录翻译活动
   */
  public async recordTranslation(params: {
    word?: string;
    timeSpent: number;
    accuracyScore?: number;
    translationType?: 'word' | 'sentence' | 'paragraph';
  }): Promise<LearningRecord> {
    return this.callAPI('record_activity', {
      activityType: 'translation',
      word: params.word,
      timeSpent: params.timeSpent,
      accuracyScore: params.accuracyScore
    });
  }

  /**
   * 记录单词查询活动
   */
  public async recordWordLookup(params: {
    word: string;
    timeSpent: number;
    lookupSource?: string;
  }): Promise<LearningRecord> {
    return this.callAPI('record_activity', {
      activityType: 'translation',
      word: params.word,
      timeSpent: params.timeSpent
    });
  }

  /**
   * 获取学习统计数据
   */
  public async getLearningStats(params?: StatsQueryParams): Promise<LearningStats> {
    return this.callAPI('get_stats', params);
  }

  /**
   * 获取今日学习统计
   */
  public async getTodayStats(): Promise<LearningStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.callAPI('get_stats', {
      startDate: today.toISOString(),
      endDate: tomorrow.toISOString()
    });
  }

  /**
   * 获取本周学习统计
   */
  public async getWeeklyStats(): Promise<LearningStats> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return this.callAPI('get_stats', {
      startDate: startOfWeek.toISOString(),
      endDate: now.toISOString()
    });
  }

  /**
   * 获取本月学习统计
   */
  public async getMonthlyStats(): Promise<LearningStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.callAPI('get_stats', {
      startDate: startOfMonth.toISOString(),
      endDate: now.toISOString()
    });
  }

  /**
   * 获取学习进度趋势
   */
  public async getProgressTrend(days: number = 30): Promise<{
    dailyStats: Array<{
      date: string;
      studyTime: number;
      accuracy: number;
      wordsLearned: number;
    }>;
    weeklyStats: Array<{
      week: string;
      studyTime: number;
      accuracy: number;
      wordsLearned: number;
    }>;
    monthlyStats: Array<{
      month: string;
      studyTime: number;
      accuracy: number;
      wordsLearned: number;
    }>;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    return this.callAPI('get_progress_trend', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days
    });
  }

  /**
   * 评估用户能力水平
   */
  public async evaluateUserAbilities(): Promise<{
    vocabularyLevel: {
      level: EnglishLevel;
      score: number;
      totalWords: number;
      masteredWords: number;
    };
    pronunciationLevel: {
      level: EnglishLevel;
      score: number;
      averageAccuracy: number;
      recentImprovement: number;
    };
    readingLevel: {
      level: EnglishLevel;
      score: number;
      averageReadingTime: number;
      comprehensionAccuracy: number;
    };
  }> {
    return this.callAPI('evaluate_abilities');
  }

  /**
   * 生成学习报告
   */
  public async generateLearningReport(params?: StatsQueryParams): Promise<{
    summary: LearningStats;
    abilities: {
      vocabularyLevel: {
        level: EnglishLevel;
        score: number;
        totalWords: number;
        masteredWords: number;
      };
      pronunciationLevel: {
        level: EnglishLevel;
        score: number;
        averageAccuracy: number;
        recentImprovement: number;
      };
      readingLevel: {
        level: EnglishLevel;
        score: number;
        averageReadingTime: number;
        comprehensionAccuracy: number;
      };
    };
    trends: any;
    recommendations: string[];
    achievements: Array<{
      type: string;
      title: string;
      description: string;
      achievedAt: Date;
    }>;
  }> {
    try {
      // 获取基础统计数据
      const summary = await this.getLearningStats(params);

      // 获取能力评估
      const abilities = await this.evaluateUserAbilities();

      // 简化的趋势数据
      const trends = {
        dailyStats: [],
        weeklyStats: [],
        monthlyStats: []
      };

      // 生成学习建议
      const recommendations = this.generateRecommendations(summary, abilities);

      // 获取成就记录
      const achievements = await this.getAchievements(summary);

      return {
        summary,
        abilities,
        trends,
        recommendations,
        achievements
      };
    } catch (error) {
      console.error('生成学习报告失败:', error);
      throw error;
    }
  }

  /**
   * 获取学习记录列表
   */
  public async getLearningRecords(params?: RecordQueryParams): Promise<LearningRecord[]> {
    return this.callAPI('get_records', params);
  }

  /**
   * 获取最近的学习记录
   */
  public async getRecentRecords(limit: number = 10): Promise<LearningRecord[]> {
    return this.callAPI('get_records', {
      limit,
      offset: 0
    });
  }

  /**
   * 获取特定活动类型的记录
   */
  public async getRecordsByActivity(
    activityType: ActivityType,
    limit: number = 20
  ): Promise<LearningRecord[]> {
    return this.callAPI('get_records', {
      activityType,
      limit,
      offset: 0
    });
  }

  /**
   * 检查是否需要水平提升提醒
   * 实现需求9.4：用户水平提升时提供升级提示
   */
  public async checkLevelUpgrade(): Promise<{
    shouldUpgrade: boolean;
    currentLevel: EnglishLevel;
    suggestedLevel: EnglishLevel;
    reason: string;
  } | null> {
    try {
      // 简化实现：基于能力评估结果判断是否需要升级
      const abilities = await this.evaluateUserAbilities();

      // 计算综合能力水平
      const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as EnglishLevel[];

      const vocabLevelIndex = levels.indexOf(abilities.vocabularyLevel.level);
      const pronLevelIndex = levels.indexOf(abilities.pronunciationLevel.level);
      const readingLevelIndex = levels.indexOf(abilities.readingLevel.level);

      // 取三项能力的平均水平
      const avgLevelIndex = Math.floor((vocabLevelIndex + pronLevelIndex + readingLevelIndex) / 3);
      const suggestedLevel = levels[avgLevelIndex];

      // 假设当前水平为A2，如果建议水平更高则提示升级
      const currentLevel = 'A2' as EnglishLevel;
      const currentLevelIndex = levels.indexOf(currentLevel);

      // 如果建议水平比当前水平高，建议升级
      if (avgLevelIndex > currentLevelIndex) {
        let reason = '根据您的学习表现，建议提升英语水平设置：';

        if (abilities.vocabularyLevel.score >= 80) {
          reason += ' 词汇量表现优秀';
        }
        if (abilities.pronunciationLevel.score >= 80) {
          reason += ' 发音水平良好';
        }
        if (abilities.readingLevel.score >= 80) {
          reason += ' 阅读理解能力强';
        }

        return {
          shouldUpgrade: true,
          currentLevel,
          suggestedLevel,
          reason
        };
      }

      return null;
    } catch (error) {
      console.error('检查水平升级失败:', error);
      return null;
    }
  }

  /**
   * 获取学习成就
   */
  public async getAchievements(stats?: LearningStats): Promise<Array<{
    type: string;
    title: string;
    description: string;
    achievedAt: Date;
    isNew?: boolean;
  }>> {
    const achievements: Array<{
      type: string;
      title: string;
      description: string;
      achievedAt: Date;
    }> = [];

    try {
      const currentStats = stats || await this.getLearningStats();

      // 学习时间成就
      if (currentStats.totalStudyTime >= 3600) { // 1小时
        achievements.push({
          type: 'study_time',
          title: '学习达人',
          description: '累计学习时间超过1小时',
          achievedAt: new Date()
        });
      }

      // 词汇量成就
      if (currentStats.masteredWords >= 100) {
        achievements.push({
          type: 'vocabulary',
          title: '词汇小能手',
          description: '掌握单词数量超过100个',
          achievedAt: new Date()
        });
      }

      // 连续学习成就
      if (currentStats.streakDays >= 7) {
        achievements.push({
          type: 'streak',
          title: '坚持不懈',
          description: '连续学习7天',
          achievedAt: new Date()
        });
      }

      return achievements.map(achievement => ({
        ...achievement,
        isNew: this.isNewAchievement(achievement)
      }));
    } catch (error) {
      console.error('获取成就记录失败:', error);
      return [];
    }
  }

  /**
   * 判断是否为新成就
   */
  private isNewAchievement(achievement: {
    type: string;
    title: string;
    description: string;
    achievedAt: Date;
  }): boolean {
    // 简单判断：如果成就时间在24小时内，认为是新成就
    const now = new Date();
    const timeDiff = now.getTime() - achievement.achievedAt.getTime();
    return timeDiff < 24 * 60 * 60 * 1000; // 24小时
  }

  /**
   * 获取学习建议
   */
  public async getLearningRecommendations(): Promise<string[]> {
    try {
      const stats = await this.getLearningStats();
      const abilities = await this.evaluateUserAbilities();
      return this.generateRecommendations(stats, abilities);
    } catch (error) {
      console.error('获取学习建议失败:', error);
      return [];
    }
  }

  /**
   * 生成学习建议
   */
  private generateRecommendations(
    stats: LearningStats,
    abilities: Awaited<ReturnType<typeof this.evaluateUserAbilities>>
  ): string[] {
    const recommendations: string[] = [];

    // 基于学习时间的建议
    if (stats.totalStudyTime < 1800) { // 少于30分钟
      recommendations.push('建议每天至少学习30分钟以保持学习效果');
    }

    // 基于词汇量的建议
    if (abilities.vocabularyLevel.score < 60) {
      recommendations.push('词汇量有待提升，建议多做单词练习和阅读');
    }

    // 基于发音的建议
    if (abilities.pronunciationLevel.score < 70) {
      recommendations.push('发音准确度需要改善，建议多做跟读练习');
    }

    // 基于阅读的建议
    if (abilities.readingLevel.score < 70) {
      recommendations.push('阅读理解能力需要加强，建议增加阅读练习时间');
    }

    // 基于学习平衡性的建议
    const { activitiesByType } = stats;
    const totalActivities = Object.values(activitiesByType).reduce((sum, count) => sum + count, 0);

    if (totalActivities > 0) {
      const readingRatio = activitiesByType.reading / totalActivities;
      const speakingRatio = activitiesByType.speaking / totalActivities;

      if (readingRatio < 0.3) {
        recommendations.push('建议增加阅读练习，提升阅读理解能力');
      }

      if (speakingRatio < 0.2) {
        recommendations.push('建议增加口语练习，提升发音和表达能力');
      }
    }

    return recommendations;
  }

  /**
   * 保存数据到持久化存储
   */
  public save(): void {
    // API模式下不需要手动保存
  }

  /**
   * 关闭服务
   */
  public close(): void {
    // API模式下不需要手动关闭
  }
}

// 创建单例实例
export const learningRecordsClientService = new LearningRecordsClientService();