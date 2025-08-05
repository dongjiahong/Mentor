/**
 * 单词本服务模块导出
 */

export { WordbookService } from './WordbookService';
export { 
  MemoryAlgorithm,
  type MemoryInterval,
  type ReviewResult,
  type MemoryState
} from './MemoryAlgorithm';

// 重新导出相关类型
export type {
  Word,
  WordAddReason,
  WordQueryParams
} from '@/types';