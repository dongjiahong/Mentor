import { PronunciationScore, PronunciationMistake } from '@/types';

/**
 * 发音评估服务
 * 提供更精确的发音准确度评估算法
 */
export class PronunciationEvaluator {
  
  /**
   * 评估发音准确度
   */
  static evaluate(targetText: string, spokenText: string): PronunciationScore {
    if (!targetText.trim() || !spokenText.trim()) {
      return {
        overallScore: 0,
        accuracyScore: 0,
        fluencyScore: 0,
        pronunciationScore: 0,
        feedback: '无法评估：缺少文本内容',
        mistakes: []
      };
    }

    // 预处理文本
    const normalizedTarget = this.normalizeText(targetText);
    const normalizedSpoken = this.normalizeText(spokenText);

    // 计算各项评分
    const accuracyScore = this.calculateAccuracyScore(normalizedTarget, normalizedSpoken);
    const fluencyScore = this.calculateFluencyScore(normalizedTarget, normalizedSpoken);
    const pronunciationScore = this.calculatePronunciationScore(normalizedTarget, normalizedSpoken);
    
    // 计算总体评分
    const overallScore = Math.round((accuracyScore * 0.4 + fluencyScore * 0.3 + pronunciationScore * 0.3));

    // 生成反馈和错误分析
    const feedback = this.generateFeedback(overallScore, accuracyScore, fluencyScore, pronunciationScore);
    const mistakes = this.findMistakes(normalizedTarget, normalizedSpoken);

    return {
      overallScore,
      accuracyScore,
      fluencyScore,
      pronunciationScore,
      feedback,
      mistakes
    };
  }

