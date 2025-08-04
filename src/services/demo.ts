/**
 * 数据库和存储服务演示
 * 这个文件展示了如何使用我们实现的数据库和存储服务
 */

import { StorageService } from './storage/StorageService';
import { Word, LearningRecord } from '@/types';

export async function demonstrateStorageService() {
  console.log('=== 英语学习助手数据库和存储服务演示 ===\n');

  // 创建存储服务实例
  const storageService = new StorageService();

  try {
    // 1. 初始化数据库
    console.log('1. 初始化数据库...');
    await storageService.initialize();
    console.log('✅ 数据库初始化成功\n');

    // 2. 保存用户配置
    console.log('2. 保存用户配置...');
    const userProfile = await storageService.saveUserProfile({
      englishLevel: 'B1',
      learningGoal: 'daily_conversation'
    });
    console.log('✅ 用户配置保存成功:', userProfile);
    console.log();

    // 3. 获取用户配置
    console.log('3. 获取用户配置...');
    const retrievedProfile = await storageService.getUserProfile();
    console.log('✅ 获取用户配置成功:', retrievedProfile);
    console.log();

    // 4. 保存AI配置
    console.log('4. 保存AI配置...');
    const aiConfig = await storageService.saveAIConfig({
      apiUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test123',
      modelName: 'gpt-3.5-turbo'
    });
    console.log('✅ AI配置保存成功:', aiConfig);
    console.log();

    // 5. 添加单词到单词本
    console.log('5. 添加单词到单词本...');
    const word1: Omit<Word, 'id' | 'createdAt'> = {
      word: 'hello',
      definition: '你好，问候语',
      pronunciation: '/həˈloʊ/',
      addReason: 'translation_lookup',
      proficiencyLevel: 0,
      reviewCount: 0
    };

    const savedWord1 = await storageService.addWordToBook(word1);
    console.log('✅ 单词添加成功:', savedWord1);

    const word2: Omit<Word, 'id' | 'createdAt'> = {
      word: 'world',
      definition: '世界',
      pronunciation: '/wɜːrld/',
      addReason: 'pronunciation_error',
      proficiencyLevel: 1,
      reviewCount: 2
    };

    const savedWord2 = await storageService.addWordToBook(word2);
    console.log('✅ 单词添加成功:', savedWord2);
    console.log();

    // 6. 获取需要复习的单词
    console.log('6. 获取需要复习的单词...');
    const wordsForReview = await storageService.getWordsForReview();
    console.log('✅ 需要复习的单词:', wordsForReview);
    console.log();

    // 7. 记录学习活动
    console.log('7. 记录学习活动...');
    const learningRecord: Omit<LearningRecord, 'id' | 'createdAt'> = {
      activityType: 'reading',
      word: 'hello',
      accuracyScore: 0.85,
      timeSpent: 300 // 5分钟
    };

    const savedRecord = await storageService.recordLearningActivity(learningRecord);
    console.log('✅ 学习活动记录成功:', savedRecord);
    console.log();

    // 8. 保存数据到持久化存储
    console.log('8. 保存数据到持久化存储...');
    storageService.save();
    console.log('✅ 数据保存成功\n');

    console.log('=== 演示完成 ===');

  } catch (error) {
    console.error('❌ 演示过程中发生错误:', error);
  } finally {
    // 关闭数据库连接
    storageService.close();
    console.log('🔒 数据库连接已关闭');
  }
}

// 如果直接运行此文件，则执行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateStorageService().catch(console.error);
}