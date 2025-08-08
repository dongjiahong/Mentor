import { WritingPracticeContent, WritingScore, DEFAULT_WRITING_RUBRIC } from '@/types';

export class WritingEvaluationService {
  /**
   * 评估写作内容并返回评分结果
   */
  static evaluateWriting(content: string, practiceContent: WritingPracticeContent): WritingScore {
    const wordCount = content.trim().split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const rubric = practiceContent.rubric || DEFAULT_WRITING_RUBRIC;
    const criteriaScores = rubric.criteria.map(criterion => {
      let score = 0;
      const maxScore = criterion.maxPoints;

      switch (criterion.id) {
        case 'content':
          score = this.evaluateContent(content, practiceContent, maxScore);
          break;
        case 'organization':
          score = this.evaluateOrganization(content, maxScore);
          break;
        case 'grammar':
          score = this.evaluateGrammar(content, sentences, maxScore);
          break;
        case 'vocabulary':
          score = this.evaluateVocabulary(content, maxScore);
          break;
        case 'mechanics':
          score = this.evaluateMechanics(content, sentences, maxScore);
          break;
        default:
          score = maxScore * 0.75; // 默认75%
      }

      return {
        criterionId: criterion.id,
        score: Math.round(score),
        maxScore,
        feedback: this.generateCriterionFeedback(criterion.id, score, maxScore)
      };
    });

    const totalScore = criteriaScores.reduce((sum, cs) => sum + cs.score, 0);
    const maxTotalScore = criteriaScores.reduce((sum, cs) => sum + cs.maxScore, 0);

    return {
      totalScore,
      maxScore: maxTotalScore,
      criteriaScores,
      overallFeedback: this.generateOverallFeedback(totalScore, maxTotalScore, wordCount, sentences.length),
      suggestions: this.generateSuggestions(content, practiceContent, criteriaScores),
      gradedAt: new Date()
    };
  }

