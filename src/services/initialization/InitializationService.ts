import { getDatabase } from '@/lib/database';

/**
 * 初始化服务 - 负责系统启动时的数据初始化
 */
export class InitializationService {
  
  /**
   * 初始化AI配置（从环境变量）
   */
  static async initializeAIConfig(): Promise<void> {
    try {
      const db = getDatabase();
      
      // 检查是否已有AI配置
      const existingConfig = db.prepare('SELECT id FROM ai_config LIMIT 1').get();
      
      if (!existingConfig) {
        // 从环境变量获取AI配置
        const apiUrl = process.env.OPENAI_BASE_URL || 'https://api-inference.modelscope.cn/v1/';
        const apiKey = process.env.OPENAI_API_KEY;
        const modelName = process.env.OPEHAI_MODEL || 'Qwen/Qwen3-235B-A22B-Instruct-2507';
        
        if (apiKey) {
          // 插入初始AI配置
          const stmt = db.prepare(`
            INSERT INTO ai_config (api_url, api_key, model_name, temperature, max_tokens)
            VALUES (?, ?, ?, ?, ?)
          `);
          
          stmt.run(apiUrl, apiKey, modelName, 0.7, 2000);
          
          console.log('AI配置已从环境变量初始化');
        } else {
          console.log('未找到环境变量中的API密钥，请在设置页面配置AI参数');
        }
      }
    } catch (error) {
      console.error('初始化AI配置失败:', error);
    }
  }
  
  /**
   * 初始化默认用户配置
   */
  static async initializeDefaultUserProfile(): Promise<void> {
    try {
      const db = getDatabase();
      
      // 检查是否已有用户配置
      const existingProfile = db.prepare('SELECT id FROM user_profile LIMIT 1').get();
      
      if (!existingProfile) {
        // 插入默认用户配置
        const stmt = db.prepare(`
          INSERT INTO user_profile (english_level, learning_goal)
          VALUES (?, ?)
        `);
        
        stmt.run('B1', 'daily_conversation');
        
        console.log('默认用户配置已创建');
      }
    } catch (error) {
      console.error('初始化用户配置失败:', error);
    }
  }
  
  /**
   * 执行完整的系统初始化
   */
  static async initialize(): Promise<void> {
    console.log('开始系统初始化...');
    
    await Promise.all([
      this.initializeAIConfig(),
      this.initializeDefaultUserProfile()
    ]);
    
    console.log('系统初始化完成');
  }
}