// ============================================================================
// 基础类型定义
// ============================================================================

// 英语水平枚举
export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// 学习目标类型
export type LearningGoal = 
  | 'daily_conversation'    // 日常交流
  | 'business_english'      // 商务英语
  | 'academic_english'      // 学术英语
  | 'travel_english'        // 旅游英语
  | 'exam_preparation';     // 考试准备

// 内容类型 - 支持多媒体
export type ContentType = 'dialogue' | 'article' | 'audio' | 'video' | 'image' | 'mixed';

// 活动类型 - 新增写作活动
export type ActivityType = 'reading' | 'listening' | 'speaking' | 'writing' | 'translation';

// 学习模块类型 - 重构为5大模块
export type LearningModule = 
  | 'content'          // 内容管理模块
  | 'listening'        // 听力练习模块
  | 'speaking'         // 口语练习模块
  | 'reading'          // 阅读练习模块
  | 'writing';         // 写作练习模块

// 保持向后兼容的语音学习模式
export type VoiceLearningMode = 
  | 'reading'          // 纯文本阅读模式
  | 'follow_along'     // 跟读练习模式
  | 'dialogue_practice' // 对话练习模式
  | 'listening_comprehension'; // 听力理解模式

// 语音练习类型
export type VoicePracticeType = 
  | 'sentence_repeat'   // 句子跟读
  | 'word_pronunciation' // 单词发音
  | 'free_speech'       // 自由表达
  | 'dialogue_response'; // 对话回应

// 写作练习类型
export type WritingPracticeType = 
  | 'sentence_construction' // 句子构造
  | 'paragraph_writing'     // 段落写作
  | 'essay_writing'         // 文章写作
  | 'translation_writing'   // 翻译写作
  | 'creative_writing'      // 创意写作
  | 'business_writing'      // 商务写作
  | 'email_writing';        // 邮件写作

// 听力练习类型
export type ListeningPracticeType = 
  | 'comprehension'         // 听力理解
  | 'dictation'            // 听写
  | 'gap_filling'          // 填空
  | 'multiple_choice'      // 选择题
  | 'dialogue_listening';   // 对话听力

// 阅读练习类型  
export type ReadingPracticeType = 
  | 'comprehension'         // 阅读理解
  | 'vocabulary_building'   // 词汇构建
  | 'speed_reading'         // 快速阅读
  | 'detailed_reading'      // 精读
  | 'skimming_scanning';    // 略读扫读

// 考试类型
export type ExamType = 'vocabulary' | 'pronunciation' | 'comprehension';

// 单词添加原因
export type WordAddReason = 
  | 'translation_lookup'     // 翻译查询
  | 'pronunciation_error'    // 发音错误
  | 'listening_difficulty';  // 听力困难

// ============================================================================
// 数据模型接口
// ============================================================================

// 用户配置接口
export interface UserProfile {
  id: number;
  englishLevel: EnglishLevel;
  learningGoal: LearningGoal;
  createdAt: Date;
  updatedAt: Date;
}

// AI配置接口
export interface AIConfig {
  id: number;
  apiUrl: string;
  apiKey: string;
  modelName: string;
  temperature?: number;      // 生成温度参数
  maxTokens?: number;        // 最大token数
  createdAt: Date;
  updatedAt: Date;
}

// 学习内容接口
export interface LearningContent {
  id: number;
  title?: string;            // 标题
  contentType: ContentType;
  originalText: string;
  translation: string;
  difficultyLevel: EnglishLevel;
  topic?: string;
  wordCount?: number;        // 单词数量
  estimatedReadingTime?: number; // 预估阅读时间（分钟）
  activityTypes?: string[];  // 支持的练习类型（reading,listening,speaking,writing）
  isAiGenerated?: boolean;   // 是否AI生成
  createdAt: Date;
}

// 语音练习句子接口
export interface VoicePracticeSentence {
  id: string;
  text: string;
  translation: string;
  difficulty: number;        // 1-5 难度等级
  phonetic?: string;         // 音标
  tips?: string;            // 发音提示
}

