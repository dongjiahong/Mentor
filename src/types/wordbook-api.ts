// ============================================================================
// 单词本 API 类型定义
// ============================================================================

// 基础单词数据接口
export interface WordData {
  word: string;
  pronunciation?: string;
  definition?: string;
  translation?: string;
  addReason?: string;
  proficiencyLevel?: number;
  sourceContentId?: number;
  difficultyLevel?: string;
  context?: string;
}

// 添加单词请求数据
export interface AddWordData extends WordData {
  word: string;
  addReason: string;
}

// 更新熟练度请求数据
export interface UpdateProficiencyData {
  wordId: number;
  newProficiency: number;
  reviewResult?: boolean;
}

// 删除单词请求数据
export interface RemoveWordData {
  wordId: number;
}

// 处理复习请求数据
export interface ProcessReviewData {
  wordId: number;
  isCorrect: boolean;
  timeSpent?: number;
  reviewType?: string;
}

// 批量更新请求数据
export interface BatchUpdateData {
  wordIds: number[];
  action: 'update_proficiency' | 'remove' | 'reset_progress';
  proficiencyLevel?: number;
}

// 导出请求数据
export interface ExportData {
  format?: 'json' | 'csv';
  filters?: {
    proficiencyLevel?: number;
    addReason?: string;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

// 导入请求数据
export interface ImportData {
  words: WordData[];
  overwrite?: boolean;
}

// 获取详情请求数据
export interface GetDetailsData {
  id: number;
}

// 搜索建议请求数据
export interface SearchSuggestionsData {
  query: string;
  limit?: number;
}

// 更新定义请求数据
export interface UpdateDefinitionData {
  wordId: number;
  definition: string;
}

// 更新发音请求数据
export interface UpdatePronunciationData {
  wordId: number;
  pronunciation: string;
}

// 单词本统计数据
export interface WordbookStats {
  totalWords: number;
  masteredWords: number;
  needReviewWords: number;
  todayLearned: number;
  averageProficiency: number;
  proficiencyDistribution: Record<number, number>;
}

// 单词推荐数据
export interface WordRecommendation {
  word: string;
  reason: string;
  difficulty: string;
  frequency: number;
}

// 单词详情数据
export interface WordDetails {
  id: number;
  word: string;
  pronunciation?: string;
  definition?: string;
  translation?: string;
  addReason?: string;
  proficiencyLevel: number;
  reviewCount: number;
  correctCount: number;
  nextReviewDate?: string;
  createdAt: string;
  lastReviewedAt?: string;
  sourceContentId?: number;
  difficultyLevel?: string;
  context?: string;
}

// API 请求体类型定义
export interface WordbookActionRequest {
  action: 
    | 'add_word' 
    | 'get_stats' 
    | 'update_proficiency' 
    | 'remove_word' 
    | 'process_review' 
    | 'get_recommendations' 
    | 'batch_update' 
    | 'export' 
    | 'import' 
    | 'get_details' 
    | 'search_suggestions' 
    | 'update_definition' 
    | 'update_pronunciation';
  data?: unknown;
}