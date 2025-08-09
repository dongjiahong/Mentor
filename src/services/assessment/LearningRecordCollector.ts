import { LearningModule, EnhancedLearningRecord } from '@/types/proficiency-assessment';

/**
 * 学习记录收集器
 * 为4个学习模块提供统一的数据收集接口
 */
export class LearningRecordCollector {
  
  /**
   * 记录阅读练习数据
   */
  public static async recordReading(data: {
    contentId?: number;
    totalQuestions: number;
    correctAnswers: number;
    readingTime: number; // 秒
    readingSpeed: number; // 字/分钟
    comprehensionScore: number; // 0-100
    highlightedWordsCount?: number;
    usedTranslation?: boolean;
    difficultyLevel?: string;
  }): Promise<void> {
    const accuracyScore = data.totalQuestions > 0 ? (data.correctAnswers / data.totalQuestions) * 100 : data.comprehensionScore;
    
    await this.saveRecord({
      module: 'reading',
      contentId: data.contentId,
      isCorrect: accuracyScore >= 60,
      accuracyScore,
      timeSpent: data.readingTime,
      difficultyLevel: data.difficultyLevel as any,
      metadata: {
        skillArea: 'comprehension',
        readingSpeed: data.readingSpeed,
        questionCount: data.totalQuestions,
        correctCount: data.correctAnswers,
        highlightedWords: data.highlightedWordsCount,
        usedTranslation: data.usedTranslation
      }
    });
  }

  /**
   * 记录听力练习数据
   */
  public static async recordListening(data: {
    contentId?: number;
    totalSegments: number;
    correctSegments: number;
    listeningTime: number; // 秒
    replayCount: number;
    finalScore: number; // 0-100
    playbackSpeed?: number; // 播放速度倍率
    usedSubtitles?: boolean;
    difficultyLevel?: string;
  }): Promise<void> {
    const accuracyScore = data.totalSegments > 0 ? (data.correctSegments / data.totalSegments) * 100 : data.finalScore;
    
    await this.saveRecord({
      module: 'listening',
      contentId: data.contentId,
      isCorrect: accuracyScore >= 60,
      accuracyScore,
      timeSpent: data.listeningTime,
      difficultyLevel: data.difficultyLevel as any,
      metadata: {
        skillArea: 'comprehension',
        segmentCount: data.totalSegments,
        correctCount: data.correctSegments,
        replayCount: data.replayCount,
        playbackSpeed: data.playbackSpeed,
        usedSubtitles: data.usedSubtitles
      }
    });
  }

  /**
   * 记录口语练习数据
   */
  public static async recordSpeaking(data: {
    contentId?: number;
    word?: string;
    originalText?: string;
    userAttempt?: string;
    pronunciationScore: number; // 0-100
    fluencyScore?: number; // 0-100
    completenessScore?: number; // 0-100
    practiceTime: number; // 秒
    attemptCount: number;
    difficultyLevel?: string;
  }): Promise<void> {
    // 综合评分：发音占60%，流利度占25%，完整度占15%
    const fluency = data.fluencyScore || 70;
    const completeness = data.completenessScore || 80;
    const overallScore = (data.pronunciationScore * 0.6) + (fluency * 0.25) + (completeness * 0.15);
    
    await this.saveRecord({
      module: 'speaking',
      contentId: data.contentId,
      word: data.word,
      userAnswer: data.userAttempt,
      correctAnswer: data.originalText,
      isCorrect: overallScore >= 60,
      accuracyScore: overallScore,
      timeSpent: data.practiceTime,
      difficultyLevel: data.difficultyLevel as any,
      metadata: {
        skillArea: 'pronunciation',
        pronunciationScore: data.pronunciationScore,
        fluencyScore: data.fluencyScore,
        completenessScore: data.completenessScore,
        attemptCount: data.attemptCount
      }
    });
  }

