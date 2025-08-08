/**
 * 服务基础模块导出
 */

export {
  BaseService,
  AsyncService,
  ServiceError,
  type IService,
  type ServiceConfig
} from './BaseService';

export {
  ServiceRegistry,
  serviceRegistry,
  RegisterService,
  InjectService
} from './ServiceRegistry';