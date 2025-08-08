/**
 * 词典服务模块导出
 */

export { FreeDictionaryService, createFreeDictionaryService } from './DictionaryService';
export { DictionaryConfigManager, DictionaryServiceFactory } from './DictionaryConfig';
export type { 
  DictionaryConfig, 
  DictionaryConfigValidation, 
  ConfigField, 
  DictionaryProvider 
} from './DictionaryConfig';