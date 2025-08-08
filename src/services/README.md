# 服务层架构重构

## 概述

本次重构将services目录按功能域重新组织，创建了统一的服务基类和接口，提供了更清晰的代码结构和更好的可维护性。

## 新的目录结构

```
services/
├── index.ts                    # 统一导出入口
├── README.md                   # 架构说明文档
├── __tests__/                  # 通用测试工具和配置
│   ├── index.ts
│   ├── setup.ts               # 测试环境设置
│   ├── testUtils.ts           # 测试工具函数
│   └── integration.test.ts    # 集成测试
├── base/                       # 基础服务架构
│   ├── BaseService.ts         # 服务基类
│   ├── ServiceRegistry.ts     # 服务注册表
│   ├── index.ts
│   └── __tests__/
├── core/                       # 核心服务
│   ├── database/              # 数据库相关
│   ├── storage/               # 存储服务
│   ├── initialization/        # 初始化服务
│   └── index.ts
├── ai/                         # AI服务
│   ├── AIService.ts
│   ├── PromptTemplates.ts
│   ├── ContentValidator.ts
│   ├── index.ts
│   └── __tests__/
├── language/                   # 语言服务
│   ├── dictionary/            # 词典服务
│   ├── speech/                # 语音服务
│   ├── pronunciation/         # 发音服务
│   └── index.ts
├── content/                    # 内容管理服务
│   ├── content-management/    # 内容管理
│   ├── learning-content/      # 学习内容
│   └── index.ts
├── practice/                   # 练习相关服务
│   ├── writing/               # 写作练习
│   ├── speaking/              # 口语练习
│   ├── listening/             # 听力练习
│   ├── reading/               # 阅读练习
│   └── index.ts
└── user/                       # 用户相关服务
    ├── wordbook/              # 单词本
    ├── learning-records/      # 学习记录
    └── index.ts
```

## 重构改进

### 1. 统一的服务基类

- `BaseService`: 提供所有服务的基本功能
- `AsyncService`: 适用于异步操作的服务基类
- `ServiceError`: 统一的服务错误类

### 2. 服务注册表

- `ServiceRegistry`: 管理所有服务实例的生命周期
- 支持依赖注入和服务发现
- 提供统一的初始化和销毁机制

### 3. 模块化导出

- 每个服务模块都有自己的`index.ts`导出文件
- 支持按需导入和树摇优化
- 清晰的模块边界和职责划分

### 4. 统一的测试架构

- 通用的测试工具和配置
- 每个模块都有对应的测试套件
- 支持单元测试和集成测试

## 使用方式

### 基本服务使用

```typescript
import { ServiceRegistry, BaseService } from '@/services/base';

// 创建自定义服务
class MyService extends BaseService {
  protected async onInitialize(): Promise<void> {
    // 初始化逻辑
  }
}

// 注册服务
const registry = ServiceRegistry.getInstance();
registry.register('myService', new MyService('MyService'));

// 使用服务
const service = registry.getRequired<MyService>('myService');
await service.initialize();
```

### 模块化导入

```typescript
// 导入特定模块的服务
import { StorageService } from '@/services/core';
import { AIService } from '@/services/ai';
import { WritingEvaluationService } from '@/services/practice';

// 或者导入整个服务层
import * as Services from '@/services';
```

### 服务注册装饰器

```typescript
import { RegisterService, BaseService } from '@/services/base';

@RegisterService('myService')
class MyService extends BaseService {
  // 服务实现
}
```

## 迁移指南

### 旧的导入路径更新

```typescript
// 旧的导入方式
import { StorageService } from '@/services/storage/StorageService';
import { AIService } from '@/services/ai/AIService';

// 新的导入方式
import { StorageService } from '@/services/core';
import { AIService } from '@/services/ai';

// 或者从根导出
import { StorageService, AIService } from '@/services';
```

### WritingEvaluationService位置变更

```typescript
// 旧位置
import { WritingEvaluationService } from '@/services/WritingEvaluationService';

// 新位置
import { WritingEvaluationService } from '@/services/practice';
```

## 最佳实践

1. **继承BaseService**: 新创建的服务应该继承`BaseService`或`AsyncService`
2. **使用服务注册表**: 通过`ServiceRegistry`管理服务生命周期
3. **模块化组织**: 按功能域组织服务，保持单一职责
4. **统一错误处理**: 使用`ServiceError`处理服务相关错误
5. **完善的测试**: 为每个服务编写单元测试和集成测试

## 未来扩展

- 支持更多的练习模式（listening、reading、speaking）
- 添加服务监控和性能指标
- 实现服务间通信机制
- 支持插件化服务架构