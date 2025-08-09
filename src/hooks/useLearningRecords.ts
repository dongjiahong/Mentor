import { useState, useEffect, useCallback } from 'react';
import { 
  LearningRecord, 
  LearningStats, 
  ActivityType,
  EnglishLevel,
  AsyncState,
  AsyncStatus
} from '@/types';
import { learningRecordsClient } from '@/services/client';
import { ProficiencyAssessmentClient } from '@/services/client/ProficiencyAssessmentClient';

/**
 * 学习记录Hook
 * 为React组件提供学习记录相关的状态管理和操作方法
 */
export function useLearningRecords() {
  // 基础状态
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState<AsyncState<LearningStats>>({
    status: 'idle'
  });
  const [recentRecords, setRecentRecords] = useState<AsyncState<LearningRecord[]>>({
    status: 'idle'
  });

  // 初始化服务
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsInitialized(true);
      } catch (error) {
        console.error('初始化学习记录服务失败:', error);
      }
    };

    initializeService();
  }, []);

  // 记录阅读活动
  const recordReading = useCallback(async (params: {
    contentId?: number;
    timeSpent: number;
    wordsRead?: number;
    comprehensionScore?: number;
  }) => {
    if (!isInitialized) return null;

    try {
      const record = await learningRecordsClient.recordReading(params);
      // 记录成功后刷新统计数据
      await refreshStats();
      return record;
    } catch (error) {
      console.error('记录阅读活动失败:', error);
      return null;
    }
  }, [isInitialized]);

  // 记录听力活动
  const recordListening = useCallback(async (params: {
    contentId?: number;
    timeSpent: number;
    comprehensionScore?: number;
    playbackSpeed?: number;
  }) => {
    if (!isInitialized) return null;

    try {
      const record = await learningRecordsClient.recordListening(params);
      await refreshStats();
      return record;
    } catch (error) {
      console.error('记录听力活动失败:', error);
      return null;
    }
  }, [isInitialized]);

  // 记录口语练习活动
  const recordSpeaking = useCallback(async (params: {
    word?: string;
    timeSpent: number;
    pronunciationScore?: number;
    attempts?: number;
  }) => {
    if (!isInitialized) return null;

    try {
      const record = await learningRecordsClient.recordSpeaking(params);
      await refreshStats();
      return record;
    } catch (error) {
      console.error('记录口语活动失败:', error);
      return null;
    }
  }, [isInitialized]);

  // 记录翻译活动
  const recordTranslation = useCallback(async (params: {
    word?: string;
    timeSpent: number;
    accuracyScore?: number;
    translationType?: 'word' | 'sentence' | 'paragraph';
  }) => {
    if (!isInitialized) return null;

    try {
      const record = await learningRecordsClient.recordTranslation(params);
      await refreshStats();
      return record;
    } catch (error) {
      console.error('记录翻译活动失败:', error);
      return null;
    }
  }, [isInitialized]);

  // 记录单词查询活动
  const recordWordLookup = useCallback(async (params: {
    word: string;
    timeSpent: number;
    lookupSource?: string;
  }) => {
    if (!isInitialized) return null;

    try {
      const record = await learningRecordsClient.recordWordLookup(params);
      await refreshStats();
      return record;
    } catch (error) {
      console.error('记录单词查询失败:', error);
      return null;
    }
  }, [isInitialized]);

  // 获取学习统计数据
  const refreshStats = useCallback(async () => {
    if (!isInitialized) return;

    setStats({ status: 'loading' });
    
    try {
      const statsData = await learningRecordsClient.getLearningStats();
      setStats({ 
        status: 'success', 
        data: statsData 
      });
    } catch (error) {
      setStats({ 
        status: 'error', 
        error: error as any 
      });
    }
  }, [isInitialized]);

  // 获取最近的学习记录
  const refreshRecentRecords = useCallback(async (limit: number = 10) => {
    if (!isInitialized) return;

    setRecentRecords({ status: 'loading' });
    
    try {
      const records = await learningRecordsClient.getRecentRecords(limit);
      setRecentRecords({ 
        status: 'success', 
        data: records 
      });
    } catch (error) {
      setRecentRecords({ 
        status: 'error', 
        error: error as any 
      });
    }
  }, [isInitialized]);

  // 初始化时加载数据
  useEffect(() => {
    if (isInitialized) {
      refreshStats();
      refreshRecentRecords();
    }
  }, [isInitialized, refreshStats, refreshRecentRecords]);

  return {
    // 状态
    isInitialized,
    stats,
    recentRecords,
    
    // 记录方法
    recordReading,
    recordListening,
    recordSpeaking,
    recordTranslation,
    recordWordLookup,
    
    // 刷新方法
    refreshStats,
    refreshRecentRecords,
    
    // 服务实例（用于高级操作）
    service: learningRecordsClientService
  };
}

