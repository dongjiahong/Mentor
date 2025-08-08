import { 
  UserProfile, 
  AIConfig
} from '@/types';
import { ApiClient } from '../base/ApiClient';

/**
 * 设置客户端服务
 * 管理用户配置和AI配置，支持本地缓存和服务端同步
 */
export class SettingsClient {
  private apiClient: ApiClient;
  private cache: {
    userProfile?: UserProfile;
    aiConfig?: AIConfig;
  } = {};

  constructor() {
    this.apiClient = new ApiClient('/api');
  }

  // ========== 用户配置 ==========

  /**
   * 获取用户配置
   */
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      // 先尝试从服务端获取
      const profile = await this.apiClient.get<UserProfile>('/user-profile');
      
      // 缓存到本地
      this.cache.userProfile = profile;
      this.saveToLocalStorage('user_profile', profile);
      
      return profile;
    } catch (error) {
      console.warn('从服务端获取用户配置失败，使用本地缓存:', error);
      
      // 回退到本地存储
      return this.loadFromLocalStorage<UserProfile>('user_profile');
    }
  }

  /**
   * 保存用户配置
   */
  async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      // 保存到服务端
      await this.apiClient.post('/user-profile', profile);
      
      // 更新本地缓存
      this.cache.userProfile = profile;
      this.saveToLocalStorage('user_profile', profile);
    } catch (error) {
      console.error('保存用户配置到服务端失败:', error);
      
      // 至少保存到本地存储
      this.saveToLocalStorage('user_profile', profile);
      throw error;
    }
  }

  // ========== AI 配置 ==========

  /**
   * 获取AI配置
   */
  async getAIConfig(): Promise<AIConfig | null> {
    try {
      // 先尝试从服务端获取
      const config = await this.apiClient.get<AIConfig>('/ai-config');
      
      if (config) {
        // 服务端返回的API Key是密文，需要与本地存储的完整API Key合并
        const localConfig = this.loadFromLocalStorage<AIConfig>('ai_config');
        const fullApiKey = localConfig?.apiKey && !localConfig.apiKey.includes('***') 
          ? localConfig.apiKey 
          : '';
        
        // 创建完整配置（用于本地缓存）
        const fullConfig = { 
          ...config, 
          apiKey: fullApiKey || config.apiKey 
        };
        
        // 只在有完整API Key时才更新本地存储
        if (fullApiKey) {
          this.cache.aiConfig = fullConfig;
          this.saveToLocalStorage('ai_config', fullConfig);
        }
        
        // 返回服务端的配置（包含密文API Key用于显示）
        return config;
      }
      
      return null;
    } catch (error) {
      console.warn('从服务端获取AI配置失败，使用本地缓存:', error);
      
      // 回退到本地存储
      return this.loadFromLocalStorage<AIConfig>('ai_config');
    }
  }

  /**
   * 保存AI配置
   */
  async saveAIConfig(config: AIConfig): Promise<void> {
    try {
      // 转换字段名以匹配API期望的格式
      const apiPayload = {
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
        modelName: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      };
      
      // 保存到服务端
      await this.apiClient.post('/ai-config', apiPayload);
      
      // 服务端会返回密文版本的API Key，但本地存储应该保存完整版本
      const fullConfig = { ...config };
      // 更新本地缓存（保存完整的API Key）
      this.cache.aiConfig = fullConfig;
      this.saveToLocalStorage('ai_config', fullConfig);
    } catch (error) {
      console.error('保存AI配置到服务端失败:', error);
      
      // 至少保存到本地存储（保存完整的API Key）
      this.saveToLocalStorage('ai_config', config);
      throw error;
    }
  }

  /**
   * 测试AI配置
   */
  async testAIConfig(config: AIConfig): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    latency?: number;
    warnings?: string[];
  }> {
    try {
      // 转换字段名以匹配API期望的格式
      const testPayload = {
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
        modelName: config.modelName,
        temperature: config.temperature,
        maxTokens: config.maxTokens
      };
      
      // 使用 PATCH 方法进行测试
      const response = await this.apiClient.patch('/ai-config', testPayload);
      return {
        success: response.success,
        message: response.message,
        latency: response.data?.latency,
        warnings: response.warnings
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '测试连接失败',
        message: error instanceof Error ? error.message : '测试连接失败'
      };
    }
  }

  // ========== 数据同步 ==========

  /**
   * 同步本地配置到服务端
   */
  async syncToServer(): Promise<{
    userProfile: boolean;
    aiConfig: boolean;
    errors: string[];
  }> {
    const result = {
      userProfile: false,
      aiConfig: false,
      errors: [] as string[]
    };

    // 同步用户配置
    const localUserProfile = this.loadFromLocalStorage<UserProfile>('user_profile');
    if (localUserProfile) {
      try {
        await this.saveUserProfile(localUserProfile);
        result.userProfile = true;
      } catch (error) {
        result.errors.push(`同步用户配置失败: ${error.message}`);
      }
    }

    // 同步AI配置
    const localAIConfig = this.loadFromLocalStorage<AIConfig>('ai_config');
    if (localAIConfig) {
      try {
        await this.saveAIConfig(localAIConfig);
        result.aiConfig = true;
      } catch (error) {
        result.errors.push(`同步AI配置失败: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * 从服务端同步配置到本地
   */
  async syncFromServer(): Promise<{
    userProfile: boolean;
    aiConfig: boolean;
    errors: string[];
  }> {
    const result = {
      userProfile: false,
      aiConfig: false,
      errors: [] as string[]
    };

    // 同步用户配置
    try {
      const userProfile = await this.getUserProfile();
      result.userProfile = !!userProfile;
    } catch (error) {
      result.errors.push(`同步用户配置失败: ${error.message}`);
    }

    // 同步AI配置
    try {
      const aiConfig = await this.getAIConfig();
      result.aiConfig = !!aiConfig;
    } catch (error) {
      result.errors.push(`同步AI配置失败: ${error.message}`);
    }

    return result;
  }

  // ========== 本地存储辅助方法 ==========

  private saveToLocalStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`保存到本地存储失败 (${key}):`, error);
    }
  }

  private loadFromLocalStorage<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`从本地存储读取失败 (${key}):`, error);
      return null;
    }
  }

  /**
   * 清除所有配置
   */
  async clearAll(): Promise<void> {
    try {
      // 清除服务端数据（如果有相关API）
      // await this.apiClient.delete('/user-profile');
      // await this.apiClient.delete('/ai-config');
    } catch (error) {
      console.warn('清除服务端配置失败:', error);
    }

    // 清除本地存储
    try {
      localStorage.removeItem('user_profile');
      localStorage.removeItem('ai_config');
    } catch (error) {
      console.error('清除本地存储失败:', error);
    }

    // 清除内存缓存
    this.cache = {};
  }

  /**
   * 获取缓存的配置（不发起网络请求）
   */
  getCachedUserProfile(): UserProfile | null {
    return this.cache.userProfile || this.loadFromLocalStorage<UserProfile>('user_profile');
  }

  getCachedAIConfig(): AIConfig | null {
    return this.cache.aiConfig || this.loadFromLocalStorage<AIConfig>('ai_config');
  }
}

// 创建单例实例
export const settingsClient = new SettingsClient();