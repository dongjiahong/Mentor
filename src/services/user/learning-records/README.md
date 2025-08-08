# 学习行为记录系统

## 概述

学习行为记录系统是英语学习助手的核心功能之一，负责记录、分析和统计用户的学习行为数据，实现需求9.1和9.2中定义的功能。

## 功能特性

### 1. 学习活动记录 (需求9.1)
- 记录阅读、听力、口语、翻译等学习活动
- 记录学习时间、准确率、相关单词等详细信息
- 支持元数据存储，可扩展记录更多信息

### 2. 用户能力评估 (需求9.2)
- **词汇水平评估**: 基于掌握单词数量评估词汇水平
- **发音水平评估**: 基于发音准确率和改进趋势评估发音能力
- **阅读理解评估**: 基于理解准确率和阅读效率评估阅读能力

### 3. 学习统计分析
- 总学习时间统计
- 平均准确率计算
- 连续学习天数追踪
- 按活动类型分类统计

### 4. 进度趋势分析
- 每日、每周、每月学习数据趋势
- 学习进步曲线分析
- 能力提升检测

### 5. 智能建议生成
- 基于学习数据生成个性化建议
- 识别薄弱环节并提供改进建议
- 学习平衡性分析

### 6. 成就系统
- 学习时间成就
- 词汇量成就
- 连续学习成就
- 自动检测新成就

## 架构设计

### 核心服务类

#### LearningRecordsService
- 核心业务逻辑处理
- 数据分析和统计计算
- 能力评估算法实现

#### LearningRecordsClientService
- 客户端友好的API接口
- 简化的方法调用
- 数据格式化和处理

### React Hooks

#### useLearningRecords
- 基础学习记录功能
- 活动记录方法
- 统计数据管理

#### useLearningStats
- 专门的统计数据管理
- 今日、本周、本月数据
- 自动刷新机制

#### useLearningAbilities
- 能力评估数据管理
- 水平升级检测
- 能力趋势分析

#### useLearningReport
- 综合学习报告生成
- 多维度数据整合
- 报告数据管理

## 数据模型

### LearningRecord
```typescript
interface LearningRecord {
  id: number;
  activityType: ActivityType; // 'reading' | 'listening' | 'speaking' | 'translation'
  contentId?: number;
  word?: string;
  accuracyScore?: number;
  timeSpent: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
```

### LearningStats
```typescript
interface LearningStats {
  totalStudyTime: number;
  totalWords: number;
  masteredWords: number;
  averageAccuracy: number;
  streakDays: number;
  activitiesByType: Record<ActivityType, number>;
}
```

## 使用示例

### 记录学习活动
```typescript
import { useLearningRecords } from '@/hooks/useLearningRecords';

function MyComponent() {
  const { recordReading, recordSpeaking } = useLearningRecords();

  const handleReadingActivity = async () => {
    await recordReading({
      timeSpent: 300,
      wordsRead: 150,
      comprehensionScore: 85
    });
  };

  const handleSpeakingActivity = async () => {
    await recordSpeaking({
      word: 'example',
      timeSpent: 120,
      pronunciationScore: 88,
      attempts: 3
    });
  };
}
```

### 获取学习统计
```typescript
import { useLearningStats } from '@/hooks/useLearningRecords';

function StatsComponent() {
  const { todayStats, weeklyStats, monthlyStats } = useLearningStats();

  return (
    <div>
      <p>今日学习时间: {todayStats.data?.totalStudyTime}秒</p>
      <p>本周掌握单词: {weeklyStats.data?.masteredWords}个</p>
      <p>本月平均准确率: {monthlyStats.data?.averageAccuracy}%</p>
    </div>
  );
}
```

### 能力评估
```typescript
import { useLearningAbilities } from '@/hooks/useLearningRecords';

function AbilitiesComponent() {
  const { abilities, levelUpgrade } = useLearningAbilities();

  return (
    <div>
      {abilities.data && (
        <div>
          <p>词汇水平: {abilities.data.vocabularyLevel.level}</p>
          <p>发音水平: {abilities.data.pronunciationLevel.level}</p>
          <p>阅读水平: {abilities.data.readingLevel.level}</p>
        </div>
      )}
      
      {levelUpgrade.data?.shouldUpgrade && (
        <div className="upgrade-notification">
          <p>建议升级到: {levelUpgrade.data.suggestedLevel}</p>
          <p>原因: {levelUpgrade.data.reason}</p>
        </div>
      )}
    </div>
  );
}
```

## 演示页面

访问 `/learning-records-demo` 页面可以查看完整的学习行为记录系统演示，包括：

- 模拟学习活动记录
- 实时统计数据展示
- 能力评估可视化
- 学习记录历史查看
- 水平升级提醒

## 技术特点

1. **类型安全**: 完整的TypeScript类型定义
2. **响应式设计**: 支持移动端和桌面端
3. **实时更新**: 数据变化时自动刷新界面
4. **错误处理**: 完善的错误处理和用户反馈
5. **性能优化**: 合理的数据缓存和更新策略
6. **可扩展性**: 模块化设计，易于扩展新功能

## 数据存储

系统使用SQLite数据库存储学习记录数据，通过`learning_records`表记录所有学习活动。数据包括：

- 活动类型和时间
- 准确率和成绩
- 关联的内容和单词
- 扩展元数据

## 算法说明

### 能力水平评估算法

1. **词汇水平**: 基于掌握单词数量映射到CEFR等级
2. **发音水平**: 基于平均准确率和改进趋势
3. **阅读水平**: 综合理解准确率和阅读效率

### 连续学习天数计算

从最近学习日期开始，向前计算连续有学习记录的天数。

### 学习建议生成

基于学习时间、准确率、活动平衡性等多个维度生成个性化建议。

## 未来扩展

1. 更多学习活动类型支持
2. 更精细的能力评估算法
3. 社交功能和排行榜
4. 学习计划推荐
5. 数据导出和分析报告