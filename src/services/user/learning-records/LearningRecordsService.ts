import {
  LearningRecord,
  ActivityType,
  LearningStats,
  RecordQueryParams,
  StatsQueryParams,
  DatabaseError,
  DatabaseErrorType,
  EnglishLevel
} from '@/types';
import { StorageService } from '../../core/storage/StorageService';

/**
 * 学习记录服务
 * 负责记录、分析和统计用户的学习行为数据
 */
export class LearningRecordsService {
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * 记录学习活动
   * 实现需求9.1：记录学习行为数据
   */
  public async recordActivity(params: {
    activityType: ActivityType;
    contentId?: number;
    word?: string;
    accuracyScore?: number;
    timeSpent: number;
    metadata?: Record<string, unknown>;
  }): Promise<LearningRecord> {
    try {
      const record = await this.storageService.recordLearningActivity({
        activityType: params.activityType,
        contentId: params.contentId,
        word: params.word,
        accuracyScore: params.accuracyScore,
        timeSpent: params.timeSpent,
        metadata: params.metadata
      });

      // 记录成功后，触发统计数据更新
      await this.updateDailyStats();

      return record;
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '记录学习活动失败',
        details: error
      });
    }
  }

  /**
   * 获取学习记录列表
   */
  public async getLearningRecords(params?: RecordQueryParams): Promise<LearningRecord[]> {
    try {
      const dbConnection = this.storageService.getDatabaseConnection();
      
      let query = 'SELECT * FROM learning_records';
      const conditions: string[] = [];
      const values: unknown[] = [];

      // 构建查询条件
      if (params?.activityType) {
        conditions.push('activity_type = ?');
        values.push(params.activityType);
      }

      if (params?.startDate) {
        conditions.push('created_at >= ?');
        values.push(params.startDate.toISOString());
      }

      if (params?.endDate) {
        conditions.push('created_at <= ?');
        values.push(params.endDate.toISOString());
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      if (params?.limit) {
        query += ' LIMIT ?';
        values.push(params.limit);
      }

      if (params?.offset) {
        query += ' OFFSET ?';
        values.push(params.offset);
      }

      const results = dbConnection.exec(query, values);
      
      return results.map(row => this.mapRowToLearningRecord(row));
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取学习记录失败',
        details: error
      });
    }
  }

  /**
   * 获取学习统计数据
   * 实现需求9.2：评估单词量、发音水平和阅读理解能力
   */
  public async getLearningStats(params?: StatsQueryParams): Promise<LearningStats> {
    try {
      const dbConnection = this.storageService.getDatabaseConnection();
      
      // 构建时间范围条件
      let timeCondition = '';
      const timeValues: unknown[] = [];
      
      if (params?.startDate) {
        timeCondition += ' AND lr.created_at >= ?';
        timeValues.push(params.startDate.toISOString());
      }
      
      if (params?.endDate) {
        timeCondition += ' AND lr.created_at <= ?';
        timeValues.push(params.endDate.toISOString());
      }

      // 1. 计算总学习时间
      const totalTimeQuery = `
        SELECT COALESCE(SUM(time_spent), 0) as total_time 
        FROM learning_records lr 
        WHERE 1=1 ${timeCondition}
      `;
      const totalTimeResult = dbConnection.exec(totalTimeQuery, timeValues)[0] as any;
      const totalStudyTime = totalTimeResult?.total_time || 0;

      // 2. 计算单词相关统计
      const wordStatsQuery = `
        SELECT 
          COUNT(DISTINCT w.word) as total_words,
          COUNT(DISTINCT CASE WHEN w.proficiency_level >= 4 THEN w.word END) as mastered_words
        FROM wordbook w
      `;
      const wordStatsResult = dbConnection.exec(wordStatsQuery)[0] as any;
      const totalWords = wordStatsResult?.total_words || 0;
      const masteredWords = wordStatsResult?.mastered_words || 0;

      // 3. 计算平均准确率
      const accuracyQuery = `
        SELECT AVG(accuracy_score) as avg_accuracy 
        FROM learning_records lr 
        WHERE accuracy_score IS NOT NULL ${timeCondition}
      `;
      const accuracyResult = dbConnection.exec(accuracyQuery, timeValues)[0] as any;
      const averageAccuracy = accuracyResult?.avg_accuracy || 0;

      // 4. 计算连续学习天数
      const streakDays = await this.calculateStreakDays();

      // 5. 按活动类型统计
      const activitiesByTypeQuery = `
        SELECT 
          activity_type,
          COUNT(*) as count
        FROM learning_records lr 
        WHERE 1=1 ${timeCondition}
        GROUP BY activity_type
      `;
      const activitiesResult = dbConnection.exec(activitiesByTypeQuery, timeValues);
      
      const activitiesByType: Record<ActivityType, number> = {
        reading: 0,
        listening: 0,
        speaking: 0,
        translation: 0
      };

      activitiesResult.forEach((row: any) => {
        activitiesByType[row.activity_type as ActivityType] = row.count;
      });

      return {
        totalStudyTime,
        totalWords,
        masteredWords,
        averageAccuracy,
        streakDays,
        activitiesByType
      };
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取学习统计数据失败',
        details: error
      });
    }
  }

  /**
   * 获取学习进度趋势数据
   * 用于生成成长报告
   */
  public async getProgressTrend(params?: StatsQueryParams): Promise<{
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
    try {
      const dbConnection = this.storageService.getDatabaseConnection();
      
      // 构建时间范围条件
      let timeCondition = '';
      const timeValues: unknown[] = [];
      
      if (params?.startDate) {
        timeCondition += ' AND created_at >= ?';
        timeValues.push(params.startDate.toISOString());
      }
      
      if (params?.endDate) {
        timeCondition += ' AND created_at <= ?';
        timeValues.push(params.endDate.toISOString());
      }

      // 获取每日统计
      const dailyStatsQuery = `
        SELECT 
          DATE(created_at) as date,
          SUM(time_spent) as study_time,
          AVG(CASE WHEN accuracy_score IS NOT NULL THEN accuracy_score END) as accuracy,
          COUNT(DISTINCT word) as words_learned
        FROM learning_records 
        WHERE 1=1 ${timeCondition}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      `;
      
      const dailyResults = dbConnection.exec(dailyStatsQuery, timeValues);
      const dailyStats = dailyResults.map((row: any) => ({
        date: row.date,
        studyTime: row.study_time || 0,
        accuracy: row.accuracy || 0,
        wordsLearned: row.words_learned || 0
      }));

      // 获取每周统计
      const weeklyStatsQuery = `
        SELECT 
          strftime('%Y-W%W', created_at) as week,
          SUM(time_spent) as study_time,
          AVG(CASE WHEN accuracy_score IS NOT NULL THEN accuracy_score END) as accuracy,
          COUNT(DISTINCT word) as words_learned
        FROM learning_records 
        WHERE 1=1 ${timeCondition}
        GROUP BY strftime('%Y-W%W', created_at)
        ORDER BY week DESC
        LIMIT 12
      `;
      
      const weeklyResults = dbConnection.exec(weeklyStatsQuery, timeValues);
      const weeklyStats = weeklyResults.map((row: any) => ({
        week: row.week,
        studyTime: row.study_time || 0,
        accuracy: row.accuracy || 0,
        wordsLearned: row.words_learned || 0
      }));

      // 获取每月统计
      const monthlyStatsQuery = `
        SELECT 
          strftime('%Y-%m', created_at) as month,
          SUM(time_spent) as study_time,
          AVG(CASE WHEN accuracy_score IS NOT NULL THEN accuracy_score END) as accuracy,
          COUNT(DISTINCT word) as words_learned
        FROM learning_records 
        WHERE 1=1 ${timeCondition}
        GROUP BY strftime('%Y-%m', created_at)
        ORDER BY month DESC
        LIMIT 12
      `;
      
      const monthlyResults = dbConnection.exec(monthlyStatsQuery, timeValues);
      const monthlyStats = monthlyResults.map((row: any) => ({
        month: row.month,
        studyTime: row.study_time || 0,
        accuracy: row.accuracy || 0,
        wordsLearned: row.words_learned || 0
      }));

      return {
        dailyStats,
        weeklyStats,
        monthlyStats
      };
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '获取学习进度趋势失败',
        details: error
      });
    }
  }

  /**
   * 评估用户能力水平
   * 实现需求9.2：评估单词量、发音水平和阅读理解能力
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
    try {
      const dbConnection = this.storageService.getDatabaseConnection();

      // 1. 评估词汇水平
      const vocabularyQuery = `
        SELECT 
          COUNT(*) as total_words,
          COUNT(CASE WHEN proficiency_level >= 4 THEN 1 END) as mastered_words,
          AVG(proficiency_level) as avg_proficiency
        FROM wordbook
      `;
      const vocabResult = dbConnection.exec(vocabularyQuery)[0] as any;
      const totalWords = vocabResult?.total_words || 0;
      const masteredWords = vocabResult?.mastered_words || 0;
      const avgProficiency = vocabResult?.avg_proficiency || 0;

      // 根据掌握的单词数量评估词汇水平
      const vocabularyLevel = this.calculateVocabularyLevel(masteredWords);
      const vocabularyScore = Math.min(100, (masteredWords / this.getVocabularyTarget(vocabularyLevel)) * 100);

      // 2. 评估发音水平
      const pronunciationQuery = `
        SELECT 
          AVG(accuracy_score) as avg_accuracy,
          COUNT(*) as total_attempts
        FROM learning_records 
        WHERE activity_type = 'speaking' 
          AND accuracy_score IS NOT NULL 
          AND created_at >= datetime('now', '-30 days')
      `;
      const pronResult = dbConnection.exec(pronunciationQuery)[0] as any;
      const pronunciationAccuracy = pronResult?.avg_accuracy || 0;

      // 计算发音改进趋势
      const recentImprovement = await this.calculatePronunciationImprovement();
      
      const pronunciationLevel = this.calculatePronunciationLevel(pronunciationAccuracy);
      const pronunciationScore = pronunciationAccuracy;

      // 3. 评估阅读水平
      const readingQuery = `
        SELECT 
          AVG(time_spent) as avg_reading_time,
          AVG(accuracy_score) as avg_comprehension
        FROM learning_records 
        WHERE activity_type = 'reading' 
          AND created_at >= datetime('now', '-30 days')
      `;
      const readingResult = dbConnection.exec(readingQuery)[0] as any;
      const averageReadingTime = readingResult?.avg_reading_time || 0;
      const comprehensionAccuracy = readingResult?.avg_comprehension || 0;

      const readingLevel = this.calculateReadingLevel(comprehensionAccuracy, averageReadingTime);
      const readingScore = comprehensionAccuracy;

      return {
        vocabularyLevel: {
          level: vocabularyLevel,
          score: vocabularyScore,
          totalWords,
          masteredWords
        },
        pronunciationLevel: {
          level: pronunciationLevel,
          score: pronunciationScore,
          averageAccuracy: pronunciationAccuracy,
          recentImprovement
        },
        readingLevel: {
          level: readingLevel,
          score: readingScore,
          averageReadingTime,
          comprehensionAccuracy
        }
      };
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '评估用户能力水平失败',
        details: error
      });
    }
  }

  /**
   * 生成学习报告
   * 整合各项统计数据生成综合报告
   */
  public async generateLearningReport(params?: StatsQueryParams): Promise<{
    summary: LearningStats;
    abilities: Awaited<ReturnType<typeof this.evaluateUserAbilities>>;
    trends: Awaited<ReturnType<typeof this.getProgressTrend>>;
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
      
      // 获取进度趋势
      const trends = await this.getProgressTrend(params);
      
      // 生成学习建议
      const recommendations = this.generateRecommendations(summary, abilities);
      
      // 获取成就记录
      const achievements = await this.getAchievements();

      return {
        summary,
        abilities,
        trends,
        recommendations,
        achievements
      };
    } catch (error) {
      throw new DatabaseError({
        type: DatabaseErrorType.QUERY_FAILED,
        message: '生成学习报告失败',
        details: error
      });
    }
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 更新每日统计数据
   */
  private async updateDailyStats(): Promise<void> {
    // 这里可以实现每日统计数据的缓存更新逻辑
    // 为了性能考虑，可以将统计数据缓存到单独的表中
  }

  /**
   * 计算连续学习天数
   */
  private async calculateStreakDays(): Promise<number> {
    try {
      const dbConnection = this.storageService.getDatabaseConnection();
      
      // 获取最近的学习日期
      const recentDaysQuery = `
        SELECT DISTINCT DATE(created_at) as study_date
        FROM learning_records 
        ORDER BY study_date DESC
        LIMIT 100
      `;
      
      const results = dbConnection.exec(recentDaysQuery);
      const studyDates = results.map((row: any) => new Date(row.study_date));
      
      if (studyDates.length === 0) {
        return 0;
      }

      // 计算连续天数
      let streakDays = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 检查今天是否学习了
      const latestDate = studyDates[0];
      latestDate.setHours(0, 0, 0, 0);
      
      if (latestDate.getTime() !== today.getTime() && 
          latestDate.getTime() !== today.getTime() - 24 * 60 * 60 * 1000) {
        return 0; // 如果最近学习不是今天或昨天，连续天数为0
      }

      // 从最近的日期开始计算连续天数
      for (let i = 1; i < studyDates.length; i++) {
        const currentDate = studyDates[i];
        const previousDate = studyDates[i - 1];
        
        currentDate.setHours(0, 0, 0, 0);
        previousDate.setHours(0, 0, 0, 0);
        
        const dayDiff = (previousDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000);
        
        if (dayDiff === 1) {
          streakDays++;
        } else {
          break;
        }
      }

      return streakDays;
    } catch (error) {
      console.error('计算连续学习天数失败:', error);
      return 0;
    }
  }

  /**
   * 计算发音改进趋势
   */
  private async calculatePronunciationImprovement(): Promise<number> {
    try {
      const dbConnection = this.storageService.getDatabaseConnection();
      
      // 获取最近30天和之前30天的发音准确率
      const recentQuery = `
        SELECT AVG(accuracy_score) as avg_accuracy
        FROM learning_records 
        WHERE activity_type = 'speaking' 
          AND accuracy_score IS NOT NULL 
          AND created_at >= datetime('now', '-30 days')
      `;
      
      const previousQuery = `
        SELECT AVG(accuracy_score) as avg_accuracy
        FROM learning_records 
        WHERE activity_type = 'speaking' 
          AND accuracy_score IS NOT NULL 
          AND created_at >= datetime('now', '-60 days')
          AND created_at < datetime('now', '-30 days')
      `;
      
      const recentResult = dbConnection.exec(recentQuery)[0] as any;
      const previousResult = dbConnection.exec(previousQuery)[0] as any;
      
      const recentAccuracy = recentResult?.avg_accuracy || 0;
      const previousAccuracy = previousResult?.avg_accuracy || 0;
      
      if (previousAccuracy === 0) {
        return 0;
      }
      
      return ((recentAccuracy - previousAccuracy) / previousAccuracy) * 100;
    } catch (error) {
      console.error('计算发音改进趋势失败:', error);
      return 0;
    }
  }

  /**
   * 根据掌握单词数计算词汇水平
   */
  private calculateVocabularyLevel(masteredWords: number): EnglishLevel {
    if (masteredWords >= 8000) return 'C2';
    if (masteredWords >= 6000) return 'C1';
    if (masteredWords >= 4000) return 'B2';
    if (masteredWords >= 2500) return 'B1';
    if (masteredWords >= 1500) return 'A2';
    return 'A1';
  }

  /**
   * 获取词汇水平对应的目标单词数
   */
  private getVocabularyTarget(level: EnglishLevel): number {
    const targets = {
      'A1': 1500,
      'A2': 2500,
      'B1': 4000,
      'B2': 6000,
      'C1': 8000,
      'C2': 10000
    };
    return targets[level];
  }

  /**
   * 根据发音准确率计算发音水平
   */
  private calculatePronunciationLevel(accuracy: number): EnglishLevel {
    if (accuracy >= 95) return 'C2';
    if (accuracy >= 90) return 'C1';
    if (accuracy >= 85) return 'B2';
    if (accuracy >= 75) return 'B1';
    if (accuracy >= 65) return 'A2';
    return 'A1';
  }

  /**
   * 根据理解准确率和阅读时间计算阅读水平
   */
  private calculateReadingLevel(comprehensionAccuracy: number, averageReadingTime: number): EnglishLevel {
    // 综合考虑理解准确率和阅读效率
    const comprehensionScore = comprehensionAccuracy;
    const efficiencyScore = Math.max(0, 100 - (averageReadingTime / 60)); // 假设理想阅读时间为60秒
    const overallScore = (comprehensionScore * 0.7) + (efficiencyScore * 0.3);
    
    if (overallScore >= 90) return 'C2';
    if (overallScore >= 80) return 'C1';
    if (overallScore >= 70) return 'B2';
    if (overallScore >= 60) return 'B1';
    if (overallScore >= 50) return 'A2';
    return 'A1';
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
   * 获取成就记录
   */
  private async getAchievements(): Promise<Array<{
    type: string;
    title: string;
    description: string;
    achievedAt: Date;
  }>> {
    // 这里可以实现成就系统的逻辑
    // 基于学习数据判断用户达成的成就
    const achievements: Array<{
      type: string;
      title: string;
      description: string;
      achievedAt: Date;
    }> = [];

    try {
      const stats = await this.getLearningStats();
      
      // 学习时间成就
      if (stats.totalStudyTime >= 3600) { // 1小时
        achievements.push({
          type: 'study_time',
          title: '学习达人',
          description: '累计学习时间超过1小时',
          achievedAt: new Date()
        });
      }

      // 词汇量成就
      if (stats.masteredWords >= 100) {
        achievements.push({
          type: 'vocabulary',
          title: '词汇小能手',
          description: '掌握单词数量超过100个',
          achievedAt: new Date()
        });
      }

      // 连续学习成就
      if (stats.streakDays >= 7) {
        achievements.push({
          type: 'streak',
          title: '坚持不懈',
          description: '连续学习7天',
          achievedAt: new Date()
        });
      }

      return achievements;
    } catch (error) {
      console.error('获取成就记录失败:', error);
      return [];
    }
  }

  /**
   * 将数据库行映射为LearningRecord对象
   */
  private mapRowToLearningRecord(row: any): LearningRecord {
    return {
      id: row.id,
      activityType: row.activity_type,
      contentId: row.content_id || undefined,
      word: row.word || undefined,
      accuracyScore: row.accuracy_score || undefined,
      timeSpent: row.time_spent,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.created_at)
    };
  }
}