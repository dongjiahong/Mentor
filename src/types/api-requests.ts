// ============================================================================
// API 请求参数类型定义
// ============================================================================

// 学习记录相关请求类型
export interface RecordActivityRequest {
  action: 'record_activity';
  data: {
    activityType: string;
    contentId?: number;
    word?: string;
    accuracyScore?: number;
    timeSpent: number;
  };
}

export interface RecordWordLookupRequest {
  action: 'record_word_lookup';
  data: {
    word: string;
    lookupType: string;
  };
}

export interface GetStatsRequest {
  action: 'get_stats';
  data?: {
    startDate?: string;
    endDate?: string;
  };
}

export interface GetRecordsRequest {
  action: 'get_records';
  data?: {
    limit?: number;
    offset?: number;
    activityType?: string;
  };
}

export interface GetProgressTrendRequest {
  action: 'get_progress_trend';
  data?: {
    startDate?: string;
    endDate?: string;
    days?: number;
  };
}

export interface GenerateReportRequest {
  action: 'generate_report';
  data?: {
    startDate?: string;
    endDate?: string;
  };
}

export interface EvaluateAbilitiesRequest {
  action: 'evaluate_abilities';
}

export interface CheckLevelUpgradeRequest {
  action: 'check_level_upgrade';
}

export interface GetAchievementsRequest {
  action: 'get_achievements';
  data?: Record<string, unknown>;
}

export interface GetRecommendationsRequest {
  action: 'get_recommendations';
  data?: Record<string, unknown>;
}

// 学习记录 API 请求联合类型
export type LearningRecordsRequest = 
  | RecordActivityRequest 
  | RecordWordLookupRequest
  | GetStatsRequest
  | GetRecordsRequest
  | GetProgressTrendRequest
  | GenerateReportRequest
  | EvaluateAbilitiesRequest
  | CheckLevelUpgradeRequest
  | GetAchievementsRequest
  | GetRecommendationsRequest;

// 单词本相关请求类型
export interface AddWordRequest {
  action: 'add_word';
  data: {
    word: string;
    pronunciation?: string;
    definition?: string;
    translation?: string;
    addReason?: string;
    proficiencyLevel?: number;
    sourceContentId?: number;
    difficultyLevel?: string;
  };
}

export interface GetWordsRequest {
  action: 'get_words';
  data?: {
    limit?: number;
    offset?: number;
    proficiencyLevel?: number;
    addReason?: string;
    search?: string;
  };
}

export interface UpdateWordRequest {
  action: 'update_word';
  data: {
    id: number;
    proficiencyLevel?: number;
    nextReviewDate?: string;
    reviewCount?: number;
    correctCount?: number;
  };
}

export interface RemoveWordRequest {
  action: 'remove_word';
  data: {
    id: number;
  };
}

export interface GetWordsForReviewRequest {
  action: 'get_words_for_review';
  data?: {
    limit?: number;
  };
}

// 单词本 API 请求联合类型
export type WordbookRequest = 
  | AddWordRequest
  | GetWordsRequest
  | UpdateWordRequest
  | RemoveWordRequest
  | GetWordsForReviewRequest;