  /**
   * 记录写作练习数据
   */
  public static async recordWriting(data: {
    contentId?: number;
    prompt?: string;
    userEssay?: string;
    grammarScore: number; // 0-100
    vocabularyScore: number; // 0-100
    coherenceScore: number; // 0-100
    creativityScore?: number; // 0-100
    wordCount: number;
    writingTime: number; // 秒
    difficultyLevel?: string;
  }): Promise<void> {
    // 综合评分：语法35%，词汇25%，连贯性30%，创意10%
    const creativity = data.creativityScore || 70;
    const overallScore = (data.grammarScore * 0.35) + (data.vocabularyScore * 0.25) + 
                        (data.coherenceScore * 0.3) + (creativity * 0.1);
    
    await this.saveRecord({
      module: 'writing',
      contentId: data.contentId,
      question: data.prompt,
      userAnswer: data.userEssay,
      isCorrect: overallScore >= 60,
      accuracyScore: overallScore,
      timeSpent: data.writingTime,
      difficultyLevel: data.difficultyLevel as any,
      metadata: {
        skillArea: 'composition',
        grammarScore: data.grammarScore,
        vocabularyScore: data.vocabularyScore,
        coherenceScore: data.coherenceScore,
        creativityScore: data.creativityScore,
        wordCount: data.wordCount,
        writingSpeed: data.wordCount / (data.writingTime / 60) // 字/分钟
      }
    });
  }

  /**
   * 记录单词查询/翻译活动
   */
  public static async recordTranslation(data: {
    word: string;
    fromLanguage: string;
    toLanguage: string;
    lookupTime: number; // 秒
    addedToWordbook?: boolean;
    contentId?: number;
  }): Promise<void> {
    // 翻译活动没有准确率概念，统一记为80分表示成功查询
    await this.saveRecord({
      module: 'reading', // 翻译通常在阅读时发生
      contentId: data.contentId,
      word: data.word,
      isCorrect: true,
      accuracyScore: 80,
      timeSpent: data.lookupTime,
      metadata: {
        skillArea: 'vocabulary',
        activityType: 'translation',
        fromLanguage: data.fromLanguage,
        toLanguage: data.toLanguage,
        addedToWordbook: data.addedToWordbook
      }
    });
  }

  /**
   * 保存记录到数据库
   */
  private static async saveRecord(record: Omit<EnhancedLearningRecord, 'id' | 'createdAt'>): Promise<void> {
    try {
      const response = await fetch('/api/learning-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'record_enhanced_activity',
          data: {
            module: record.module,
            contentId: record.contentId,
            word: record.word,
            question: record.question,
            userAnswer: record.userAnswer,
            correctAnswer: record.correctAnswer,
            isCorrect: record.isCorrect,
            accuracyScore: record.accuracyScore,
            timeSpent: record.timeSpent,
            difficultyLevel: record.difficultyLevel,
            metadata: record.metadata
          }
        })
      });

      if (!response.ok) {
        console.error('Failed to save learning record:', await response.text());
      }
    } catch (error) {
      console.error('Error saving learning record:', error);
    }
  }

  /**
   * 批量记录多个练习结果（用于复杂练习场景）
   */
  public static async recordBatch(records: Array<{
    module: LearningModule;
    isCorrect: boolean;
    accuracyScore: number;
    timeSpent: number;
    metadata?: any;
  }>): Promise<void> {
    try {
      const response = await fetch('/api/learning-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'record_batch_activities',
          data: { records }
        })
      });

      if (!response.ok) {
        console.error('Failed to save batch learning records:', await response.text());
      }
    } catch (error) {
      console.error('Error saving batch learning records:', error);
    }
  }

  /**
   * 获取实时准确率统计（用于界面显示）
   */
  public static async getRealtimeStats(module: LearningModule): Promise<{
    todayAccuracy: number;
    weekAccuracy: number;
    totalAttempts: number;
    recentTrend: 'up' | 'down' | 'stable';
  }> {
    try {
      const response = await fetch('/api/learning-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_module_stats',
          data: { module }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching realtime stats:', error);
      return {
        todayAccuracy: 0,
        weekAccuracy: 0,
        totalAttempts: 0,
        recentTrend: 'stable'
      };
    }
  }
}