/**
 * 语言能力评估系统类型定义
 * 基于4个学习模块的准确率数据进行A1-C2水平评估
 */

export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// 4个核心学习模块
export type LearningModule = 'reading' | 'listening' | 'speaking' | 'writing';

// 能力评估数据结构
export interface ModuleAssessment {
  module: LearningModule;
  currentLevel: EnglishLevel;
  accuracy: number; // 准确率百分比
  totalAttempts: number;
  correctAttempts: number;
  recentTrend: number; // 最近趋势变化百分比
  nextLevelRequirement: {
    targetAccuracy: number;
    minimumAttempts: number;
    currentProgress: number; // 0-100
  };
}

// 综合语言能力评估
export interface ProficiencyAssessment {
  overallLevel: EnglishLevel;
  modules: {
    reading: ModuleAssessment;
    listening: ModuleAssessment;
    speaking: ModuleAssessment;
    writing: ModuleAssessment;
  };
  levelUpgrade: {
    canUpgrade: boolean;
    nextLevel: EnglishLevel | null;
    requirements: LevelRequirement[];
    overallProgress: number; // 0-100
  };
  weakestModule: LearningModule;
  strongestModule: LearningModule;
}

// 水平升级要求
export interface LevelRequirement {
  module: LearningModule;
  currentAccuracy: number;
  requiredAccuracy: number;
  minimumAttempts: number;
  currentAttempts: number;
  met: boolean;
  description: string;
}

// 每个水平的准确率要求标准
export const LEVEL_REQUIREMENTS: Record<EnglishLevel, Record<LearningModule, { accuracy: number; minAttempts: number }>> = {
  A1: {
    reading: { accuracy: 60, minAttempts: 10 },
    listening: { accuracy: 55, minAttempts: 10 },
    speaking: { accuracy: 50, minAttempts: 5 },
    writing: { accuracy: 45, minAttempts: 5 }
  },
  A2: {
    reading: { accuracy: 70, minAttempts: 15 },
    listening: { accuracy: 65, minAttempts: 15 },
    speaking: { accuracy: 60, minAttempts: 10 },
    writing: { accuracy: 55, minAttempts: 8 }
  },
  B1: {
    reading: { accuracy: 75, minAttempts: 20 },
    listening: { accuracy: 70, minAttempts: 20 },
    speaking: { accuracy: 65, minAttempts: 15 },
    writing: { accuracy: 60, minAttempts: 12 }
  },
  B2: {
    reading: { accuracy: 80, minAttempts: 25 },
    listening: { accuracy: 75, minAttempts: 25 },
    speaking: { accuracy: 70, minAttempts: 20 },
    writing: { accuracy: 65, minAttempts: 15 }
  },
  C1: {
    reading: { accuracy: 85, minAttempts: 30 },
    listening: { accuracy: 80, minAttempts: 30 },
    speaking: { accuracy: 75, minAttempts: 25 },
    writing: { accuracy: 70, minAttempts: 20 }
  },
  C2: {
    reading: { accuracy: 90, minAttempts: 35 },
    listening: { accuracy: 85, minAttempts: 35 },
    speaking: { accuracy: 80, minAttempts: 30 },
    writing: { accuracy: 75, minAttempts: 25 }
  }
};

// 水平升级路径
export const LEVEL_PROGRESSION: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// 学习记录增强类型（用于准确率追踪）
export interface EnhancedLearningRecord {
  id: number;
  module: LearningModule;
  contentId?: number;
  word?: string;
  question?: string;
  userAnswer?: string;
  correctAnswer?: string;
  isCorrect: boolean;
  accuracyScore: number; // 0-100
  timeSpent: number;
  difficultyLevel?: EnglishLevel;
  metadata?: {
    questionType?: string;
    skillArea?: string;
    contentSource?: string;
  };
  createdAt: Date;
}

// 水平评估统计数据
export interface LevelStats {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageTime: number;
  lastAttemptDate?: Date;
  trend: {
    last7Days: number;
    last30Days: number;
    overall: number;
  };
}