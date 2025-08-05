# 单词本服务 (WordbookService)

单词本服务是英语学习助手的核心组件之一，负责管理用户的个人单词本，包括单词的添加、熟练度管理、复习安排和记忆曲线算法。

## 功能特性

### 🎯 核心功能

- **智能单词添加**: 根据不同场景自动添加单词（翻译查询、发音错误、听力困难）
- **熟练度管理**: 基于用户表现动态调整单词熟练度等级（0-5级）
- **记忆曲线算法**: 结合艾宾浩斯遗忘曲线和SuperMemo算法优化复习时间
- **复习推荐**: 智能推荐需要复习的单词，优化学习效率
- **统计分析**: 提供详细的学习统计和进度分析

### 📊 记忆曲线算法

基于科学的记忆理论实现：

- **艾宾浩斯遗忘曲线**: 基础的复习间隔计算
- **SuperMemo算法**: 根据用户表现动态调整复习间隔
- **优先级排序**: 基于过期时间和熟练度计算复习优先级
- **遗忘概率**: 预测单词被遗忘的可能性

## 快速开始

### 基础使用

```typescript
import { WordbookService } from '@/services/wordbook';

// 初始化服务
const wordbookService = new WordbookService();
await wordbookService.initialize();

// 添加单词
const word = await wordbookService.addWordFromTranslationLookup(
  'hello', 
  '你好；问候', 
  '/həˈloʊ/'
);

// 更新熟练度
const updatedWord = await wordbookService.updateWordProficiency(
  word.id, 
  0.85, // 85%准确率
  3000  // 3秒响应时间
);

// 获取复习单词
const reviewWords = await wordbookService.getWordsForReview();
```

### 使用Hook

```typescript
import { useWordbook } from '@/hooks';

function WordbookComponent() {
  const {
    words,
    reviewWords,
    stats,
    loading,
    error,
    addWord,
    updateWordProficiency,
    loadReviewWords
  } = useWordbook();

  const handleAddWord = async () => {
    await addWord('example', '例子', 'translation_lookup');
  };

  const handleUpdateProficiency = async (wordId: number) => {
    await updateWordProficiency(wordId, 0.9, 2000);
  };

  // ... 组件逻辑
}
```

## API 参考

### WordbookService

#### 单词添加方法

```typescript
// 基于翻译查询添加单词
addWordFromTranslationLookup(word: string, definition: string, pronunciation?: string): Promise<Word>

// 基于发音错误添加单词
addWordFromPronunciationError(word: string, definition: string, pronunciation?: string): Promise<Word>

// 基于听力困难添加单词
addWordFromListeningDifficulty(word: string, definition: string, pronunciation?: string): Promise<Word>

// 智能添加单词（检查重复和优先级）
smartAddWord(word: string, definition: string, addReason: WordAddReason, pronunciation?: string): Promise<Word>
```

#### 查询方法

```typescript
// 根据ID获取单词
getWord(id: number): Promise<Word | null>

// 根据文本获取单词
getWordByText(word: string): Promise<Word | null>

// 获取单词列表
getWordsList(params?: WordQueryParams): Promise<Word[]>

// 获取需要复习的单词
getWordsForReview(): Promise<Word[]>

// 获取推荐复习单词
getRecommendedReviewWords(limit?: number): Promise<Word[]>

// 获取统计信息
getWordStats(): Promise<WordStats>
```

#### 熟练度管理

```typescript
// 更新单词熟练度（基于表现）
updateWordProficiency(wordId: number, accuracyScore: number, timeSpent?: number): Promise<Word>

// 手动设置熟练度
setWordProficiency(wordId: number, proficiencyLevel: number): Promise<Word>

// 标记为已掌握
markWordAsMastered(wordId: number): Promise<Word>

// 重置学习进度
resetWordProgress(wordId: number): Promise<Word>
```

#### 批量操作

```typescript
// 批量更新复习状态
batchUpdateReviewStatus(wordIds: number[], accuracyScores: number[]): Promise<Word[]>
```

### MemoryAlgorithm

#### 静态方法

```typescript
// 基础间隔计算
calculateBasicNextReview(proficiencyLevel: number): Date

// SuperMemo算法计算
calculateSuperMemoNextReview(currentState: MemoryState, reviewResult: ReviewResult): MemoryState

// 复习优先级计算
calculateReviewPriority(memoryState: MemoryState): number

// 优先级排序
sortByReviewPriority(memoryStates: MemoryState[]): MemoryState[]

// 间隔描述
getIntervalDescription(days: number): string

// 学习建议
getLearningAdvice(memoryState: MemoryState): string

// 遗忘概率计算
calculateForgettingProbability(memoryState: MemoryState): number
```

## 数据模型

### Word 接口

```typescript
interface Word {
  id: number;
  word: string;                    // 单词文本
  definition: string;              // 定义/释义
  pronunciation?: string;          // 发音
  addReason: WordAddReason;        // 添加原因
  proficiencyLevel: number;        // 熟练度等级 (0-5)
  reviewCount: number;             // 复习次数
  lastReviewAt?: Date;            // 最后复习时间
  nextReviewAt?: Date;            // 下次复习时间
  createdAt: Date;                // 创建时间
}
```

### WordAddReason 枚举

