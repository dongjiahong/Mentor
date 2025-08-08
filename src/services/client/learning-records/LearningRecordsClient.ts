import {
  ActivityType,
  LearningRecord,
  LearningStats,
  RecordQueryParams,
  StatsQueryParams,
  EnglishLevel
} from '@/types';
import { ApiClient } from '../base/ApiClient';

/**
 * 学习记录客户端服务
 * 纯客户端实现，通过 API 与服务端通信
 */
export class LearningRecordsClient {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient('/api');
  }

  /**
   * 记录阅读活动
   */
  async recordReading(params: {
    contentId?: number;
    timeSpent: number;
    wordsRead?: number;
    comprehensionScore?: number;
  }): Promise<LearningRecord> {
    return this.apiClient.post<LearningRecord>('/learning-records', {
      action: 'record_activity',
      data: {
        activityType: 'reading',
        contentId: params.contentId,
        timeSpent: params.timeSpent,
        accuracyScore: params.comprehensionScore
      }
    });
  }

  /**
   * 记录听力活动
   */
  async recordListening(params: {
    contentId?: number;
    timeSpent: number;
    comprehensionScore?: number;
    playbackSpeed?: number;
  }): Promise<LearningRecord> {
    return this.apiClient.post<LearningRecord>('/learning-records', {
      action: 'record_activity',
      data: {
        activityType: 'listening',
        contentId: params.contentId,
        timeSpent: params.timeSpent,
        accuracyScore: params.comprehensionScore
      }
    });
  }

  /**
   * 记录口语练习活动
   */
  async recordSpeaking(params: {
    word?: string;
    timeSpent: number;
    pronunciationScore?: number;
    attempts?: number;
  }): Promise<LearningRecord> {
    return this.apiClient.post<LearningRecord>('/learning-records', {
      action: 'record_activity',
      data: {
        activityType: 'speaking',
        word: params.word,
        timeSpent: params.timeSpent,
        accuracyScore: params.pronunciationScore
      }
    });
  }

  /**
   * 记录翻译活动
   */
  async recordTranslation(params: {
    word?: string;
    timeSpent: number;
    accuracyScore?: number;
  }): Promise<LearningRecord> {
    return this.apiClient.post<LearningRecord>('/learning-records', {
      action: 'record_activity',
      data: {
        activityType: 'translation',
        word: params.word,
        timeSpent: params.timeSpent,
        accuracyScore: params.accuracyScore
      }
    });
  }

  /**
   * 记录单词查询活动
   */
  async recordWordLookup(params: {
    word: string;
    lookupType: 'translation' | 'pronunciation' | 'definition';
  }): Promise<LearningRecord> {
    return this.apiClient.post<LearningRecord>('/learning-records', {
      action: 'record_word_lookup',
      data: params
    });
  }

  /**
   * 获取学习统计
   */
  async getLearningStats(params?: StatsQueryParams): Promise<LearningStats> {
    return this.apiClient.post<LearningStats>('/learning-records', {
      action: 'get_stats',
      data: params
    });
  }

  /**
   * 获取今日统计
   */
  async getTodayStats(): Promise<LearningStats> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    return this.getLearningStats({
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString()
    });
  }

  /**
   * 获取本周统计
   */
  async getWeeklyStats(): Promise<LearningStats> {
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // 周一为起始日
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    return this.getLearningStats({
      startDate: startOfWeek.toISOString()
    });
  }

  /**
   * 获取本月统计
   */
  async getMonthlyStats(): Promise<LearningStats> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return this.getLearningStats({
      startDate: startOfMonth.toISOString()
    });
  }

  /**
   * 获取学习趋势
   */
  async getProgressTrend(days: number = 30): Promise<{
    dates: string[];
    totalTime: number[];
    totalActivities: number[];
    averageAccuracy: number[];
  }> {
    return this.apiClient.post('/learning-records', {
      action: 'get_progress_trend',
      data: { days }
    });
  }

  /**
   * 评估用户能力
   */
  async evaluateUserAbilities(): Promise<{
    currentLevel: EnglishLevel;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }> {
    return this.apiClient.post('/learning-records', {
      action: 'evaluate_abilities'
    });
  }

  /**
   * 生成学习报告
   */
  async generateLearningReport(params?: StatsQueryParams): Promise<{
    summary: {
      totalTime: number;
      totalActivities: number;
      averageAccuracy: number;
      streakDays: number;
    };
    activityBreakdown: {
      [key in ActivityType]: {
        count: number;
        totalTime: number;
        averageAccuracy: number;
      };
    };
    progressAnalysis: string;
    recommendations: string[];
  }> {
    return this.apiClient.post('/learning-records', {
      action: 'generate_report',
      data: params
    });
  }

  /**
   * 获取学习记录
   */
  async getLearningRecords(params?: RecordQueryParams): Promise<LearningRecord[]> {
    return this.apiClient.post<LearningRecord[]>('/learning-records', {
      action: 'get_records',
      data: params
    });
  }

  /**
   * 获取最近记录
   */
  async getRecentRecords(limit: number = 10): Promise<LearningRecord[]> {
    return this.getLearningRecords({
      limit,
      offset: 0
    });
  }

  /**
   * 按活动类型获取记录
   */
  async getRecordsByActivity(
    activityType: ActivityType,
    limit: number = 50,
    offset: number = 0
  ): Promise<LearningRecord[]> {
    return this.getLearningRecords({
      activityType,
      limit,
      offset
    });
  }

  /**
   * 检查等级升级
   */
  async checkLevelUpgrade(): Promise<{
    canUpgrade: boolean;
    currentLevel: EnglishLevel;
    nextLevel?: EnglishLevel;
    requirements?: string[];
    progress?: number;
  }> {
    return this.apiClient.post('/learning-records', {
      action: 'check_level_upgrade'
    });
  }

  /**
   * 获取成就
   */
  async getAchievements(stats?: LearningStats): Promise<Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress?: number;
    requirement?: string;
  }>> {
    return this.apiClient.post('/learning-records', {
      action: 'get_achievements',
      data: stats
    });
  }

  /**
   * 获取学习建议
   */
  async getLearningRecommendations(): Promise<string[]> {
    return this.apiClient.post('/learning-records', {
      action: 'get_recommendations'
    });
  }

  /**
   * 初始化示例数据
   */
  async initializeSampleData(): Promise<void> {
    await this.apiClient.post('/learning-records/init', {});
  }
}

// 创建单例实例
export const learningRecordsClient = new LearningRecordsClient();