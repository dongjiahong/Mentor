import { Word, UserProfile, LearningRecord } from '@/types';

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

// AI服务实现
export { createAIService, defaultAIService } from './ai/AIService';

// 语音服务实现
export { WebSpeechService, defaultSpeechService, createSpeechService } from './speech/SpeechService';
export type { SpeechPlaybackState, SpeechPlaybackEvents } from './speech/SpeechService';

// 词典服务实现
export { FreeDictionaryService, createFreeDictionaryService } from './dictionary/DictionaryService';
export { DictionaryConfigManager, DictionaryServiceFactory } from './dictionary/DictionaryConfig';
export type { DictionaryConfig, DictionaryConfigValidation, ConfigField, DictionaryProvider } from './dictionary/DictionaryConfig';

// 数据库和存储服务实现
export { DatabaseConnection } from './database/connection';
export { StorageService } from './storage/StorageService';
export { DATABASE_SCHEMA, DATABASE_INDEXES, DATABASE_TRIGGERS } from './database/schema';
