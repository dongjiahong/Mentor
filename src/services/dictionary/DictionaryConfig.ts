import { AppError, ErrorType } from '@/types';

// 词典配置接口
export interface DictionaryConfig {
  id: number;
  provider: 'youdao' | 'mock';
  appKey: string;
  appSecret: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 词典配置验证结果
export interface DictionaryConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * 词典配置管理类
 */
export class DictionaryConfigManager {
  private static readonly STORAGE_KEY = 'dictionary_config';

  /**
   * 保存词典配置到本地存储
   * @param config 词典配置
   */
  static saveConfig(config: Omit<DictionaryConfig, 'id' | 'createdAt' | 'updatedAt'>): DictionaryConfig {
    const now = new Date();
    const fullConfig: DictionaryConfig = {
      id: Date.now(), // 简单的ID生成
      ...config,
      createdAt: now,
      updatedAt: now,
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fullConfig));
      return fullConfig;
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: '保存词典配置失败',
        details: error
      });
    }
  }

  /**
   * 从本地存储获取词典配置
   * @returns 词典配置或null
   */
  static getConfig(): DictionaryConfig | null {
    try {
      const configStr = localStorage.getItem(this.STORAGE_KEY);
      if (!configStr) {
        return null;
      }

      const config = JSON.parse(configStr);
      
      // 转换日期字符串为Date对象
      config.createdAt = new Date(config.createdAt);
      config.updatedAt = new Date(config.updatedAt);

      return config;
    } catch (error) {
      console.error('获取词典配置失败:', error);
      return null;
    }
  }

  /**
   * 更新词典配置
   * @param updates 要更新的配置项
   * @returns 更新后的配置
   */
  static updateConfig(updates: Partial<Omit<DictionaryConfig, 'id' | 'createdAt' | 'updatedAt'>>): DictionaryConfig {
    const currentConfig = this.getConfig();
    
    if (!currentConfig) {
      throw new AppError({
        type: ErrorType.VALIDATION_ERROR,
        message: '没有找到现有的词典配置'
      });
    }

    const updatedConfig: DictionaryConfig = {
      ...currentConfig,
      ...updates,
      updatedAt: new Date(),
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedConfig));
      return updatedConfig;
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: '更新词典配置失败',
        details: error
      });
    }
  }

  /**
   * 删除词典配置
   */
  static deleteConfig(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: '删除词典配置失败',
        details: error
      });
    }
  }

  /**
   * 验证词典配置
   * @param config 要验证的配置
   * @returns 验证结果
   */
  static validateConfig(config: Partial<DictionaryConfig>): DictionaryConfigValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证必填字段
    if (!config.provider) {
      errors.push('词典服务提供商不能为空');
    } else if (!['youdao', 'mock'].includes(config.provider)) {
      errors.push('不支持的词典服务提供商');
    }

    // 如果是有道词典，验证API配置
    if (config.provider === 'youdao') {
      if (!config.appKey || config.appKey.trim() === '') {
        errors.push('有道API应用Key不能为空');
      }

      if (!config.appSecret || config.appSecret.trim() === '') {
        errors.push('有道API应用密钥不能为空');
      }

      // 检查Key格式（有道的appKey通常是数字）
      if (config.appKey && !/^\d+$/.test(config.appKey.trim())) {
        warnings.push('有道API应用Key格式可能不正确，通常应该是纯数字');
      }

      // 检查密钥长度
      if (config.appSecret && config.appSecret.trim().length < 10) {
        warnings.push('有道API应用密钥长度可能不正确');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * 测试词典配置连接
   * @param config 要测试的配置
   * @returns 测试结果
   */
  static async testConfig(config: DictionaryConfig): Promise<boolean> {
    try {
      if (config.provider === 'mock') {
        // 模拟服务总是可用的
        return true;
      }

      if (config.provider === 'youdao') {
        // 这里可以实现实际的API连接测试
        // 暂时返回true，实际项目中应该调用API进行测试
        return true;
      }

      return false;
    } catch (error) {
      console.error('测试词典配置失败:', error);
      return false;
    }
  }

  /**
   * 获取默认配置
   * @returns 默认的词典配置
   */
  static getDefaultConfig(): Omit<DictionaryConfig, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      provider: 'mock',
      appKey: '',
      appSecret: '',
      enabled: true,
    };
  }

  /**
   * 检查是否已配置
   * @returns 是否已有有效配置
   */
  static isConfigured(): boolean {
    const config = this.getConfig();
    if (!config || !config.enabled) {
      return false;
    }

    const validation = this.validateConfig(config);
    return validation.isValid;
  }
}

/**
 * 词典服务工厂
 * 根据配置创建相应的词典服务实例
 */
export class DictionaryServiceFactory {
  /**
   * 创建词典服务实例
   * @param config 词典配置，如果不提供则从本地存储获取
   * @returns 词典服务实例
   */
  static async createService(config?: DictionaryConfig) {
    const { YoudaoDictionaryService, MockDictionaryService } = await import('./DictionaryService');
    
    const actualConfig = config || DictionaryConfigManager.getConfig();
    
    if (!actualConfig) {
      throw new AppError({
        type: ErrorType.INVALID_CONFIG,
        message: '没有找到词典服务配置'
      });
    }

    if (!actualConfig.enabled) {
      throw new AppError({
        type: ErrorType.INVALID_CONFIG,
        message: '词典服务已禁用'
      });
    }

    const validation = DictionaryConfigManager.validateConfig(actualConfig);
    if (!validation.isValid) {
      throw new AppError({
        type: ErrorType.INVALID_CONFIG,
        message: '词典服务配置无效',
        details: validation.errors
      });
    }

    switch (actualConfig.provider) {
      case 'youdao':
        return new YoudaoDictionaryService(actualConfig.appKey, actualConfig.appSecret);
      
      case 'mock':
        return new MockDictionaryService();
      
      default:
        throw new AppError({
          type: ErrorType.INVALID_CONFIG,
          message: `不支持的词典服务提供商: ${actualConfig.provider}`
        });
    }
  }

  /**
   * 获取可用的词典服务提供商列表
   * @returns 提供商列表
   */
  static getAvailableProviders() {
    return [
      {
        id: 'youdao',
        name: '有道词典',
        description: '网易有道词典API服务',
        requiresConfig: true,
        configFields: [
          { name: 'appKey', label: 'API应用Key', type: 'text', required: true },
          { name: 'appSecret', label: 'API应用密钥', type: 'password', required: true }
        ]
      },
      {
        id: 'mock',
        name: '模拟服务',
        description: '用于开发和测试的模拟词典服务',
        requiresConfig: false,
        configFields: []
      }
    ];
  }
}