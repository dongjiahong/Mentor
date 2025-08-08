import { EnglishLevel, ExamType, ActivityType } from './core';
import { LearningContent, Word, UserProfile, LearningRecord, WordDefinition } from './learning';
import { AIConfig, ContentGenerationParams, ExamGenerationParams, PronunciationEvaluationParams, SpeechOptions, RecognitionOptions, ContentQueryParams, WordQueryParams, RecordQueryParams, ExamQueryParams, StatsQueryParams } from './api';
import { PronunciationScore } from './practice';

// ============================================================================
// 服务接口定义
// ============================================================================

// AI服务接口
export interface AIService {
  generateContent(params: ContentGenerationParams): Promise<LearningContent>;
  generateExamQuestions(params: ExamGenerationParams): Promise<ExamQuestion[]>;
  evaluatePronunciation(params: PronunciationEvaluationParams): Promise<PronunciationScore>;
  validateConfig(config: AIConfig): Promise<boolean>;
}

// 语音服务接口
export interface SpeechService {
  speak(text: string, options?: SpeechOptions): Promise<void>;
  startRecognition(options?: RecognitionOptions): Promise<string>;
  stopRecognition(): void;
  pauseSpeech(): void;
  resumeSpeech(): void;
  isSupported(): boolean;
  getSupportedVoices(): SpeechSynthesisVoice[];
}

// 词典服务接口
export interface DictionaryService {
  lookupWord(word: string): Promise<WordDefinition>;
  getWordPronunciation(word: string): Promise<string>;
  searchWords(query: string, limit?: number): Promise<WordDefinition[]>;
}

// 存储服务接口
export interface StorageService {
  // 数据库初始化
  initDatabase(): Promise<void>;
  
  // 用户配置管理
  saveUserProfile(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile>;
  getUserProfile(): Promise<UserProfile | null>;
  updateUserProfile(id: number, updates: Partial<UserProfile>): Promise<UserProfile>;
  
  // AI配置管理
  saveAIConfig(config: Omit<AIConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIConfig>;
  getAIConfig(): Promise<AIConfig | null>;
  updateAIConfig(id: number, updates: Partial<AIConfig>): Promise<AIConfig>;
  
  // 学习内容管理
  saveLearningContent(content: Omit<LearningContent, 'id' | 'createdAt'>): Promise<LearningContent>;
  getLearningContent(id: number): Promise<LearningContent | null>;
  getLearningContentList(params?: ContentQueryParams): Promise<LearningContent[]>;
  
  // 单词本管理
  addWordToBook(word: Omit<Word, 'id' | 'createdAt'>): Promise<Word>;
  getWord(id: number): Promise<Word | null>;
  getWordByText(word: string): Promise<Word | null>;
  getWordsForReview(): Promise<Word[]>;
  updateWordProficiency(id: number, proficiencyLevel: number): Promise<void>;
  removeWordFromBook(id: number): Promise<void>;
  getWordsList(params?: WordQueryParams): Promise<Word[]>;
  
  // 学习记录管理
  recordLearningActivity(record: Omit<LearningRecord, 'id' | 'createdAt'>): Promise<LearningRecord>;
  getLearningRecords(params?: RecordQueryParams): Promise<LearningRecord[]>;
  getLearningStats(params?: StatsQueryParams): Promise<LearningStats>;
  
  // 考试记录管理
  saveExamRecord(record: Omit<ExamRecord, 'id' | 'createdAt'>): Promise<ExamRecord>;
  getExamRecords(params?: ExamQueryParams): Promise<ExamRecord[]>;
  getExamStats(params?: StatsQueryParams): Promise<ExamStats>;
}

// 考试记录接口
export interface ExamRecord {
  id: number;
  examType: ExamType;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  duration: number;
  details?: ExamDetails;
  createdAt: Date;
}

// 考试详情接口
export interface ExamDetails {
  questions: ExamQuestion[];
  answers: ExamAnswer[];
}

// 考试题目接口
export interface ExamQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'pronunciation' | 'translation';
  question: string;
  options?: string[];
  correctAnswer: string;
  difficulty: EnglishLevel;
  word?: string;
}

// 考试答案接口
export interface ExamAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

// 统计数据接口
export interface LearningStats {
  totalStudyTime: number;
  totalWords: number;
  masteredWords: number;
  averageAccuracy: number;
  streakDays: number;
  activitiesByType: Record<ActivityType, number>;
}

export interface ExamStats {
  totalExams: number;
  averageScore: number;
  bestScore: number;
  examsByType: Record<ExamType, number>;
  improvementTrend: number;
}