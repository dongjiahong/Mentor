/**
 * 服务基础抽象类
 * 提供所有服务的通用功能和接口
 */
export abstract class BaseService {
  protected initialized = false;
  protected readonly serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.onInitialize();
      this.initialized = true;
    } catch (error) {
      throw new Error(`初始化${this.serviceName}失败: ${error}`);
    }
  }

  /**
   * 销毁服务
   */
  public async destroy(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    try {
      await this.onDestroy();
      this.initialized = false;
    } catch (error) {
      console.error(`销毁${this.serviceName}时出错:`, error);
    }
  }

  /**
   * 检查服务是否已初始化
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 获取服务名称
   */
  public getServiceName(): string {
    return this.serviceName;
  }

  /**
   * 子类必须实现的初始化逻辑
   */
  protected abstract onInitialize(): Promise<void>;

  /**
   * 子类可选实现的销毁逻辑
   */
  protected async onDestroy(): Promise<void> {
    // 默认实现：什么也不做
  }

  /**
   * 确保服务已初始化
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`${this.serviceName}尚未初始化，请先调用initialize()`);
    }
  }
}

/**
 * 服务接口定义
 */
export interface IService {
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  isInitialized(): boolean;
  getServiceName(): string;
}

/**
 * 服务配置基础接口
 */
export interface ServiceConfig {
  enabled?: boolean;
  timeout?: number;
  retryAttempts?: number;
  [key: string]: unknown;
}

/**
 * 服务错误类
 */
export class ServiceError extends Error {
  public readonly serviceName: string;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(serviceName: string, message: string, code = 'UNKNOWN_ERROR', details?: unknown) {
    super(message);
    this.name = 'ServiceError';
    this.serviceName = serviceName;
    this.code = code;
    this.details = details;
  }
}

/**
 * 异步服务基础类（适用于需要异步操作的服务）
 */
export abstract class AsyncService extends BaseService implements IService {
  protected config: ServiceConfig;

  constructor(serviceName: string, config: ServiceConfig = {}) {
    super(serviceName);
    this.config = { enabled: true, timeout: 5000, retryAttempts: 3, ...config };
  }

  /**
   * 带超时的异步执行
   */
  protected async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number = this.config.timeout || 5000
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new ServiceError(
          this.serviceName,
          `操作超时（${timeout}ms）`,
          'TIMEOUT_ERROR'
        )), timeout)
      )
    ]);
  }

  /**
   * 带重试的异步执行
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    attempts: number = this.config.retryAttempts || 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < attempts - 1) {
          // 指数退避重试
          await this.sleep(Math.pow(2, i) * 1000);
        }
      }
    }

    throw new ServiceError(
      this.serviceName,
      `操作失败，已重试${attempts}次`,
      'RETRY_EXHAUSTED',
      lastError
    );
  }

  /**
   * 睡眠函数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取配置
   */
  public getConfig(): ServiceConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}