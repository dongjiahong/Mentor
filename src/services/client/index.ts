/**
 * 客户端服务统一导出
 * 所有客户端服务都通过 API 与服务端通信，不直接访问数据库
 */

// 基础服务
export { ApiClient, apiClient } from './base';
export type { ApiResponse, ApiError } from './base';

// 学习记录服务
export { LearningRecordsClient, learningRecordsClient } from './learning-records';

// 单词本服务
export { WordbookClient, wordbookClient } from './wordbook';

// 设置服务
export { SettingsClient, settingsClient } from './settings';

// 内容服务
export { ContentClient, contentClient } from './content';