/**
 * 学习统计Hook
 * 专门用于获取和管理学习统计数据
 */
export function useLearningStats() {
  const [todayStats, setTodayStats] = useState<AsyncState<LearningStats>>({
    status: 'idle'
  });
  const [weeklyStats, setWeeklyStats] = useState<AsyncState<LearningStats>>({
    status: 'idle'
  });
  const [monthlyStats, setMonthlyStats] = useState<AsyncState<LearningStats>>({
    status: 'idle'
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化服务
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsInitialized(true);
      } catch (error) {
        console.error('初始化学习统计服务失败:', error);
      }
    };

    initializeService();
  }, []);

  // 获取今日统计
  const refreshTodayStats = useCallback(async () => {
    if (!isInitialized) return;

    setTodayStats({ status: 'loading' });
    
    try {
      const stats = await learningRecordsClient.getTodayStats();
      setTodayStats({ 
        status: 'success', 
        data: stats 
      });
    } catch (error) {
      setTodayStats({ 
        status: 'error', 
        error: error as any 
      });
    }
  }, [isInitialized]);

  // 获取本周统计
  const refreshWeeklyStats = useCallback(async () => {
    if (!isInitialized) return;

    setWeeklyStats({ status: 'loading' });
    
    try {
      const stats = await learningRecordsClient.getWeeklyStats();
      setWeeklyStats({ 
        status: 'success', 
        data: stats 
      });
    } catch (error) {
      setWeeklyStats({ 
        status: 'error', 
        error: error as any 
      });
    }
  }, [isInitialized]);

  // 获取本月统计
  const refreshMonthlyStats = useCallback(async () => {
    if (!isInitialized) return;

    setMonthlyStats({ status: 'loading' });
    
    try {
      const stats = await learningRecordsClient.getMonthlyStats();
      setMonthlyStats({ 
        status: 'success', 
        data: stats 
      });
    } catch (error) {
      setMonthlyStats({ 
        status: 'error', 
        error: error as any 
      });
    }
  }, [isInitialized]);

  // 刷新所有统计数据
  const refreshAllStats = useCallback(async () => {
    await Promise.all([
      refreshTodayStats(),
      refreshWeeklyStats(),
      refreshMonthlyStats()
    ]);
  }, [refreshTodayStats, refreshWeeklyStats, refreshMonthlyStats]);

  // 初始化时加载数据
  useEffect(() => {
    if (isInitialized) {
      refreshAllStats();
    }
  }, [isInitialized, refreshAllStats]);

  return {
    // 状态
    isInitialized,
    todayStats,
    weeklyStats,
    monthlyStats,
    
    // 刷新方法
    refreshTodayStats,
    refreshWeeklyStats,
    refreshMonthlyStats,
    refreshAllStats
  };
}

/**
 * 学习能力评估Hook
 * 用于获取和管理用户能力评估数据
 */
