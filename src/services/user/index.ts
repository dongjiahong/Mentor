/**
 * 用户相关服务模块导出
 */

// 单词本服务
export { WordbookService } from './wordbook/WordbookService';
export { 
  MemoryAlgorithm,
  type MemoryInterval,
  type ReviewResult,
  type MemoryState
} from './wordbook/MemoryAlgorithm';

// 学习记录服务
export { LearningRecordsService } from './learning-records/LearningRecordsService';
export { LearningRecordsClientService, learningRecordsClientService } from './learning-records/LearningRecordsClientService';