```typescript
type WordAddReason = 
  | 'translation_lookup'     // 翻译查询
  | 'pronunciation_error'    // 发音错误
  | 'listening_difficulty';  // 听力困难
```

### 熟练度等级

| 等级 | 描述 | 复习间隔 |
|------|------|----------|
| 0    | 未学习 | 立即 |
| 1    | 初识 | 1天 |
| 2    | 认识 | 3天 |
| 3    | 熟悉 | 7天 |
| 4    | 掌握 | 15天 |
| 5    | 精通 | 30天 |

## 记忆曲线算法详解

### 基础间隔

基于艾宾浩斯遗忘曲线的固定间隔：

```
熟练度 0: 立即复习
熟练度 1: 1天后
熟练度 2: 3天后
熟练度 3: 7天后
熟练度 4: 15天后
熟练度 5: 30天后
```

### SuperMemo算法

动态调整复习间隔的高级算法：

1. **质量评分**: 基于准确率、响应时间和主观难度计算质量分数（0-5）
2. **简易因子**: 根据质量评分调整记忆强度
3. **间隔计算**: 基于简易因子和重复次数计算下次复习间隔
4. **熟练度调整**: 根据表现提升或降低熟练度等级

### 优先级算法

复习优先级 = 过期天数 + 熟练度权重

- 过期时间越长，优先级越高
- 熟练度越低，优先级越高

## 最佳实践

### 1. 单词添加策略

```typescript
// 根据不同场景选择合适的添加方法
if (userClickedTranslation) {
  await wordbookService.addWordFromTranslationLookup(word, definition);
} else if (pronunciationScore < 0.6) {
  await wordbookService.addWordFromPronunciationError(word, definition);
} else if (userRequestedListening) {
  await wordbookService.addWordFromListeningDifficulty(word, definition);
}

// 或者使用智能添加（推荐）
await wordbookService.smartAddWord(word, definition, reason);
```

### 2. 复习流程

```typescript
// 获取推荐复习单词
const reviewWords = await wordbookService.getRecommendedReviewWords(20);

// 进行复习测试
for (const word of reviewWords) {
  const { accuracyScore, timeSpent } = await conductReviewTest(word);
  await wordbookService.updateWordProficiency(word.id, accuracyScore, timeSpent);
}
```

### 3. 批量操作优化

```typescript
// 批量更新而不是逐个更新
const wordIds = reviewWords.map(w => w.id);
const accuracyScores = reviewResults.map(r => r.accuracy);

await wordbookService.batchUpdateReviewStatus(wordIds, accuracyScores);
```

### 4. 错误处理

```typescript
try {
  await wordbookService.addWord(word, definition, reason);
} catch (error) {
  if (error instanceof DatabaseError) {
    // 处理数据库错误
    console.error('数据库操作失败:', error.message);
  } else {
    // 处理其他错误
    console.error('未知错误:', error);
  }
}
```

## 测试

运行单词本服务测试：

```bash
# 运行所有测试
yarn test src/services/wordbook

# 运行基础功能测试
yarn test src/services/wordbook/__tests__/WordbookService.basic.test.ts

# 运行记忆算法测试
yarn test src/services/wordbook/__tests__/MemoryAlgorithm.test.ts
```

## 演示

查看完整的使用演示：

```typescript
import { runAllDemos } from '@/services/wordbook/demo';

// 运行所有演示
await runAllDemos();
```

## 性能考虑

### 数据库优化

- 为常用查询字段创建索引
- 使用事务确保批量操作的一致性
- 定期清理过期数据

### 内存管理

- 使用分页查询避免加载大量数据
- 实现适当的缓存策略
- 及时释放不需要的资源

### 算法优化

- 记忆曲线计算使用缓存
- 优先级排序使用高效算法
- 批量操作减少数据库访问次数

## 扩展性

### 自定义记忆配置

```typescript
const customConfig = {
  intervals: [0, 2, 5, 10, 20, 40], // 自定义间隔
  accuracyThreshold: 0.85,          // 自定义阈值
  degradeThreshold: 0.4
};

const wordbookService = new WordbookService(storageService, customConfig);
```

### 插件系统

可以通过继承WordbookService来添加自定义功能：

```typescript
class ExtendedWordbookService extends WordbookService {
  async addWordWithContext(word: string, definition: string, context: string) {
    // 自定义逻辑
    return super.smartAddWord(word, definition, 'translation_lookup');
  }
}
```

## 故障排除

### 常见问题

1. **数据库初始化失败**
   - 检查sql.js是否正确加载
   - 确认浏览器支持IndexedDB

2. **单词添加失败**
   - 检查单词文本是否为空
   - 确认数据库连接正常

3. **复习时间计算错误**
   - 检查系统时间是否正确
   - 确认熟练度等级在有效范围内

### 调试技巧

```typescript
// 启用详细日志
const wordbookService = new WordbookService(storageService);
wordbookService.enableDebugMode(); // 如果实现了调试模式

// 检查内部状态
const stats = await wordbookService.getWordStats();
console.log('当前状态:', stats);
```

## 贡献

欢迎提交Issue和Pull Request来改进单词本服务！

### 开发指南

1. Fork项目
2. 创建功能分支
3. 编写测试
4. 提交代码
5. 创建Pull Request

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint规则
- 编写完整的JSDoc注释
- 保持测试覆盖率 > 80%