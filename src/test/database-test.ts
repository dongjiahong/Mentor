// import { DatabaseConnection } from '../services/database/connection'; // 已迁移到服务端
import { StorageService } from '../services/storage/StorageService';

// 测试数据库初始化和基本操作
async function testDatabase() {
  console.log('开始测试数据库...');
  
  try {
    // 测试数据库连接初始化
    const dbConnection = DatabaseConnection.getInstance();
    await dbConnection.initialize();
    console.log('✅ 数据库连接初始化成功');
    
    // 测试存储服务初始化
    const storageService = new StorageService();
    await storageService.initialize();
    console.log('✅ 存储服务初始化成功');
    
    // 测试保存用户配置
    const userProfile = await storageService.saveUserProfile({
      englishLevel: 'B1',
      learningGoal: 'daily_conversation'
    });
    console.log('✅ 用户配置保存成功:', userProfile);
    
    // 测试获取用户配置
    const retrievedProfile = await storageService.getUserProfile();
    console.log('✅ 用户配置获取成功:', retrievedProfile);
    
    // 测试保存AI配置
    const aiConfig = await storageService.saveAIConfig({
      apiUrl: 'https://api.openai.com/v1',
      apiKey: 'test-key',
      modelName: 'gpt-3.5-turbo'
    });
    console.log('✅ AI配置保存成功:', aiConfig);
    
    // 测试获取AI配置
    const retrievedAIConfig = await storageService.getAIConfig();
    console.log('✅ AI配置获取成功:', retrievedAIConfig);
    
    // 测试添加单词到单词本
    const word = await storageService.addWordToBook({
      word: 'hello',
      definition: 'a greeting',
      pronunciation: '/həˈloʊ/',
      addReason: 'translation_lookup',
      proficiencyLevel: 1,
      reviewCount: 0
    });
    console.log('✅ 单词添加成功:', word);
    
    // 测试获取单词
    const retrievedWord = await storageService.getWordByText('hello');
    console.log('✅ 单词获取成功:', retrievedWord);
    
    console.log('🎉 所有数据库测试通过！');
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error);
  }
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，将测试函数暴露到全局
  (window as any).testDatabase = testDatabase;
}

export { testDatabase };