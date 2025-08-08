# 客户端服务层

本目录包含所有**仅在客户端运行**的服务，这些服务通过 HTTP API 与服务端通信，绝不直接访问数据库或 Node.js 模块。

## 架构原则

### ✅ 客户端服务应该：
- 使用 `fetch` API 调用服务端接口
- 管理本地状态（localStorage/sessionStorage）
- 提供类型安全的 API 接口
- 处理错误和加载状态
- 缓存和优化网络请求

### ❌ 客户端服务禁止：
- 直接导入任何 Node.js 模块
- 访问 `@/lib/database` 或任何数据库相关代码
- 导入 `@/services/core` 或其他服务端专用模块
- 使用 `better-sqlite3` 或类似的服务端依赖

## 目录结构

```
client/
├── learning-records/     # 学习记录客户端服务
├── wordbook/            # 单词本客户端服务  
├── settings/            # 设置客户端服务
├── content/             # 内容客户端服务
├── base/                # 基础客户端服务类
└── index.ts             # 统一导出
```

## 使用方式

```typescript
import { learningRecordsClient } from '@/services/client';

// 所有操作都通过 API 调用
const records = await learningRecordsClient.getRecords();
```