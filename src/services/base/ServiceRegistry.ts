import { IService } from './BaseService';

/**
 * 服务注册表
 * 管理所有服务实例的生命周期
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry | null = null;
  private services: Map<string, IService> = new Map();
  private initializationOrder: string[] = [];

  private constructor() {}

  /**
   * 获取服务注册表单例
   */
  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * 注册服务
   */
  public register<T extends IService>(name: string, service: T): void {
    if (this.services.has(name)) {
      throw new Error(`服务 ${name} 已经注册`);
    }

    this.services.set(name, service);
    console.log(`服务 ${name} 已注册`);
  }

  /**
   * 获取服务
   */
  public get<T extends IService>(name: string): T | null {
    const service = this.services.get(name);
    return service as T || null;
  }

  /**
   * 获取服务（必须存在）
   */
  public getRequired<T extends IService>(name: string): T {
    const service = this.get<T>(name);
    if (!service) {
      throw new Error(`必需的服务 ${name} 未找到`);
    }
    return service;
  }

  /**
   * 检查服务是否已注册
   */
  public has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * 初始化所有服务
   */
  public async initializeAll(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const [name, service] of this.services) {
      promises.push(
        service.initialize().then(() => {
          this.initializationOrder.push(name);
          console.log(`服务 ${name} 初始化完成`);
        }).catch(error => {
          console.error(`服务 ${name} 初始化失败:`, error);
          throw error;
        })
      );
    }

    await Promise.all(promises);
    console.log('所有服务初始化完成');
  }

  /**
   * 销毁所有服务
   */
  public async destroyAll(): Promise<void> {
    // 按初始化的逆序销毁服务
    const destroyOrder = [...this.initializationOrder].reverse();
    
    for (const name of destroyOrder) {
      const service = this.services.get(name);
      if (service) {
        try {
          await service.destroy();
          console.log(`服务 ${name} 已销毁`);
        } catch (error) {
          console.error(`销毁服务 ${name} 时出错:`, error);
        }
      }
    }

    this.services.clear();
    this.initializationOrder.length = 0;
    console.log('所有服务已销毁');
  }

  /**
   * 获取所有已注册的服务名称
   */
  public getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * 获取服务状态
   */
  public getServiceStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [name, service] of this.services) {
      status[name] = service.isInitialized();
    }
    return status;
  }

  /**
   * 注销服务
   */
  public unregister(name: string): boolean {
    const service = this.services.get(name);
    if (service) {
      // 先销毁服务
      service.destroy().catch(error => {
        console.error(`注销服务 ${name} 时销毁失败:`, error);
      });
      
      this.services.delete(name);
      
      // 从初始化顺序中移除
      const index = this.initializationOrder.indexOf(name);
      if (index > -1) {
        this.initializationOrder.splice(index, 1);
      }
      
      console.log(`服务 ${name} 已注销`);
      return true;
    }
    return false;
  }

  /**
   * 重置注册表（用于测试）
   */
  public reset(): void {
    this.destroyAll().catch(error => {
      console.error('重置服务注册表时出错:', error);
    });
  }
}

/**
 * 全局服务注册表实例
 */
export const serviceRegistry = ServiceRegistry.getInstance();

/**
 * 服务注册装饰器
 */
export function RegisterService(name: string) {
  return function<T extends new (...args: any[]) => IService>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        serviceRegistry.register(name, this);
      }
    };
  };
}

/**
 * 依赖注入装饰器
 */
export function InjectService(serviceName: string) {
  return function(target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: () => serviceRegistry.getRequired(serviceName),
      enumerable: true,
      configurable: true
    });
  };
}