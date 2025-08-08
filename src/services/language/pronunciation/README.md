# 发音评估系统

## 概述

发音评估系统是英语学习助手的核心功能之一，通过分析用户的语音识别结果与目标文本的差异，提供准确的发音评分和改进建议。

## 核心功能

### 1. 发音准确度评估

系统通过以下维度评估用户的发音：

- **准确度评分 (Accuracy Score)**: 基于单词匹配度和顺序正确性
- **流利度评分 (Fluency Score)**: 基于语速、停顿和连贯性
- **发音评分 (Pronunciation Score)**: 基于音素相似度和常见发音错误

### 2. 智能文本分析

- **文本标准化**: 自动处理大小写、标点符号和多余空格
- **单词相似度计算**: 使用编辑距离算法计算单词相似度
- **发音模式识别**: 识别常见的发音混淆对（如 l/r, b/p 等）

### 3. 错误检测与建议

- **缺失单词检测**: 识别用户遗漏的单词
- **多余单词检测**: 识别用户添加的不必要单词
- **发音错误分析**: 提供具体的改进建议
- **重复单词惩罚**: 检测并惩罚重复发音

## 技术实现

### PronunciationEvaluator 类

```typescript
class PronunciationEvaluator {
  static evaluate(targetText: string, spokenText: string): PronunciationScore
}
```

#### 主要方法

1. **normalizeText()**: 文本预处理和标准化
2. **calculateAccuracyScore()**: 计算准确度评分
3. **calculateFluencyScore()**: 计算流利度评分
4. **calculatePronunciationScore()**: 计算发音评分
5. **findMistakes()**: 检测发音错误
6. **generateFeedback()**: 生成改进建议

### 评分算法

#### 准确度评分 (40% 权重)
- 单词匹配度 (60%)
- 位置匹配度 (30%)
- 长度匹配度 (10%)

#### 流利度评分 (30% 权重)
- 长度比例评估
- 重复单词惩罚
- 完整性评估

#### 发音评分 (30% 权重)
- 字符相似度分析
- 发音模式匹配
- 常见错误识别

## 使用示例

### 基本使用

```typescript
import { PronunciationEvaluator } from '@/services/pronunciation/PronunciationEvaluator';

const targetText = "Hello world";
const spokenText = "Helo word";

const score = PronunciationEvaluator.evaluate(targetText, spokenText);

console.log(score.overallScore);      // 总体评分
console.log(score.accuracyScore);     // 准确度评分
console.log(score.fluencyScore);      // 流利度评分
console.log(score.pronunciationScore); // 发音评分
console.log(score.feedback);          // 反馈建议
console.log(score.mistakes);          // 错误详情
```

### 在组件中使用

```typescript
import { PronunciationPractice } from '@/components/features/PronunciationPractice';

<PronunciationPractice
  targetText="Hello world"
  practiceType="sentence"
  difficulty="medium"
  showDetailedAnalysis={true}
  onScoreUpdate={(score) => console.log(score)}
  onComplete={(finalScore) => console.log('完成:', finalScore)}
/>
```

## 评分标准

| 分数范围 | 等级 | 描述 |
|---------|------|------|
| 90-100  | A    | 优秀 - 发音非常准确 |
| 80-89   | B    | 良好 - 发音很好，少数改进 |
| 70-79   | C    | 及格 - 发音基本正确 |
| 60-69   | D    | 需改进 - 发音需要改进 |
| 0-59    | F    | 不及格 - 发音需要大幅改进 |

## 常见发音错误处理

系统能够识别和处理以下常见发音错误：

1. **辅音混淆**: b/p, d/t, g/k, v/f, z/s
2. **元音问题**: 长短元音区别
3. **音节缺失**: 单词中音节的遗漏
4. **重音错误**: 单词重音位置错误
5. **连读问题**: 单词间的连读处理

## 性能优化

- **算法复杂度**: O(n*m) 其中 n, m 为文本长度
- **内存使用**: 最小化中间变量存储
- **错误限制**: 最多显示5个错误，避免信息过载
- **缓存机制**: 相同文本的评估结果可以缓存

## 测试覆盖

系统包含完整的单元测试，覆盖以下场景：

- 完全匹配文本
- 部分匹配文本
- 缺失单词
- 多余单词
- 发音错误
- 边界情况
- 性能测试

运行测试：
```bash
yarn vitest run src/services/pronunciation/__tests__/PronunciationEvaluator.test.ts
```

## 未来改进

1. **机器学习集成**: 使用深度学习模型提高评估准确性
2. **语音特征分析**: 直接分析音频特征而非文本
3. **个性化评估**: 根据用户历史表现调整评分标准
4. **多语言支持**: 扩展到其他语言的发音评估
5. **实时反馈**: 提供实时的发音指导

## 相关文件

- `PronunciationEvaluator.ts` - 核心评估算法
- `PronunciationPractice.tsx` - 发音练习组件
- `VoiceRecorder.tsx` - 语音录制组件
- `PronunciationTestPage.tsx` - 测试页面
- `PronunciationEvaluator.test.ts` - 单元测试