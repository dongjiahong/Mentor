/**
 * 服务层测试环境设置
 */

import { serviceRegistry } from '../base/ServiceRegistry';

// 全局测试前置设置
beforeAll(async () => {
  // 清理现有的服务注册
  serviceRegistry.reset();
});

// 每个测试用例后清理
afterEach(async () => {
  // 可以添加测试后的清理逻辑
});

// 全局测试后置清理
afterAll(async () => {
  // 销毁所有服务
  await serviceRegistry.destroyAll();
});