// 语音练习内容接口
export interface VoicePracticeContent {
  id: string;
  title: string;
  description: string;
  level: EnglishLevel;
  category: string;
  practiceType: VoicePracticeType;
  sentences: VoicePracticeSentence[];
  estimatedDuration: number; // 预估练习时间（分钟）
}

// 对话练习场景接口
export interface DialoguePracticeScenario {
  id: string;
  title: string;
  description: string;
  level: EnglishLevel;
  category: string;
  conversations: DialogueItem[];
}

// 对话项接口
export interface DialogueItem {
  id: string;
  speaker: 'system' | 'user';
  text: string;
  translation?: string;
  expectedResponse?: string; // 期望的用户回答
  hints?: string[];          // 提示信息
}

// 语音学习会话接口
export interface VoiceLearningSession {
  id: string;
  mode: VoiceLearningMode;
  contentId: string;
  startTime: Date;
  endTime?: Date;
  attempts: VoiceAttempt[];
  totalScore?: number;
  completed: boolean;
}

// 语音尝试记录接口
export interface VoiceAttempt {
  id: string;
  sentenceId: string;
  originalText: string;
  spokenText: string;
  similarity: number;        // 相似度 0-100
  pronunciationScore?: PronunciationScore;
  timestamp: Date;
  audioBlob?: Blob;         // 录音数据
}

// 语音学习进度接口
export interface VoiceLearningProgress {
  mode: VoiceLearningMode;
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  bestScore: number;
  totalPracticeTime: number; // 总练习时间（秒）
  streakDays: number;        // 连续练习天数
  lastPracticeDate?: Date;
}

// 单词接口
export interface Word {
  id: number;
  word: string;
  definition: string;
  pronunciation?: string;
  phonetic?: string;         // 音标
  partOfSpeech?: string;     // 词性
  examples?: string[];       // 例句
  addReason: WordAddReason;
  proficiencyLevel: number;  // 0-5 熟练度等级
  reviewCount: number;
  lastReviewAt?: Date;
  nextReviewAt?: Date;
  createdAt: Date;
}

// ============================================================================
// 新5模块架构相关接口
// ============================================================================

// 统一内容接口 - 支持多模块复用
export interface UniversalContent {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  level: EnglishLevel;
  category: string;
  tags: string[];            // 内容标签
  originalText?: string;     // 原文文本
  translation?: string;      // 中文翻译
  audioUrl?: string;         // 音频URL
  videoUrl?: string;         // 视频URL
  imageUrl?: string;         // 图片URL
  wordCount?: number;        // 单词数量
  estimatedDuration: number; // 预估学习时间（分钟）
  sentences?: ContentSentence[];     // 句子列表
  conversations?: ContentDialogue[]; // 对话列表
  metadata?: Record<string, unknown>; // 扩展元数据
  supportedModules: LearningModule[]; // 支持的学习模块
  createdAt: Date;
  updatedAt?: Date;
}

// 内容句子接口
export interface ContentSentence {
  id: string;
  text: string;
  translation: string;
  difficulty: number;        // 1-5 难度等级
  phonetic?: string;         // 音标
  audioUrl?: string;         // 句子音频
  startTime?: number;        // 在音视频中的开始时间
  endTime?: number;          // 在音视频中的结束时间
  keywords?: string[];       // 关键词
  tips?: string;            // 学习提示
}

// 内容对话接口
export interface ContentDialogue {
  id: string;
  speaker: 'system' | 'user' | 'character1' | 'character2';
  speakerName?: string;      // 说话者名字
  text: string;
  translation?: string;
  audioUrl?: string;         // 对话音频
  startTime?: number;        // 开始时间
  endTime?: number;          // 结束时间
  expectedResponse?: string; // 期望的用户回答（用于口语练习）
  hints?: string[];          // 提示信息
}

