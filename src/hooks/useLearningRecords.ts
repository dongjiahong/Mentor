import { useState, useEffect, useCallback } from 'react';
import { 
  LearningRecord, 
  LearningStats, 
  ActivityType,
  EnglishLevel,
  AsyncState,
  AsyncStatus
} from '@/types';
import { learningRecordsClientService } from '@/services/learning-records/LearningRecordsClientService';

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
        await learningRecordsClientService.initialize();
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
      const record = await learningRecordsClientService.recordReading(params);
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
      const record = await learningRecordsClientService.recordListening(params);
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
      const record = await learningRecordsClientService.recordSpeaking(params);
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
      const record = await learningRecordsClientService.recordTranslation(params);
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
      const record = await learningRecordsClientService.recordWordLookup(params);
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
      const statsData = await learningRecordsClientService.getLearningStats();
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
      const records = await learningRecordsClientService.getRecentRecords(limit);
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
        await learningRecordsClientService.initialize();
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
      const stats = await learningRecordsClientService.getTodayStats();
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
      const stats = await learningRecordsClientService.getWeeklyStats();
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
      const stats = await learningRecordsClientService.getMonthlyStats();
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
        await learningRecordsClientService.initialize();
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
      const abilitiesData = await learningRecordsClientService.evaluateUserAbilities();
      setAbilities({ 
        status: 'success', 
        data: abilitiesData 
      });
    } catch (error) {
      setAbilities({ 
        status: 'error', 
        error: error as any 
      });
    }
  }, [isInitialized]);

  // 检查水平升级
  const checkLevelUpgrade = useCallback(async () => {
    if (!isInitialized) return;

    setLevelUpgrade({ status: 'loading' });
    
    try {
      const upgradeData = await learningRecordsClientService.checkLevelUpgrade();
      setLevelUpgrade({ 
        status: 'success', 
        data: upgradeData 
      });
    } catch (error) {
      setLevelUpgrade({ 
        status: 'error', 
        error: error as any 
      });
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
    abilities: Awaited<ReturnType<typeof learningRecordsClientService.evaluateUserAbilities>>;
    trends: Awaited<ReturnType<typeof learningRecordsClientService.getProgressTrend>>;
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
        await learningRecordsClientService.initialize();
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
      const reportData = await learningRecordsClientService.generateLearningReport(params);
      setReport({ 
        status: 'success', 
        data: reportData 
      });
    } catch (error) {
      setReport({ 
        status: 'error', 
        error: error as any 
      });
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