export function useLearningAbilities() {
  const [abilities, setAbilities] = useState<AsyncState<{
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
  }>>({
    status: 'idle'
  });
  
  const [levelUpgrade, setLevelUpgrade] = useState<AsyncState<{
    shouldUpgrade: boolean;
    currentLevel: EnglishLevel;
    suggestedLevel: EnglishLevel;
    reason: string;
  } | null>>({
    status: 'idle'
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化服务
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsInitialized(true);
      } catch (error) {
        console.error('初始化能力评估服务失败:', error);
      }
    };

    initializeService();
  }, []);

  // 评估用户能力
  const evaluateAbilities = useCallback(async () => {
    if (!isInitialized) return;

    setAbilities({ status: 'loading' });
    
    try {
      const assessmentResult = await ProficiencyAssessmentClient.assessUserProficiency();
      
      // 转换新的数据结构到旧的格式（保持向后兼容）
      const abilitiesData = {
        vocabularyLevel: {
          level: assessmentResult.assessment.modules.reading.currentLevel,
          score: assessmentResult.assessment.modules.reading.accuracy,
          totalWords: 1000, // 临时数据，实际应该从API获取
          masteredWords: 500 // 临时数据
        },
        pronunciationLevel: {
          level: assessmentResult.assessment.modules.speaking.currentLevel,
          score: assessmentResult.assessment.modules.speaking.accuracy,
          averageAccuracy: assessmentResult.assessment.modules.speaking.accuracy,
          recentImprovement: assessmentResult.assessment.modules.speaking.recentTrend
        },
        readingLevel: {
          level: assessmentResult.assessment.modules.reading.currentLevel,
          score: assessmentResult.assessment.modules.reading.accuracy,
          averageReadingTime: 120, // 临时数据
          comprehensionAccuracy: assessmentResult.assessment.modules.reading.accuracy
        }
      };
      
      setAbilities({ 
        status: 'success', 
        data: abilitiesData 
      });
    } catch (error) {
      console.error('评估能力失败:', error);
      // 回退到旧的API
      try {
        const abilitiesData = await learningRecordsClient.evaluateUserAbilities();
        setAbilities({ 
          status: 'success', 
          data: abilitiesData 
        });
      } catch (fallbackError) {
        setAbilities({ 
          status: 'error', 
          error: fallbackError as any 
        });
      }
    }
  }, [isInitialized]);

  // 检查水平升级
  const checkLevelUpgrade = useCallback(async () => {
    if (!isInitialized) return;

    setLevelUpgrade({ status: 'loading' });
    
    try {
      const upgradeInfo = await ProficiencyAssessmentClient.getUpgradeRecommendations();
      
      if (upgradeInfo.canUpgrade && upgradeInfo.nextLevel) {
        const upgradeData = {
          shouldUpgrade: true,
          currentLevel: upgradeInfo.currentLevel,
          suggestedLevel: upgradeInfo.nextLevel,
          reason: `您在各项技能上都有显著进步，建议从 ${upgradeInfo.currentLevel} 升级到 ${upgradeInfo.nextLevel}！当前进度: ${Math.round(upgradeInfo.progress)}%`
        };
        
        setLevelUpgrade({ 
          status: 'success', 
          data: upgradeData 
        });
      } else {
        setLevelUpgrade({ 
          status: 'success', 
          data: null 
        });
      }
    } catch (error) {
      console.error('检查升级失败:', error);
      // 回退到旧的API
      try {
        const upgradeData = await learningRecordsClient.checkLevelUpgrade();
        setLevelUpgrade({ 
          status: 'success', 
          data: upgradeData 
        });
      } catch (fallbackError) {
        setLevelUpgrade({ 
          status: 'error', 
          error: fallbackError as any 
        });
      }
    }
  }, [isInitialized]);

  // 初始化时评估能力
  useEffect(() => {
    if (isInitialized) {
      evaluateAbilities();
      checkLevelUpgrade();
    }
  }, [isInitialized, evaluateAbilities, checkLevelUpgrade]);

  return {
    // 状态
    isInitialized,
    abilities,
    levelUpgrade,
    
    // 方法
    evaluateAbilities,
    checkLevelUpgrade
  };
}

/**
 * 学习报告Hook
 * 用于生成和管理学习报告
 */