  /**
   * 评估内容质量
   */
  private static evaluateContent(content: string, practiceContent: WritingPracticeContent, maxScore: number): number {
    let score = 0;
    const wordCount = content.trim().split(/\s+/).length;

    // 基于字数的评分
    if (practiceContent.wordLimit) {
      const lengthRatio = Math.min(wordCount / practiceContent.wordLimit, 1);
      score = maxScore * (0.5 + lengthRatio * 0.5);
    } else {
      score = maxScore * 0.8; // 默认给80%
    }

    // 关键词检查
    if (practiceContent.keywords) {
      const keywordCount = practiceContent.keywords.filter(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      const keywordBonus = (keywordCount / practiceContent.keywords.length) * maxScore * 0.2;
      score = Math.min(maxScore, score + keywordBonus);
    }

    return score;
  }

  /**
   * 评估文章结构
   */
  private static evaluateOrganization(content: string, maxScore: number): number {
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
    
    if (paragraphs.length >= 3) {
      return maxScore * 0.9; // 有清晰结构
    } else if (paragraphs.length >= 2) {
      return maxScore * 0.7;
    } else {
      return maxScore * 0.5;
    }
  }

  /**
   * 评估语法质量
   */
  private static evaluateGrammar(content: string, sentences: string[], maxScore: number): number {
    const commonErrors = [
      /\b(dont|wont|cant|shouldnt)\b/gi, // 缺少撇号
      /\b[a-z]/g, // 句首小写
      /[.!?]\s*[a-z]/g, // 句后小写
    ];

    let errorCount = 0;
    commonErrors.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) errorCount += matches.length;
    });

    const errorRate = errorCount / sentences.length;
    return maxScore * Math.max(0.4, 1 - errorRate * 0.5);
  }

  /**
   * 评估词汇使用
   */
  private static evaluateVocabulary(content: string, maxScore: number): number {
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    const vocabularyDiversity = uniqueWords.size / words.length;
    return maxScore * (0.3 + vocabularyDiversity * 0.7);
  }

  /**
   * 评估语言机制（标点、拼写等）
   */
  private static evaluateMechanics(content: string, sentences: string[], maxScore: number): number {
    const punctuationCount = (content.match(/[.!?:;,]/g) || []).length;
    const punctuationRatio = punctuationCount / sentences.length;
    return maxScore * Math.min(1, punctuationRatio);
  }

  /**
   * 生成单项评分反馈
   */
  private static generateCriterionFeedback(criterionId: string, score: number, maxScore: number): string {
    const percentage = (score / maxScore) * 100;

    const feedbacks = {
      content: {
        excellent: '内容丰富，观点明确，很好地回应了写作要求。',
        good: '内容基本完整，观点较为明确。',
        fair: '内容有所欠缺，建议补充更多细节和例子。',
        poor: '内容过于简单，需要更多支撑观点的内容。'
      },
      organization: {
        excellent: '文章结构清晰，逻辑流畅，段落安排合理。',
        good: '结构较为清晰，逻辑基本流畅。',
        fair: '结构需要改进，建议使用更清晰的段落划分。',
        poor: '结构混乱，需要重新组织文章逻辑。'
      },
      grammar: {
        excellent: '语法使用准确，句式多样。',
        good: '语法基本正确，偶有小错误。',
        fair: '存在一些语法错误，建议仔细检查。',
        poor: '语法错误较多，需要加强语法练习。'
      },
      vocabulary: {
        excellent: '词汇使用恰当且富有变化。',
        good: '词汇使用基本恰当。',
        fair: '词汇使用一般，可以尝试使用更多样的词汇。',
        poor: '词汇使用单调，需要扩大词汇量。'
      },
      mechanics: {
        excellent: '标点符号使用正确，拼写准确。',
        good: '标点和拼写基本正确。',
        fair: '标点或拼写有些小问题。',
        poor: '标点符号和拼写需要改进。'
      }
    };

    const criterion = feedbacks[criterionId as keyof typeof feedbacks];
    if (!criterion) return '评分完成。';

    if (percentage >= 90) return criterion.excellent;
    if (percentage >= 75) return criterion.good;
    if (percentage >= 60) return criterion.fair;
    return criterion.poor;
  }

  /**
   * 生成总体反馈
   */
  private static generateOverallFeedback(
    totalScore: number, 
    maxScore: number, 
    wordCount: number, 
    sentenceCount: number
  ): string {
    const percentage = (totalScore / maxScore) * 100;

    let feedback = '';
    if (percentage >= 90) {
      feedback = '优秀！这是一篇高质量的作文，各方面表现都很出色。';
    } else if (percentage >= 80) {
      feedback = '很好！作文质量不错，在个别方面还有提升空间。';
    } else if (percentage >= 70) {
      feedback = '良好！作文基本达到要求，建议在薄弱环节多加练习。';
    } else if (percentage >= 60) {
      feedback = '及格！作文有一定基础，但需要在多个方面进行改进。';
    } else {
      feedback = '需要改进。建议多读范文，加强基础写作技能练习。';
    }

    feedback += ` 全文共 ${wordCount} 词，${sentenceCount} 句。`;
    return feedback;
  }

  /**
   * 生成改进建议
   */
  private static generateSuggestions(
    content: string,
    practiceContent: WritingPracticeContent,
    criteriaScores: any[]
  ): string[] {
    const suggestions: string[] = [];

    // 基于评分结果给出建议
    criteriaScores.forEach(cs => {
      const percentage = (cs.score / cs.maxScore) * 100;
      if (percentage < 70) {
        switch (cs.criterionId) {
          case 'content':
            suggestions.push('尝试添加更多具体的例子和细节来支撑你的观点');
            break;
          case 'organization':
            suggestions.push('使用连接词（如however, therefore, in addition）来改善段落间的逻辑连接');
            break;
          case 'grammar':
            suggestions.push('写作完成后仔细检查语法，特别注意动词时态的一致性');
            break;
          case 'vocabulary':
            suggestions.push('尝试使用更丰富多样的词汇，避免重复使用相同的词语');
            break;
          case 'mechanics':
            suggestions.push('仔细检查标点符号和拼写，确保符合英语写作规范');
            break;
        }
      }
    });

    // 字数相关建议
    const wordCount = content.trim().split(/\s+/).length;
    if (practiceContent.wordLimit && wordCount < practiceContent.wordLimit * 0.8) {
      suggestions.push(`当前字数较少（${wordCount}词），建议扩展内容达到要求的${practiceContent.wordLimit}词`);
    }

    // 如果没有建议，给出通用建议
    if (suggestions.length === 0) {
      suggestions.push('继续保持良好的写作习惯，多读优秀范文来提升写作水平');
    }

    return suggestions.slice(0, 3); // 最多显示3条建议
  }
}