// 写作练习内容接口
export interface WritingPracticeContent {
  id: string;
  title: string;
  description: string;
  level: EnglishLevel;
  category: string;
  practiceType: WritingPracticeType;
  prompt: string;            // 写作提示
  sampleAnswer?: string;     // 参考答案
  wordLimit?: number;        // 字数限制
  timeLimit?: number;        // 时间限制（分钟）
  rubric?: WritingRubric;    // 评分标准
  templates?: string[];      // 写作模板
  keywords?: string[];       // 关键词提示
  estimatedDuration: number; // 预估时间
  difficulty: number;        // 难度等级 1-5
}

// 写作评分标准接口
export interface WritingRubric {
  id: string;
  name: string;
  criteria: RubricCriterion[];
  totalPoints: number;
}

// 评分标准条目
export interface RubricCriterion {
  id: string;
  name: string;           // 评分项名称，如"语法"、"内容"、"结构"
  description: string;    // 描述
  maxPoints: number;      // 最高分
  weight: number;         // 权重
}

// 写作提交记录接口
export interface WritingSubmission {
  id: string;
  practiceId: string;     // 练习内容ID
  content: string;        // 用户提交的内容
  wordCount: number;      // 实际字数
  timeSpent: number;      // 花费时间（秒）
  score?: WritingScore;   // 评分结果
  feedback?: string;      // 反馈建议
  status: 'draft' | 'submitted' | 'graded'; // 状态
  createdAt: Date;
  updatedAt?: Date;
}

// 写作评分结果接口
export interface WritingScore {
  totalScore: number;     // 总分
  maxScore: number;       // 满分
  criteriaScores: CriterionScore[]; // 各项评分
  overallFeedback: string; // 总体反馈
  suggestions: string[];   // 改进建议
  gradedAt: Date;
}

// 单项评分结果
export interface CriterionScore {
  criterionId: string;
  score: number;
  maxScore: number;
  feedback: string;
}

// 听力练习内容接口
export interface ListeningPracticeContent {
  id: string;
  title: string;
  description: string;
  level: EnglishLevel;
  category: string;
  practiceType: ListeningPracticeType;
  audioUrl: string;        // 音频URL
  transcript?: string;     // 音频文本
  duration: number;        // 音频时长（秒）
  questions?: ListeningQuestion[]; // 听力问题
  estimatedDuration: number; // 预估练习时间
  playbackSpeed: number[];  // 支持的播放速度
  difficulty: number;       // 难度等级
}

// 听力问题接口
export interface ListeningQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];       // 选择题选项
  correctAnswer: string;
  explanation?: string;     // 答案解释
  startTime?: number;       // 相关音频开始时间
  endTime?: number;         // 相关音频结束时间
}

// 阅读练习内容接口
export interface ReadingPracticeContent {
  id: string;
  title: string;
  description: string;
  level: EnglishLevel;
  category: string;
  practiceType: ReadingPracticeType;
  text: string;            // 阅读文本
  wordCount: number;       // 字数
  questions?: ReadingQuestion[]; // 阅读理解问题
  vocabulary?: VocabularyItem[]; // 重点词汇
  estimatedDuration: number; // 预估阅读时间
  difficulty: number;       // 难度等级
}

// 阅读问题接口
export interface ReadingQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  paragraph?: number;       // 相关段落编号
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

// 学习记录接口
export interface LearningRecord {
  id: number;
  activityType: ActivityType;
  contentId?: number;
  word?: string;
  accuracyScore?: number;    // 准确度分数 0-100
  timeSpent: number;         // 花费时间（秒）
  metadata?: Record<string, unknown>; // 额外的元数据
  createdAt: Date;
}

// 考试记录接口
export interface ExamRecord {
  id: number;
  examType: ExamType;
  totalQuestions: number;
  correctAnswers: number;
  score: number;             // 分数 0-100
  duration: number;          // 考试时长（秒）
  details?: ExamDetails;     // 考试详情
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
  options?: string[];        // 选择题选项
  correctAnswer: string;
  difficulty: EnglishLevel;
  word?: string;             // 关联的单词
}

// 考试答案接口
export interface ExamAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent: number;         // 答题时间（秒）
}

// ============================================================================
// 服务层接口定义
// ============================================================================

