/**
 * 服务测试工具集
 */

import { IService, ServiceRegistry } from '../base';

/**
 * 创建模拟服务的工厂函数
 */
export function createMockService(name: string): IService {
  return {
    async initialize() {
      console.log(`Mock service ${name} initialized`);
    },
    async destroy() {
      console.log(`Mock service ${name} destroyed`);
    },
    isInitialized() {
      return true;
    },
    getServiceName() {
      return name;
    }
  };
}

/**
 * 测试用的服务注册表
 */
export function createTestRegistry(): ServiceRegistry {
  return ServiceRegistry.getInstance();
}

/**
 * 等待异步操作完成的工具函数
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 断言函数 - 检查服务是否正确初始化
 */
export function expectServiceInitialized(service: IService): void {
  expect(service.isInitialized()).toBe(true);
  expect(typeof service.getServiceName()).toBe('string');
}

/**
 * 断言函数 - 检查服务注册表状态
 */
export function expectRegistryContains(registry: ServiceRegistry, serviceName: string): void {
  expect(registry.has(serviceName)).toBe(true);
  const service = registry.get(serviceName);
  expect(service).not.toBeNull();
}