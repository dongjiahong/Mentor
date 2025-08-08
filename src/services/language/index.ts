/**
 * 语言服务模块导出
 */

// 词典服务
export { FreeDictionaryService, createFreeDictionaryService } from './dictionary/DictionaryService';
export { DictionaryConfigManager, DictionaryServiceFactory } from './dictionary/DictionaryConfig';
export type { 
  DictionaryConfig, 
  DictionaryConfigValidation, 
  ConfigField, 
  DictionaryProvider 
} from './dictionary/DictionaryConfig';

// 语音服务
export { WebSpeechService, defaultSpeechService, createSpeechService } from './speech/SpeechService';
export type { SpeechPlaybackState, SpeechPlaybackEvents } from './speech/SpeechService';

// 发音服务
export { PronunciationEvaluator } from './pronunciation/PronunciationEvaluator';