// AI服务接口
export interface AIService {
  generateContent(params: ContentGenerationParams): Promise<LearningContent>;
  generateExamQuestions(params: ExamGenerationParams): Promise<ExamQuestion[]>;
  evaluatePronunciation(params: PronunciationEvaluationParams): Promise<PronunciationScore>;
  validateConfig(config: AIConfig): Promise<boolean>;
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

// 发音评分结果
export interface PronunciationScore {
  overallScore: number;      // 总体分数 0-100
  accuracyScore: number;     // 准确度分数
  fluencyScore: number;      // 流利度分数
  pronunciationScore: number; // 发音分数
  feedback: string;          // 反馈建议
  mistakes?: PronunciationMistake[];
}

// 发音错误详情
export interface PronunciationMistake {
  word: string;
  expected: string;
  actual: string;
  suggestion: string;
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

// 语音选项
export interface SpeechOptions {
  voice?: SpeechSynthesisVoice;
  rate?: number;             // 语速 0.1-10
  pitch?: number;            // 音调 0-2
  volume?: number;           // 音量 0-1
  lang?: string;             // 语言
}

// 识别选项
export interface RecognitionOptions {
  lang?: string;             // 识别语言
  continuous?: boolean;      // 连续识别
  interimResults?: boolean;  // 中间结果
  maxAlternatives?: number;  // 最大候选数
}

// 词典服务接口
export interface DictionaryService {
  lookupWord(word: string): Promise<WordDefinition>;
  getWordPronunciation(word: string): Promise<string>;
  searchWords(query: string, limit?: number): Promise<WordDefinition[]>;
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
  partOfSpeech: string;      // 词性
  meaning: string;           // 释义
  example?: string;          // 例句
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
  addReason?: WordAddReason;
  needReview?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface RecordQueryParams {
  activityType?: ActivityType;
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

// 统计数据接口
export interface LearningStats {
  totalStudyTime: number;    // 总学习时间（秒）
  totalWords: number;        // 总单词数
  masteredWords: number;     // 掌握的单词数
  averageAccuracy: number;   // 平均准确率
  streakDays: number;        // 连续学习天数
  activitiesByType: Record<ActivityType, number>;
}

export interface ExamStats {
  totalExams: number;
  averageScore: number;
  bestScore: number;
  examsByType: Record<ExamType, number>;
  improvementTrend: number;  // 改进趋势 -1到1
}

// ============================================================================
// 错误处理类型和枚举
// ============================================================================

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

// ============================================================================
// 组件Props接口
// ============================================================================

// 通用组件Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 内容显示组件Props
export interface ContentDisplayProps extends BaseComponentProps {
  content: LearningContent;
  showTranslation?: boolean;
  onWordClick?: (word: string) => void;
  onSentencePlay?: (sentence: string) => void;
}

// 音频控制组件Props
export interface AudioControlsProps extends BaseComponentProps {
  text: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
}

// 语音录制组件Props
export interface VoiceRecorderProps extends BaseComponentProps {
  targetText: string;
  onRecordingComplete?: (result: string, score?: PronunciationScore) => void;
  onError?: (error: AppError) => void;
}

// 单词卡片组件Props
export interface WordCardProps extends BaseComponentProps {
  word: Word;
  onProficiencyUpdate?: (wordId: number, level: number) => void;
  onRemove?: (wordId: number) => void;
  onPlay?: (word: string) => void;
}

// ============================================================================
// 工具类型和泛型
// ============================================================================

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

// 操作结果类型
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: AppError;
}

// 异步操作状态
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

// 异步状态接口
export interface AsyncState<T = unknown> {
  status: AsyncStatus;
  data?: T;
  error?: AppError;
}

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

// ============================================================================
// 常量和枚举
// ============================================================================

// 熟练度等级描述
export const PROFICIENCY_LEVELS = {
  0: '未学习',
  1: '初识',
  2: '认识',
  3: '熟悉',
  4: '掌握',
  5: '精通',
} as const;

// 英语水平描述
export const ENGLISH_LEVEL_DESCRIPTIONS = {
  A1: '入门级',
  A2: '基础级',
  B1: '中级',
  B2: '中高级',
  C1: '高级',
  C2: '精通级',
} as const;

// 学习目标描述
export const LEARNING_GOAL_DESCRIPTIONS = {
  daily_conversation: '日常交流',
  business_english: '商务英语',
  academic_english: '学术英语',
  travel_english: '旅游英语',
  exam_preparation: '考试准备',
} as const;

// 默认配置
export const DEFAULT_AI_CONFIG = {
  temperature: 0.7,
  maxTokens: 2000,
} as const;

export const DEFAULT_SPEECH_OPTIONS = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  lang: 'en-US',
} as const;

export const DEFAULT_RECOGNITION_OPTIONS = {
  lang: 'en-US',
  continuous: false,
  interimResults: true,
  maxAlternatives: 1,
} as const;

// ============================================================================
// 5模块架构相关常量
// ============================================================================

// 学习模块描述
export const LEARNING_MODULE_DESCRIPTIONS = {
  content: {
    title: '内容管理',
    description: '浏览和管理所有学习材料',
    icon: 'Archive',
    color: 'from-blue-500 to-blue-600'
  },
  listening: {
    title: '听力练习',
    description: '提升听力理解和听写能力',
    icon: 'Headphones',
    color: 'from-green-500 to-green-600'
  },
  speaking: {
    title: '口语练习',
    description: '训练发音和口语表达',
    icon: 'Mic',
    color: 'from-orange-500 to-orange-600'
  },
  reading: {
    title: '阅读练习',
    description: '提升阅读理解和词汇量',
    icon: 'BookOpen',
    color: 'from-purple-500 to-purple-600'
  },
  writing: {
    title: '写作练习',
    description: '锻炼写作技巧和表达能力',
    icon: 'PenTool',
    color: 'from-pink-500 to-pink-600'
  }
} as const;

// 写作类型描述
export const WRITING_TYPE_DESCRIPTIONS = {
  'essay': '论述文',
  'letter': '书信',
  'report': '报告',
  'story': '故事',
  'description': '描述文',
  'argument': '论证文'
};

// 写作练习类型描述
export const WRITING_PRACTICE_TYPE_DESCRIPTIONS = {
  sentence_construction: '句子构造',
  paragraph_writing: '段落写作',
  essay_writing: '文章写作',
  translation_writing: '翻译写作',
  creative_writing: '创意写作',
  business_writing: '商务写作',
  email_writing: '邮件写作'
} as const;

// 听力练习类型描述
export const LISTENING_PRACTICE_TYPE_DESCRIPTIONS = {
  comprehension: '听力理解',
  dictation: '听写练习',
  gap_filling: '听力填空',
  multiple_choice: '听力选择',
  dialogue_listening: '对话听力'
} as const;

// 阅读练习类型描述
export const READING_PRACTICE_TYPE_DESCRIPTIONS = {
  comprehension: '阅读理解',
  vocabulary_building: '词汇构建',
  speed_reading: '快速阅读',
  detailed_reading: '精读练习',
  skimming_scanning: '略读扫读'
} as const;

// 默认写作评分标准
export const DEFAULT_WRITING_RUBRIC: WritingRubric = {
  id: 'default_rubric',
  name: '通用写作评分标准',
  criteria: [
    {
      id: 'content',
      name: '内容',
      description: '思想表达是否清晰，内容是否充实',
      maxPoints: 25,
      weight: 0.3
    },
    {
      id: 'organization',
      name: '结构',
      description: '文章结构是否合理，逻辑是否清晰',
      maxPoints: 20,
      weight: 0.2
    },
    {
      id: 'grammar',
      name: '语法',
      description: '语法使用是否正确',
      maxPoints: 25,
      weight: 0.25
    },
    {
      id: 'vocabulary',
      name: '词汇',
      description: '词汇使用是否恰当、丰富',
      maxPoints: 20,
      weight: 0.15
    },
    {
      id: 'mechanics',
      name: '语言mechanics',
      description: '拼写、标点符号使用等',
      maxPoints: 10,
      weight: 0.1
    }
  ],
  totalPoints: 100
};
