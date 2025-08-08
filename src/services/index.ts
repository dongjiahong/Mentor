/**
 * 服务层统一导出
 * 重构后的模块化服务架构
 */

import { Word, UserProfile, LearningRecord } from '@/types';

// ==================== 服务接口定义 ====================

// 考试题目接口
export interface ExamQuestion {
  id: string;
  type: 'vocabulary' | 'pronunciation' | 'comprehension';
  question: string;
  options?: string[];
  correctAnswer: string;
}

// 单词定义接口
export interface WordDefinition {
  word: string;
  definition: string;
  pronunciation?: string;
  examples?: string[];
}

// 语音选项接口
export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}

// 语音服务接口
export interface SpeechService {
  speak(text: string, options?: SpeechOptions): Promise<void>;
  startRecognition(): Promise<string>;
  stopRecognition(): void;
  isSupported(): boolean;
}

// 词典服务接口
export interface DictionaryService {
  lookupWord(word: string): Promise<WordDefinition>;
  getWordPronunciation(word: string): Promise<string>;
}

// 存储服务接口
export interface IStorageService {
  initialize(): Promise<void>;
  saveUserProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile>;
  getUserProfile(): Promise<UserProfile | null>;
  addWordToBook(word: Omit<Word, 'id' | 'createdAt'>): Promise<Word>;
  getWordsForReview(): Promise<Word[]>;
  recordLearningActivity(record: Omit<LearningRecord, 'id' | 'createdAt'>): Promise<LearningRecord>;
  save(): void;
  close(): void;
}

// ==================== 服务基础架构 ====================

// 服务基类和注册表
export * from './base';

// ==================== 核心服务 ====================

// 注意：核心服务仅用于服务器端，不应被客户端代码导入
// export * from './core'; // 已移除以防止客户端意外导入服务器端模块

// ==================== AI服务 ====================

// AI相关服务
export * from './ai';

// ==================== 语言服务 ====================

// 词典、语音、发音服务
export * from './language';

// ==================== 内容服务 ====================

// 学习内容管理
export * from './content';

// ==================== 练习服务 ====================

// 各种练习模式服务
export * from './practice';

// ==================== 用户服务 ====================

// 用户相关数据和记录服务
export * from './user';