export function useLearningReport() {
  const [report, setReport] = useState<AsyncState<{
    summary: LearningStats;
    abilities: Awaited<ReturnType<typeof learningRecordsClient.evaluateUserAbilities>>;
    trends: Awaited<ReturnType<typeof learningRecordsClient.getProgressTrend>>;
    recommendations: string[];
    achievements: Array<{
      type: string;
      title: string;
      description: string;
      achievedAt: Date;
    }>;
  }>>({
    status: 'idle'
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化服务
  useEffect(() => {
    const initializeService = async () => {
      try {
        setIsInitialized(true);
      } catch (error) {
        console.error('初始化学习报告服务失败:', error);
      }
    };

    initializeService();
  }, []);

  // 生成学习报告
  const generateReport = useCallback(async (params?: {
    startDate?: Date;
    endDate?: Date;
  }) => {
    if (!isInitialized) return;

    setReport({ status: 'loading' });
    
    try {
      // 使用新的评估服务生成报告
      const assessmentResult = await ProficiencyAssessmentClient.assessUserProficiency();
      const upgradeInfo = await ProficiencyAssessmentClient.getUpgradeRecommendations();
      
      // 生成统计数据（临时使用模拟数据，实际应该从真实统计API获取）
      const summary: LearningStats = {
        totalStudyTime: 3600, // 1小时
        totalWords: 120,
        masteredWords: 80,
        averageAccuracy: assessmentResult.assessment.modules.reading.accuracy,
        streakDays: 3,
        activitiesByType: {
          reading: 10,
          listening: 8,
          speaking: 6,
          writing: 4
        }
      };

      // 转换能力数据格式
      const abilities = {
        vocabularyLevel: {
          level: assessmentResult.assessment.modules.reading.currentLevel,
          score: assessmentResult.assessment.modules.reading.accuracy,
          totalWords: 1000,
          masteredWords: 650
        },
        pronunciationLevel: {
          level: assessmentResult.assessment.modules.speaking.currentLevel,
          score: assessmentResult.assessment.modules.speaking.accuracy,
          averageAccuracy: assessmentResult.assessment.modules.speaking.accuracy,
          recentImprovement: assessmentResult.assessment.modules.speaking.recentTrend
        },
        readingLevel: {
          level: assessmentResult.assessment.modules.reading.currentLevel,
          score: assessmentResult.assessment.modules.reading.accuracy,
          averageReadingTime: 90,
          comprehensionAccuracy: assessmentResult.assessment.modules.reading.accuracy
        }
      };

      // 生成趋势数据（简化实现）
      const trends = {
        dailyStats: [],
        weeklyStats: [],
        monthlyStats: []
      };

      // 使用升级建议作为推荐
      const recommendations = upgradeInfo.recommendations;

      // 生成成就数据
      const achievements = [
        {
          type: 'level',
          title: '水平提升',
          description: `当前英语水平：${assessmentResult.assessment.overallLevel}`,
          achievedAt: new Date()
        },
        {
          type: 'accuracy',
          title: '准确率突破',
          description: `${assessmentResult.assessment.strongestModule}模块表现优异`,
          achievedAt: new Date()
        }
      ];

      const reportData = {
        summary,
        abilities,
        trends,
        recommendations,
        achievements
      };

      setReport({ 
        status: 'success', 
        data: reportData 
      });
    } catch (error) {
      console.error('生成报告失败:', error);
      // 回退到旧的API
      try {
        const reportData = await learningRecordsClient.generateLearningReport(params);
        setReport({ 
          status: 'success', 
          data: reportData 
        });
      } catch (fallbackError) {
        setReport({ 
          status: 'error', 
          error: fallbackError as any 
        });
      }
    }
  }, [isInitialized]);

  // 初始化时生成报告
  useEffect(() => {
    if (isInitialized) {
      generateReport();
    }
  }, [isInitialized, generateReport]);

  return {
    // 状态
    isInitialized,
    report,
    
    // 方法
    generateReport
  };
}