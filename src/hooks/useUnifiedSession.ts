import { useCallback } from 'react';
import { LearningRecordsClient } from '@/services/client/learning-records/LearningRecordsClient';
import { ActivityType, LearningModule, UniversalContent } from '@/types';

export interface SessionData {
  activityType: ActivityType;
  contentId: number | string;
  accuracyScore: number;
  timeSpent: number; // 毫秒
  metadata?: Record<string, unknown>;
}

/**
 * 统一的学习会话管理Hook
 * 提供统一的数据记录和状态管理功能
 */
export function useUnifiedSession() {
  const learningRecordsClient = new LearningRecordsClient();

  /**
   * 记录学习活动
   */
  const recordLearningActivity = useCallback(async (
    module: LearningModule,
    content: UniversalContent | any,
    stats: any
  ): Promise<void> => {
    try {
      // 将模块名称转换为活动类型
      const activityType = module.replace('_practice', '') as ActivityType;
      
      // 准备记录数据
      const recordData = {
        activityType,
        contentId: typeof content.id === 'string' ? parseInt(content.id) : content.id,
        accuracyScore: stats.accuracyScore || 0,
        timeSpent: Math.round((stats.timeSpent || 0) / 1000), // 转换为秒
        metadata: {
          ...extractModuleSpecificMetadata(module, stats),
          contentTitle: content.title,
          contentLevel: content.level
        }
      };

      await learningRecordsClient.recordActivity(recordData);
      console.log(`${module} 学习记录已保存:`, recordData);
    } catch (error) {
      console.error(`记录 ${module} 学习数据失败:`, error);
      throw error;
    }
  }, [learningRecordsClient]);

  /**
   * 提取模块特定的元数据
   */
  const extractModuleSpecificMetadata = useCallback((
    module: LearningModule,
    stats: any
  ): Record<string, unknown> => {
    switch (module) {
      case 'listening_practice':
        return {
          totalSentences: stats.totalSentences,
          answeredSentences: stats.answeredSentences,
          correctSentences: stats.correctSentences,
          completionRate: stats.completionRate,
          averageSimilarity: stats.averageSimilarity
        };

      case 'reading_practice':
        return {
          totalQuestions: stats.totalQuestions,
          answeredQuestions: stats.answeredQuestions,
          correctAnswers: stats.correctAnswers,
          readingTime: stats.readingTime,
          readingSpeed: stats.readingSpeed,
          highlightedWordsCount: stats.highlightedWordsCount,
          showedTranslation: stats.showedTranslation
        };

      case 'speaking_practice':
        return {
          totalItems: stats.totalItems,
          completedItems: stats.completedItems,
          totalAttempts: stats.totalAttempts,
          averageAttemptsPerItem: stats.averageAttemptsPerItem,
          pronunciationScores: stats.pronunciationScores,
          mode: stats.mode
        };

      case 'writing_practice':
        return {
          wordCount: stats.wordCount,
          status: stats.status,
          scores: stats.scores,
          practiceType: stats.practiceType
        };

      default:
        return {};
    }
  }, []);

  /**
   * 创建统一的完成处理函数
   */
  const createCompletionHandler = useCallback((
    module: LearningModule,
    content: UniversalContent | any,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ) => {
    return async (stats?: any) => {
      try {
        if (stats) {
          await recordLearningActivity(module, content, stats);
        }
        
        onSuccess?.();
      } catch (error) {
        console.error(`处理 ${module} 完成失败:`, error);
        onError?.(error instanceof Error ? error : new Error('未知错误'));
        // 即使记录失败，也继续执行后续逻辑
        onSuccess?.();
      }
    };
  }, [recordLearningActivity]);

  /**
   * 标准化统计数据格式
   */
  const normalizeStats = useCallback((
    module: LearningModule,
    rawStats: any
  ): any => {
    const baseStats = {
      accuracyScore: rawStats.accuracyScore || 0,
      timeSpent: rawStats.timeSpent || 0
    };

    switch (module) {
      case 'listening_practice':
        return {
          ...baseStats,
          totalSentences: rawStats.totalSentences || 0,
          answeredSentences: rawStats.answeredSentences || 0,
          correctSentences: rawStats.correctSentences || 0,
          completionRate: rawStats.completionRate || 0,
          averageSimilarity: rawStats.averageSimilarity || 0
        };

      case 'reading_practice':
        return {
          ...baseStats,
          totalQuestions: rawStats.totalQuestions || 0,
          answeredQuestions: rawStats.answeredQuestions || 0,
          correctAnswers: rawStats.correctAnswers || 0,
          readingTime: rawStats.readingTime || 0,
          readingSpeed: rawStats.readingSpeed || 0,
          highlightedWordsCount: rawStats.highlightedWordsCount || 0,
          showedTranslation: rawStats.showedTranslation || false
        };

      case 'speaking_practice':
        return {
          ...baseStats,
          totalItems: rawStats.totalItems || 0,
          completedItems: rawStats.completedItems || 0,
          totalAttempts: rawStats.totalAttempts || 0,
          averageAttemptsPerItem: rawStats.averageAttemptsPerItem || 0,
          pronunciationScores: rawStats.pronunciationScores || [],
          mode: rawStats.mode || 'sentence'
        };

      case 'writing_practice':
        return {
          ...baseStats,
          wordCount: rawStats.wordCount || 0,
          status: rawStats.status || 'draft',
          scores: rawStats.scores || null,
          practiceType: rawStats.practiceType
        };

      default:
        return baseStats;
    }
  }, []);

  /**
   * 验证统计数据的完整性
   */
  const validateStats = useCallback((
    module: LearningModule,
    stats: any
  ): boolean => {
    if (!stats) return false;
    
    // 基本验证
    if (typeof stats.timeSpent !== 'number' || stats.timeSpent < 0) {
      return false;
    }

    // 模块特定验证
    switch (module) {
      case 'listening_practice':
        return typeof stats.totalSentences === 'number' && stats.totalSentences >= 0;
        
      case 'reading_practice':
        return typeof stats.readingTime === 'number' && stats.readingTime >= 0;
        
      case 'speaking_practice':
        return typeof stats.totalItems === 'number' && stats.totalItems >= 0;
        
      case 'writing_practice':
        return typeof stats.wordCount === 'number' && stats.wordCount >= 0;
        
      default:
        return true;
    }
  }, []);

  return {
    recordLearningActivity,
    createCompletionHandler,
    normalizeStats,
    validateStats,
    extractModuleSpecificMetadata
  };
}