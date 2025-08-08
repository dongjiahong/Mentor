// ============================================================================
// 核心基础类型定义
// ============================================================================

// 英语水平枚举
export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// 学习目标类型
export type LearningGoal = 
  | 'daily_conversation'    // 日常交流
  | 'business_english'      // 商务英语
  | 'workplace_english'     // 职场英语
  | 'written_documents'     // 书面文档
  | 'correspondence'        // 书信沟通
  | 'academic_english'      // 学术英语
  | 'travel_english'        // 旅游英语
  | 'exam_preparation'      // 考试准备
  | string;                 // 支持自定义输入

// 内容类型 - 支持多媒体
export type ContentType = 'dialogue' | 'article' | 'audio' | 'video' | 'image' | 'mixed';

// 活动类型
export type ActivityType = 'reading' | 'listening' | 'speaking' | 'writing' | 'translation';

// 学习模块类型 - 5大模块
export type LearningModule = 
  | 'content'          // 内容管理模块
  | 'listening'        // 听力练习模块
  | 'speaking'         // 口语练习模块
  | 'reading'          // 阅读练习模块
  | 'writing';         // 写作练习模块

// 考试类型
export type ExamType = 'vocabulary' | 'pronunciation' | 'comprehension';

// 单词添加原因
export type WordAddReason = 
  | 'translation_lookup'     // 翻译查询
  | 'pronunciation_error'    // 发音错误
  | 'listening_difficulty';  // 听力困难

// 异步操作状态
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

// 操作结果类型
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: AppError;
}

// 异步状态接口
export interface AsyncState<T = unknown> {
  status: AsyncStatus;
  data?: T;
  error?: AppError;
}

// 错误类型定义
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  SPEECH_NOT_SUPPORTED = 'SPEECH_NOT_SUPPORTED',
  MICROPHONE_PERMISSION_DENIED = 'MICROPHONE_PERMISSION_DENIED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_CONFIG = 'INVALID_CONFIG',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly details?: unknown;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;

  constructor(info: { type: ErrorType; message: string; details?: unknown; recoverable?: boolean }) {
    super(info.message);
    this.name = 'AppError';
    this.type = info.type;
    this.details = info.details;
    this.timestamp = new Date();
    this.recoverable = info.recoverable ?? false;
  }
}

// 数据库错误类型
export enum DatabaseErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  QUERY_FAILED = 'QUERY_FAILED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  SCHEMA_ERROR = 'SCHEMA_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
}

export interface DatabaseErrorInfo {
  type: DatabaseErrorType;
  message: string;
  details?: unknown;
}

export class DatabaseError extends Error {
  public readonly type: DatabaseErrorType;
  public readonly details?: unknown;

  constructor(info: DatabaseErrorInfo) {
    super(info.message);
    this.name = 'DatabaseError';
    this.type = info.type;
    this.details = info.details;
  }
}