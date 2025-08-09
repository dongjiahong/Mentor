import { useState, useCallback, useEffect } from 'react';
import { 
  UniversalContent,
  VoiceAttempt,
  PronunciationScore,
  ContentSentence,
  ContentDialogue
} from '@/types';
import { LearningRecordCollector } from '@/services/assessment/LearningRecordCollector';

export interface PracticeState {
  currentIndex: number;
  attempts: Map<string, VoiceAttempt[]>;
  scores: Map<string, PronunciationScore>;
  mode: 'sentence' | 'dialogue';
}

export function useSpeakingSession(content: UniversalContent) {
  const [practiceState, setPracticeState] = useState<PracticeState>({
    currentIndex: 0,
    attempts: new Map(),
    scores: new Map(),
    mode: content.sentences && content.sentences.length > 0 ? 'sentence' : 'dialogue'
  });

  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionStartTime] = useState(Date.now());

  // 获取当前练习项
  const getCurrentItem = useCallback(() => {
    if (practiceState.mode === 'sentence' && content.sentences) {
      return content.sentences[practiceState.currentIndex];
    } else if (practiceState.mode === 'dialogue' && content.conversations) {
      const userConversations = content.conversations.filter(conv => conv.speaker === 'user');
      return userConversations[practiceState.currentIndex];
    }
    return null;
  }, [content, practiceState.currentIndex, practiceState.mode]);

  // 获取总项目数
  const getTotalItems = useCallback(() => {
    if (practiceState.mode === 'sentence' && content.sentences) {
      return content.sentences.length;
    } else if (practiceState.mode === 'dialogue' && content.conversations) {
      return content.conversations.filter(conv => conv.speaker === 'user').length;
    }
    return 0;
  }, [content, practiceState.mode]);

  // 评估发音
  const evaluatePronunciation = useCallback((originalText: string, spokenText: string, confidence: number): PronunciationScore => {
    // 简单的发音评分算法
    const original = originalText.toLowerCase().replace(/[^\w\s]/g, '');
    const spoken = spokenText.toLowerCase().replace(/[^\w\s]/g, '');
    
    const originalWords = original.split(' ');
    const spokenWords = spoken.split(' ');
    
    let correctWords = 0;
    const totalWords = originalWords.length;
    
    originalWords.forEach((word, index) => {
      if (spokenWords[index] && 
          (spokenWords[index] === word || 
           spokenWords[index].includes(word) ||
           word.includes(spokenWords[index]))) {
        correctWords++;
      }
    });

    const accuracy = totalWords > 0 ? (correctWords / totalWords) * 100 : 0;
    const overallScore = Math.min(100, accuracy + (confidence * 20));

    return {
      overallScore: Math.round(overallScore),
      accuracyScore: Math.round(accuracy),
      fluencyScore: Math.round(confidence * 100),
      pronunciationScore: Math.round(overallScore * 0.9),
      feedback: generateFeedback(overallScore),
      mistakes: findMistakes(originalWords, spokenWords)
    };
  }, []);

  // 生成反馈
  const generateFeedback = (overall: number): string => {
    if (overall >= 90) return '优秀！发音非常准确，语调自然流畅。';
    if (overall >= 80) return '很好！发音基本准确，继续保持。';
    if (overall >= 70) return '不错！发音还可以，注意个别单词的读音。';
    if (overall >= 60) return '需要改进。多练习单词发音，注意语调。';
    return '需要多加练习。建议先听范例，然后慢慢跟读。';
  };

  // 找出发音错误
  const findMistakes = (originalWords: string[], spokenWords: string[]) => {
    const mistakes = [];
    for (let i = 0; i < originalWords.length; i++) {
      const original = originalWords[i];
      const spoken = spokenWords[i];
      
      if (!spoken || (!spoken.includes(original) && !original.includes(spoken))) {
        mistakes.push({
          word: original,
          expected: original,
          actual: spoken || '[未识别]',
          suggestion: `请重点练习 "${original}" 的发音`
        });
      }
    }
    return mistakes.slice(0, 3);
  };

  // 记录尝试
  const recordAttempt = useCallback((transcript: string, confidence: number) => {
    const currentItem = getCurrentItem();
    if (!currentItem) return;

    const originalText = 'text' in currentItem ? currentItem.text : currentItem.expectedResponse || '';
    
    const attempt: VoiceAttempt = {
      id: Date.now().toString(),
      sentenceId: currentItem.id,
      originalText,
      spokenText: transcript,
      similarity: confidence * 100,
      timestamp: new Date(),
      pronunciationScore: evaluatePronunciation(originalText, transcript, confidence)
    };

    setPracticeState(prev => {
      const newAttempts = new Map(prev.attempts);
      const itemAttempts = newAttempts.get(currentItem.id) || [];
      newAttempts.set(currentItem.id, [...itemAttempts, attempt]);

      const newScores = new Map(prev.scores);
      newScores.set(currentItem.id, attempt.pronunciationScore!);

      return {
        ...prev,
        attempts: newAttempts,
        scores: newScores
      };
    });

    setShowFeedback(true);
  }, [getCurrentItem, evaluatePronunciation]);

  // 导航功能
  const nextItem = useCallback(() => {
    const totalItems = getTotalItems();
    if (practiceState.currentIndex < totalItems - 1) {
      setPracticeState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1
      }));
      setShowFeedback(false);
    }
  }, [practiceState.currentIndex, getTotalItems]);

  const previousItem = useCallback(() => {
    if (practiceState.currentIndex > 0) {
      setPracticeState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1
      }));
      setShowFeedback(false);
    }
  }, [practiceState.currentIndex]);

  const retryItem = useCallback(() => {
    setShowFeedback(false);
  }, []);

  // 计算总体得分
  const calculateOverallScore = useCallback(() => {
    const scores = Array.from(practiceState.scores.values());
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score.overallScore, 0) / scores.length);
  }, [practiceState.scores]);

  // 获取会话统计数据
  const getSessionStats = useCallback(() => {
    const totalItems = getTotalItems();
    const completedItems = practiceState.scores.size;
    const scores = Array.from(practiceState.scores.values());
    const attempts = Array.from(practiceState.attempts.values()).flat();
    
    const overallScore = calculateOverallScore();
    const totalTimeSpent = Date.now() - sessionStartTime;
    const totalAttempts = attempts.length;
    
    return {
      totalItems,
      completedItems,
      accuracyScore: overallScore,
      timeSpent: totalTimeSpent,
      totalAttempts,
      averageAttemptsPerItem: totalItems > 0 ? totalAttempts / totalItems : 0,
      pronunciationScores: scores.map(s => ({
        accuracyScore: s.accuracyScore,
        fluencyScore: s.fluencyScore,
        pronunciationScore: s.pronunciationScore,
        overallScore: s.overallScore
      })),
      mode: practiceState.mode
    };
  }, [practiceState, getTotalItems, calculateOverallScore, sessionStartTime]);

  // 完成口语练习时记录数据
  const finishSpeaking = useCallback(async () => {
    const stats = getSessionStats();
    const attempts = Array.from(practiceState.attempts.values()).flat();
    
    try {
      // 批量记录每个尝试
      for (const attempt of attempts) {
        await LearningRecordCollector.recordSpeaking({
          contentId: content.id,
          word: attempt.originalText.split(' ').length <= 2 ? attempt.originalText : undefined,
          originalText: attempt.originalText,
          userAttempt: attempt.spokenText,
          pronunciationScore: attempt.pronunciationScore?.pronunciationScore || 0,
          fluencyScore: attempt.pronunciationScore?.fluencyScore || 0,
          completenessScore: attempt.pronunciationScore?.accuracyScore || 0,
          practiceTime: Math.round(stats.timeSpent / stats.totalAttempts / 1000), // 平均每次尝试时间
          attemptCount: 1,
          difficultyLevel: content.difficultyLevel
        });
      }
    } catch (error) {
      console.error('Failed to record speaking data:', error);
    }
  }, [content, practiceState.attempts, getSessionStats]);

  return {
    // State
    practiceState,
    showFeedback,
    sessionStartTime,

    // Computed
    currentItem: getCurrentItem(),
    totalItems: getTotalItems(),
    overallScore: calculateOverallScore(),
    currentScore: practiceState.scores.get(getCurrentItem()?.id || ''),
    currentAttempts: practiceState.attempts.get(getCurrentItem()?.id || '') || [],

    // Actions
    recordAttempt,
    nextItem,
    previousItem,
    retryItem,
    setShowFeedback,
    getSessionStats,
    finishSpeaking
  };
}