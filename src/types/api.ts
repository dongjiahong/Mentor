import { EnglishLevel, LearningGoal, ContentType, ExamType, AppError } from './core';
import { LearningContent, Word } from './learning';

// ============================================================================
// API响应接口
// ============================================================================

// 通用API响应接口
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
  requestId?: string;
}

// API错误接口
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// AI API响应接口
export interface AIApiResponse {
  choices: AIChoice[];
  usage?: AIUsage;
  model: string;
  created: number;
}

export interface AIChoice {
  message: AIMessage;
  finish_reason: string;
  index: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// 有道词典API响应接口
export interface YoudaoApiResponse {
  errorCode: string;
  query: string;
  translation?: string[];
  basic?: YoudaoBasic;
  web?: YoudaoWeb[];
  l: string;
  tSpeakUrl?: string;
  speakUrl?: string;
}

export interface YoudaoBasic {
  phonetic?: string;
  'uk-phonetic'?: string;
  'us-phonetic'?: string;
  'uk-speech'?: string;
  'us-speech'?: string;
  explains: string[];
}

export interface YoudaoWeb {
  key: string;
  value: string[];
}

// AI配置接口
export interface AIConfig {
  id: number;
  apiUrl: string;
  apiKey: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 内容生成参数
export interface ContentGenerationParams {
  level: EnglishLevel;
  goal: LearningGoal;
  type: ContentType;
  topic?: string;
  wordCount?: number;
}

// 考试生成参数
export interface ExamGenerationParams {
  level: EnglishLevel;
  examType: ExamType;
  words?: Word[];
  questionCount: number;
}

// 发音评估参数
export interface PronunciationEvaluationParams {
  originalText: string;
  spokenText: string;
  word?: string;
}

// 语音选项
export interface SpeechOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}

// 识别选项
export interface RecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

// 查询参数接口
export interface ContentQueryParams {
  contentType?: ContentType;
  difficultyLevel?: EnglishLevel;
  topic?: string;
  limit?: number;
  offset?: number;
}

export interface WordQueryParams {
  proficiencyLevel?: number;
  addReason?: string;
  needReview?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface RecordQueryParams {
  activityType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ExamQueryParams {
  examType?: ExamType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface StatsQueryParams {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month';
}

// 分页结果类型
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 排序参数
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

// 过滤参数
export interface FilterParams {
  [key: string]: unknown;
}

// 查询结果类型
export type QueryResult<T> = Promise<T | null>;
export type QueryListResult<T> = Promise<T[]>;
export type QueryPaginatedResult<T> = Promise<PaginatedResult<T>>;

// 表单验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// 配置验证接口
export interface ConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}