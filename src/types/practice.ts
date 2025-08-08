import { EnglishLevel } from './core';

// ============================================================================
// 练习相关类型定义
// ============================================================================

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

// 听力练习答题记录
export interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  timeSpent: number;
}

// 语音学习模式
export type VoiceLearningMode = 
  | 'reading'          // 纯文本阅读模式
  | 'follow_along'     // 跟读练习模式
  | 'dialogue_practice' // 对话练习模式
  | 'listening_comprehension'; // 听力理解模式

// 语音练习句子接口
export interface VoicePracticeSentence {
  id: string;
  text: string;
  translation: string;
  difficulty: number;
  phonetic?: string;
  tips?: string;
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
  estimatedDuration: number;
}

// 写作练习内容接口
export interface WritingPracticeContent {
  id: string;
  title: string;
  description: string;
  level: EnglishLevel;
  category: string;
  practiceType: WritingPracticeType;
  prompt: string;
  sampleAnswer?: string;
  wordLimit?: number;
  timeLimit?: number;
  rubric?: WritingRubric;
  templates?: string[];
  keywords?: string[];
  estimatedDuration: number;
  difficulty: number;
  evaluationCriteria?: string;
  sampleOutline?: string;
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
  name: string;
  description: string;
  maxPoints: number;
  weight: number;
}

// 写作提交记录接口
export interface WritingSubmission {
  id: string;
  practiceId: string;
  content: string;
  wordCount: number;
  timeSpent: number;
  score?: WritingScore;
  feedback?: string;
  status: 'draft' | 'submitted' | 'graded';
  createdAt: Date;
  updatedAt?: Date;
}

// 写作评分结果接口
export interface WritingScore {
  totalScore: number;
  maxScore: number;
  criteriaScores: CriterionScore[];
  overallFeedback: string;
  suggestions: string[];
  gradedAt: Date;
}

// 单项评分结果
export interface CriterionScore {
  criterionId: string;
  score: number;
  maxScore: number;
  feedback: string;
}

// 听力句子接口
export interface ListeningSentence {
  id: string;
  text: string;
  translation?: string;  // 中文翻译
  startTime?: number;
  endTime?: number;
  isRevealed: boolean;
  userInput?: string;
  similarity?: number;
  hasBeenPlayed: boolean;
}

// 听力练习内容接口
export interface ListeningPracticeContent {
  id: string;
  title: string;
  description: string;
  level: EnglishLevel;
  category: string;
  practiceType: ListeningPracticeType;
  audioUrl: string;
  transcript?: string;
  sentences?: ListeningSentence[];
  duration: number;
  questions?: ListeningQuestion[];
  estimatedDuration: number;
  playbackSpeed: number[];
  difficulty: number;
}

// 听力问题接口
export interface ListeningQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  startTime?: number;
  endTime?: number;
}

// 阅读练习内容接口
export interface ReadingPracticeContent {
  id: string;
  title: string;
  description: string;
  level: EnglishLevel;
  category: string;
  practiceType: ReadingPracticeType;
  text: string;
  wordCount: number;
  questions?: ReadingQuestion[];
  vocabulary?: PracticeVocabularyItem[];
  estimatedDuration: number;
  difficulty: number;
}

// 阅读问题接口
export interface ReadingQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  paragraph?: number;
}

// 练习词汇项接口（为了避免与learning.ts中的VocabularyItem冲突）
export interface PracticeVocabularyItem {
  word: string;
  definition: string;
  pronunciation?: string;
  partOfSpeech: string;
  example: string;
  difficulty: number;
}

// 发音评分结果
export interface PronunciationScore {
  overallScore: number;
  accuracyScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  feedback: string;
  mistakes?: PronunciationMistake[];
}

// 发音错误详情
export interface PronunciationMistake {
  word: string;
  expected: string;
  actual: string;
  suggestion: string;
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
  similarity: number;
  pronunciationScore?: PronunciationScore;
  timestamp: Date;
  audioBlob?: Blob;
}

// 语音学习进度接口
export interface VoiceLearningProgress {
  mode: VoiceLearningMode;
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  bestScore: number;
  totalPracticeTime: number;
  streakDays: number;
  lastPracticeDate?: Date;
}