import { EnglishLevel, ActivityType, LearningModule, ContentType, WordAddReason } from './core';

// ============================================================================
// 学习内容相关类型
// ============================================================================

// 用户配置接口
export interface UserProfile {
  id: number;
  englishLevel: EnglishLevel;
  learningGoal: string;
  createdAt: Date;
  updatedAt: Date;
}

// 学习内容接口
export interface LearningContent {
  id: number;
  title?: string;
  contentType: ContentType;
  originalText: string;
  translation: string;
  difficultyLevel: EnglishLevel;
  topic?: string;
  wordCount?: number;
  estimatedReadingTime?: number;
  activityTypes?: string[];
  isAiGenerated?: boolean;
  createdAt: Date;
}

// 统一内容接口 - 支持多模块复用
export interface UniversalContent {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  level: EnglishLevel;
  category: string;
  tags: string[];
  originalText?: string;
  translation?: string;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  wordCount?: number;
  estimatedDuration: number;
  sentences?: ContentSentence[];
  conversations?: ContentDialogue[];
  writingPrompt?: WritingPrompt;
  metadata?: Record<string, unknown>;
  supportedModules: LearningModule[];
  createdAt: Date;
  updatedAt?: Date;
}

// 内容句子接口
export interface ContentSentence {
  id: string;
  text: string;
  translation: string;
  difficulty: number;
  phonetic?: string;
  audioUrl?: string;
  startTime?: number;
  endTime?: number;
  keywords?: string[];
  tips?: string;
}

// 内容对话接口
export interface ContentDialogue {
  id: string;
  speaker: 'system' | 'user' | 'character1' | 'character2';
  speakerName?: string;
  text: string;
  translation?: string;
  audioUrl?: string;
  startTime?: number;
  endTime?: number;
  expectedResponse?: string;
  hints?: string[];
}

// 写作提示信息
export interface WritingPrompt {
  prompt: string;
  wordLimit?: number;
  timeLimit?: number;
  evaluationCriteria?: string;
  sampleOutline?: string;
}

// 单词接口
export interface Word {
  id: number;
  word: string;
  definition: string;
  pronunciation?: string;
  phonetic?: string;
  partOfSpeech?: string;
  examples?: string[];
  addReason: WordAddReason;
  proficiencyLevel: number;
  reviewCount: number;
  lastReviewAt?: Date;
  nextReviewAt?: Date;
  createdAt: Date;
}

// 学习记录接口
export interface LearningRecord {
  id: number;
  activityType: ActivityType;
  contentId?: number;
  word?: string;
  accuracyScore?: number;
  timeSpent: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// 词汇项接口
export interface VocabularyItem {
  word: string;
  definition: string;
  pronunciation?: string;
  partOfSpeech: string;
  example: string;
  difficulty: number;
}

// 单词定义
export interface WordDefinition {
  word: string;
  phonetic?: string;
  pronunciation?: string;
  definitions: Definition[];
  examples?: string[];
}

// 词义定义
export interface Definition {
  partOfSpeech: string;
  meaning: string;
  example?: string;
}