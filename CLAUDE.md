# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 中文交流规则

当与用户交流时，请使用中文进行对话。这包括：

- 所有的回复和解释都使用中文
- 代码注释可以使用中文
- 错误信息和调试信息的解释使用中文
- 技术文档和说明使用中文

但是保持以下内容使用英文：
- 代码本身（变量名、函数名、类名等）
- 配置文件内容
- 命令行指令
- 日志输出

## 导师

- 每次都用审视的目光，仔细看我输入的潜在问题，你要指出我的问题，并给出明显在我思考框架之外的建议。如果你觉得我说的太离谱了，你就骂回来，帮我瞬间清醒。
- 在开发新的功能或者修复问题时，不要盲目的增加新的代码和功能去满足需求，而是要会审视当前的架构和逻辑，看是否能够在现有代码上解决或者复用考虑整体架构的完整和简洁性。

## 不要做什么
- 不要使用 useEffect 进行数据获取
- 不要用 'any' 类型绕过 TypeScript

## 常用开发命令

```bash
# 开发环境（支持HTTPS）
yarn dev

# 构建项目
yarn build

# 启动生产环境
yarn start

# 代码检查
yarn lint
yarn lint:fix

# 类型检查
yarn type-check

# 格式化代码
yarn format
yarn format:check
```

## 技术栈与架构

### 核心技术栈
- **前端框架**: Next.js 14 (App Router)
- **开发语言**: TypeScript 5+
- **样式**: Tailwind CSS + shadcn/ui
- **数据库**: SQLite (better-sqlite3)
- **状态管理**: React Hooks + Context
- **表单**: React Hook Form + Zod

### 项目架构

这是一个英语学习应用，采用功能域驱动的分层架构：

#### 1. 服务层架构 (`src/services/`)
- **分层设计**: 按功能域组织，每个域有独立的服务模块
- **基础服务**: 所有服务继承`BaseService`，提供统一的初始化和错误处理
- **服务注册**: 使用`ServiceRegistry`管理服务生命周期和依赖注入
- **客户端服务**: `client/`目录下的服务负责API调用和数据获取

主要服务模块：
```
services/
├── base/           # 基础服务架构
├── core/           # 核心服务 (数据库, 存储, 初始化)
├── ai/             # AI内容生成
├── language/       # 语言服务 (词典, 语音, 发音)
├── content/        # 内容管理
├── practice/       # 练习模块 (听说读写)
├── user/           # 用户数据 (单词本, 学习记录)
└── client/         # API客户端服务
```

#### 2. 组件架构 (`src/components/`)
- **UI组件**: `ui/`目录存放shadcn/ui基础组件
- **功能组件**: `features/`目录按学习模块组织
- **布局组件**: `layout/`目录处理页面布局

#### 3. 数据库设计
- **本地SQLite**: 使用better-sqlite3，数据存储在`data/mentor.db`
- **Schema管理**: 统一的数据库架构定义在`services/core/database/schema.ts`
- **迁移机制**: 支持数据库版本升级和结构变更

#### 4. API设计
- **RESTful API**: 遵循REST原则，使用Next.js API Routes
- **统一响应**: 所有API返回`{ success: boolean, data?: any, error?: string }`格式
- **错误处理**: 客户端服务统一处理API错误和重试逻辑

### 学习模块

应用支持以下学习模块：
- **内容管理 (content)**: 学习内容的浏览和管理
- **听力练习 (listening)**: 音频内容的听力训练
- **口语练习 (speaking)**: 语音识别和发音评估
- **阅读练习 (reading)**: 文章阅读和理解
- **写作练习 (writing)**: 写作提示和AI评估
- **单词本 (wordbook)**: 词汇学习和记忆算法

## 包管理器规则

优先使用 yarn 作为包管理器：

```bash
# 安装依赖
yarn add <package>
yarn add -D <dev-package>

# 运行脚本
yarn <script>

# 删除依赖
yarn remove <package>
```

## 前端开发规范

**技术要求**: 精通 Next.js + React + TypeScript + Tailwind CSS + shadcn/ui

**开发原则**:
- 优先使用 TypeScript，确保类型安全
- 基于 shadcn/ui 组件构建，使用 Tailwind CSS 定制样式
- 遵循现代 React 模式（Hooks、组件组合）
- 实现完整的响应式设计和无障碍性支持
- 使用 Lucide React 图标库而非 FontAwesome

**组件开发**:
- 先定义 TypeScript 接口和属性类型
- 使用 shadcn/ui 作为基础，Tailwind CSS 进行样式定制
- 确保组件具有良好的错误边界和加载状态
- 编写清晰的组件文档和使用示例

## 数据库操作

数据库使用SQLite，通过`src/lib/database.ts`管理连接：

```typescript
import { getDatabase } from '@/lib/database'

const db = getDatabase()
const stmt = db.prepare('SELECT * FROM table WHERE id = ?')
const result = stmt.get(id)
```

**注意事项**:
- 数据库操作只能在服务端进行（API Routes）
- 使用准备语句防止SQL注入
- 客户端通过API服务访问数据

## 服务开发模式

创建新服务时应：

1. **继承基础服务**:
```typescript
import { BaseService } from '@/services/base'

class MyService extends BaseService {
  protected async onInitialize(): Promise<void> {
    // 初始化逻辑
  }
}
```

2. **使用服务注册**:
```typescript
import { ServiceRegistry } from '@/services/base'

const service = new MyService('MyService')
ServiceRegistry.getInstance().register('myService', service)
```

3. **模块化导出**:
每个服务模块都应有`index.ts`文件统一导出

## API开发规范

API Routes应遵循：

1. **统一响应格式**:
```typescript
return NextResponse.json({
  success: true,
  data: result
})
```

2. **错误处理**:
```typescript
return NextResponse.json(
  { success: false, error: '错误信息' },
  { status: 400 }
)
```

3. **输入验证**:
使用 Zod 验证请求参数和响应数据

## 重要文件位置

- **数据库配置**: `src/lib/database.ts`
- **服务注册**: `src/services/base/ServiceRegistry.ts`
- **API客户端**: `src/services/client/`
- **类型定义**: `src/types/`
- **数据库Schema**: `src/services/core/database/schema.ts`
- **主要页面**: `src/pages/NewIntegratedLearningPage.tsx`
