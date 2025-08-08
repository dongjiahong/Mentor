// ============================================================================
// 数据库操作类型定义
// ============================================================================

import Database from 'better-sqlite3';

// 数据库连接类型
export type DatabaseConnection = Database.Database;

// 通用数据库记录接口
export interface DatabaseRecord {
  id: number;
  created_at: string;
  updated_at?: string;
}

// 学习记录数据库表结构
export interface LearningRecordRow extends DatabaseRecord {
  activity_type: string;
  content_id?: number;
  word?: string;
  accuracy_score?: number;
  time_spent: number;
}

// 单词本数据库表结构
export interface WordbookRow extends DatabaseRecord {
  word: string;
  pronunciation?: string;
  definition?: string;
  translation?: string;
  add_reason?: string;
  proficiency_level: number;
  next_review_date?: string;
  review_count: number;
  correct_count: number;
  source_content_id?: number;
  difficulty_level?: string;
}

// AI配置数据库表结构
export interface AIConfigRow extends DatabaseRecord {
  api_url: string;
  api_key: string;
  model_name: string;
  temperature?: number;
  max_tokens?: number;
}

// 学习内容数据库表结构
export interface LearningContentRow extends DatabaseRecord {
  content: string;
  content_type: string;
  difficulty_level: string;
  title: string;
  activity_types: string;
  is_ai_generated: boolean;
}

// 用户配置数据库表结构
export interface UserProfileRow extends DatabaseRecord {
  english_level: string;
  learning_goal: string;
}

// 数据库查询参数类型
export interface QueryParams {
  [key: string]: string | number | boolean | null | undefined;
}

// 数据库操作结果类型
export interface QueryResult {
  changes?: number;
  lastInsertRowid?: number | bigint;
}

// 统计查询结果类型
export interface StatsQueryResult {
  total_time?: number;
  total_words?: number;
  mastered_words?: number;
  avg_accuracy?: number;
  activity_type?: string;
  count?: number;
}

// 单词统计查询结果
export interface WordStatsResult {
  total_words?: number;
  mastered_words?: number;
  avg_proficiency?: number;
}

// 活动统计查询结果
export interface ActivityStatsResult {
  activity_type: string;
  count: number;
}