  /**
   * 文本标准化处理
   */
  private static normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // 移除标点符号
      .replace(/\s+/g, ' ')    // 标准化空格
      .trim();
  }

  /**
   * 计算准确度评分
   * 基于单词匹配度和顺序正确性
   */
  private static calculateAccuracyScore(target: string, spoken: string): number {
    const targetWords = target.split(/\s+/).filter(w => w.length > 0);
    const spokenWords = spoken.split(/\s+/).filter(w => w.length > 0);

    if (targetWords.length === 0 && spokenWords.length === 0) return 100;
    if (targetWords.length === 0 || spokenWords.length === 0) return 0;

    // 计算单词级别的匹配度
    const wordMatches = this.calculateWordMatches(targetWords, spokenWords);
    
    // 计算位置匹配度（考虑单词顺序）
    const positionScore = this.calculatePositionScore(targetWords, spokenWords);
    
    // 计算长度匹配度
    const lengthScore = this.calculateLengthScore(targetWords.length, spokenWords.length);

    // 综合评分
    const accuracyScore = Math.round(wordMatches * 0.6 + positionScore * 0.3 + lengthScore * 0.1);
    
    return Math.max(0, Math.min(100, accuracyScore));
  }

  /**
   * 计算流利度评分
   * 基于语速、停顿和连贯性
   */
  private static calculateFluencyScore(target: string, spoken: string): number {
    const targetWords = target.split(/\s+/).filter(w => w.length > 0);
    const spokenWords = spoken.split(/\s+/).filter(w => w.length > 0);

    if (targetWords.length === 0) return 100;

    // 基础流利度基于长度比例
    const lengthRatio = spokenWords.length / targetWords.length;
    let fluencyScore = 100;

    // 长度偏差惩罚 - 更宽松的范围
    if (lengthRatio < 0.7 || lengthRatio > 1.5) {
      fluencyScore -= Math.abs(lengthRatio - 1) * 25;
    }

    // 重复单词惩罚
    const repetitionPenalty = this.calculateRepetitionPenalty(spokenWords);
    fluencyScore -= repetitionPenalty;

    // 不完整句子惩罚
    const incompletePenalty = this.calculateIncompletePenalty(targetWords, spokenWords);
    fluencyScore -= incompletePenalty;

    return Math.max(0, Math.min(100, Math.round(fluencyScore)));
  }

  /**
   * 计算发音评分
   * 基于音素相似度和常见发音错误
   */
  private static calculatePronunciationScore(target: string, spoken: string): number {
    const targetWords = target.split(/\s+/).filter(w => w.length > 0);
    const spokenWords = spoken.split(/\s+/).filter(w => w.length > 0);

    if (targetWords.length === 0) return 0;

    let totalScore = 0;
    let wordCount = 0;

    // 对每个单词计算发音相似度
    for (let i = 0; i < Math.min(targetWords.length, spokenWords.length); i++) {
      const wordScore = this.calculateWordPronunciationScore(targetWords[i], spokenWords[i]);
      totalScore += wordScore;
      wordCount++;
    }

    // 处理缺失或多余的单词
    const missingWords = Math.max(0, targetWords.length - spokenWords.length);
    const extraWords = Math.max(0, spokenWords.length - targetWords.length);
    
    // 缺失单词按0分计算
    totalScore += missingWords * 0;
    wordCount += missingWords;

    // 多余单词扣分
    totalScore -= extraWords * 20;

    const averageScore = wordCount > 0 ? totalScore / wordCount : 0;
    return Math.max(0, Math.min(100, Math.round(averageScore)));
  }

  /**
   * 计算单词匹配度
   */
  private static calculateWordMatches(targetWords: string[], spokenWords: string[]): number {
    if (targetWords.length === 0) return 100;

    let totalScore = 0;
    const maxLength = Math.max(targetWords.length, spokenWords.length);

    for (let i = 0; i < maxLength; i++) {
      const targetWord = targetWords[i] || '';
      const spokenWord = spokenWords[i] || '';

      if (targetWord && spokenWord) {
        const similarity = this.calculateWordSimilarity(targetWord, spokenWord);
        totalScore += similarity * 100;
      } else if (targetWord && !spokenWord) {
        // 缺失单词
        totalScore += 0;
      } else if (!targetWord && spokenWord) {
        // 多余单词，轻微扣分
        totalScore -= 10;
      }
    }

    return Math.max(0, totalScore / targetWords.length);
  }

  /**
   * 计算位置匹配度
   */
  private static calculatePositionScore(targetWords: string[], spokenWords: string[]): number {
    if (targetWords.length === 0) return 100;

    let correctPositions = 0;
    const minLength = Math.min(targetWords.length, spokenWords.length);

    for (let i = 0; i < minLength; i++) {
      const similarity = this.calculateWordSimilarity(targetWords[i], spokenWords[i]);
      if (similarity > 0.7) {
        correctPositions++;
      }
    }

    return (correctPositions / targetWords.length) * 100;
  }

  /**
   * 计算长度匹配度
   */
  private static calculateLengthScore(targetLength: number, spokenLength: number): number {
    if (targetLength === 0 && spokenLength === 0) return 100;
    if (targetLength === 0 || spokenLength === 0) return 0;

    const ratio = Math.min(targetLength, spokenLength) / Math.max(targetLength, spokenLength);
    return ratio * 100;
  }

  /**
   * 计算单词相似度
   */
  private static calculateWordSimilarity(word1: string, word2: string): number {
    if (word1 === word2) return 1.0;
    if (!word1 || !word2) return 0.0;

    // 使用编辑距离计算相似度
    const distance = this.levenshteinDistance(word1, word2);
    const maxLength = Math.max(word1.length, word2.length);
    
    if (maxLength === 0) return 1.0;
    
    const similarity = 1 - (distance / maxLength);
    
    // 对于长度相差很大的单词，降低相似度
    const lengthDiff = Math.abs(word1.length - word2.length);
    const lengthPenalty = lengthDiff / maxLength * 0.3;
    
    return Math.max(0, similarity - lengthPenalty);
  }

  /**
   * 计算编辑距离
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // 插入
          matrix[j - 1][i] + 1,     // 删除
          matrix[j - 1][i - 1] + indicator // 替换
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * 计算单词发音评分
   */
  private static calculateWordPronunciationScore(targetWord: string, spokenWord: string): number {
    if (targetWord === spokenWord) return 100;
    
    // 基于字符相似度的发音评分
    const similarity = this.calculateWordSimilarity(targetWord, spokenWord);
    
    // 考虑常见发音错误模式
    const pronunciationSimilarity = this.calculatePronunciationSimilarity(targetWord, spokenWord);
    
    // 综合评分
    const score = (similarity * 0.6 + pronunciationSimilarity * 0.4) * 100;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 计算发音相似度（考虑常见发音错误）
   */
  private static calculatePronunciationSimilarity(word1: string, word2: string): number {
    // 常见发音混淆对
    const confusionPairs = [
      ['b', 'p'], ['d', 't'], ['g', 'k'],
      ['v', 'f'], ['z', 's'], ['th', 's'],
      ['l', 'r'], ['n', 'm'], ['sh', 's'],
      ['ch', 'sh'], ['j', 'ch'], ['w', 'v']
    ];

    let word1Normalized = word1.toLowerCase();
    let word2Normalized = word2.toLowerCase();

    // 应用发音规则转换
    for (const [sound1, sound2] of confusionPairs) {
      word1Normalized = word1Normalized.replace(new RegExp(sound1, 'g'), sound2);
      word2Normalized = word2Normalized.replace(new RegExp(sound1, 'g'), sound2);
    }

    return this.calculateWordSimilarity(word1Normalized, word2Normalized);
  }

  /**
   * 计算重复单词惩罚
   */
  private static calculateRepetitionPenalty(words: string[]): number {
    const wordCount = new Map<string, number>();
    
    for (const word of words) {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    }

    let penalty = 0;
    for (const [, count] of wordCount) {
      if (count > 1) {
        penalty += (count - 1) * 10; // 每个重复单词扣10分
      }
    }

    return Math.min(penalty, 30); // 最多扣30分
  }

  /**
   * 计算不完整句子惩罚
   */
  private static calculateIncompletePenalty(targetWords: string[], spokenWords: string[]): number {
    if (targetWords.length === 0) return 0;
    
    const completeness = spokenWords.length / targetWords.length;
    
    if (completeness < 0.5) {
      return 40; // 完成度低于50%扣40分
    } else if (completeness < 0.8) {
      return 20; // 完成度低于80%扣20分
    }
    
    return 0;
  }

  /**
   * 找出发音错误
   */
  private static findMistakes(target: string, spoken: string): PronunciationMistake[] {
    const targetWords = target.split(/\s+/).filter(w => w.length > 0);
    const spokenWords = spoken.split(/\s+/).filter(w => w.length > 0);
    
    const mistakes: PronunciationMistake[] = [];
    const maxLength = Math.max(targetWords.length, spokenWords.length);

    for (let i = 0; i < maxLength && mistakes.length < 5; i++) {
      const targetWord = targetWords[i] || '';
      const spokenWord = spokenWords[i] || '';

      if (targetWord && spokenWord) {
        const similarity = this.calculateWordSimilarity(targetWord, spokenWord);
        
        if (similarity < 0.8) { // 降低阈值，更容易检测错误
          mistakes.push({
            word: spokenWord,
            expected: targetWord,
            actual: spokenWord,
            suggestion: this.generateWordSuggestion(targetWord, spokenWord)
          });
        }
      } else if (targetWord && !spokenWord) {
        mistakes.push({
          word: targetWord,
          expected: targetWord,
          actual: '',
          suggestion: `缺少单词 "${targetWord}"`
        });
      } else if (!targetWord && spokenWord) {
        mistakes.push({
          word: spokenWord,
          expected: '',
          actual: spokenWord,
          suggestion: `多余的单词 "${spokenWord}"`
        });
      }
    }

    return mistakes;
  }

  /**
   * 生成单词建议
   */
  private static generateWordSuggestion(expected: string, actual: string): string {
    if (!actual) {
      return `应该说 "${expected}"`;
    }

    const similarity = this.calculateWordSimilarity(expected, actual);
    
    if (similarity > 0.5) {
      return `"${actual}" 接近正确，应该是 "${expected}"`;
    } else {
      return `"${actual}" 不正确，应该是 "${expected}"`;
    }
  }

  /**
   * 生成综合反馈
   */
  private static generateFeedback(
    overallScore: number,
    accuracyScore: number,
    fluencyScore: number,
    pronunciationScore: number
  ): string {
    const feedbacks: string[] = [];

    // 总体评价
    if (overallScore >= 90) {
      feedbacks.push("发音非常出色！");
    } else if (overallScore >= 80) {
      feedbacks.push("发音很好，继续保持！");
    } else if (overallScore >= 70) {
      feedbacks.push("发音基本正确，还有提升空间。");
    } else if (overallScore >= 60) {
      feedbacks.push("发音需要改进。");
    } else {
      feedbacks.push("发音需要大幅改进。");
    }

    // 具体建议
    if (accuracyScore < 70) {
      feedbacks.push("注意单词的准确性，建议多听标准发音。");
    }

    if (fluencyScore < 70) {
      feedbacks.push("说话要更流利，避免过多停顿和重复。");
    }

    if (pronunciationScore < 70) {
      feedbacks.push("注意发音技巧，特别是容易混淆的音素。");
    }

    // 练习建议
    if (overallScore < 80) {
      feedbacks.push("建议多练习跟读，从慢速开始逐渐提高。");
    }

    return feedbacks.join(" ");
  }
}