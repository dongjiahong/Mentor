import { useState, useCallback, useEffect } from 'react';
import { ReadingPracticeContent, ReadingQuestion } from '@/types';
import { LearningRecordCollector } from '@/services/assessment/LearningRecordCollector';

export interface ReadingState {
  currentQuestionIndex: number;
  userAnswers: Map<string, {
    answer: string;
    isCorrect?: boolean;
    timeSpent: number;
  }>;
  showTranslation: boolean;
  readingStartTime: number;
  questionStartTime: number;
  highlightedWords: Set<string>;
  readingSpeed: number; // 字/分钟
  comprehensionScore: number;
  readingTime: number;
  showResults: boolean;
}

export interface UseReadingSessionReturn {
  readingState: ReadingState;
  selectedWord: string;
  setSelectedWord: (word: string) => void;
  toggleTranslation: () => void;
  handleWordHighlight: (word: string) => void;
  handleAnswerSubmit: (questionId: string, answer: string) => void;
  calculateFinalScore: () => void;
  restartReading: () => void;
  nextQuestion: () => void;
  goToQuestion: (index: number) => void;
  getReadingSpeedLevel: () => { level: string; color: string };
  getSessionStats: () => any;
  finishReading: () => Promise<void>;
  formatTime: (seconds: number) => string;
  handleWordClick: (word: string, event: React.MouseEvent) => { cleanWord: string; position: { x: number; y: number } };
  playText: (text: string, speechSupported: boolean, speak: (text: string, options?: any) => void) => void;
  clearSelectedWord: () => void;
}

/**
 * 阅读会话状态管理Hook
 */
export function useReadingSession(content: ReadingPracticeContent): UseReadingSessionReturn {
  const [readingState, setReadingState] = useState<ReadingState>({
    currentQuestionIndex: 0,
    userAnswers: new Map(),
    showTranslation: false,
    readingStartTime: Date.now(),
    questionStartTime: Date.now(),
    highlightedWords: new Set(),
    readingSpeed: 0,
    comprehensionScore: 0,
    readingTime: 0,
    showResults: false
  });

  const [selectedWord, setSelectedWord] = useState<string>('');

  // 计算阅读时间
  useEffect(() => {
    const interval = setInterval(() => {
      const newReadingTime = Math.floor((Date.now() - readingState.readingStartTime) / 1000);
      setReadingState(prev => ({ ...prev, readingTime: newReadingTime }));
    }, 1000);

    return () => clearInterval(interval);
  }, [readingState.readingStartTime]);

  // 计算阅读速度
  const currentSpeed = readingState.readingTime > 0 && content.wordCount > 0 
    ? (content.wordCount / readingState.readingTime) * 60 
    : 0;

  useEffect(() => {
    if (Math.abs(currentSpeed - readingState.readingSpeed) > 1) {
      setReadingState(prev => ({ ...prev, readingSpeed: currentSpeed }));
    }
  }, [currentSpeed, readingState.readingSpeed]);

  // 切换翻译显示
  const toggleTranslation = useCallback(() => {
    setReadingState(prev => ({ ...prev, showTranslation: !prev.showTranslation }));
  }, []);

  // 处理单词高亮
  const handleWordHighlight = useCallback((word: string) => {
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    setReadingState(prev => {
      if (prev.highlightedWords.has(cleanWord)) {
        return prev;
      }
      return {
        ...prev,
        highlightedWords: new Set(prev.highlightedWords).add(cleanWord)
      };
    });
  }, []);

  // 处理答案提交
  const handleAnswerSubmit = useCallback((questionId: string, answer: string) => {
    const question = content.questions?.[readingState.currentQuestionIndex];
    if (!question) return;

    const timeSpent = Date.now() - readingState.questionStartTime;
    const isCorrect = question.correctAnswer.toLowerCase().trim() === answer.toLowerCase().trim();

    setReadingState(prev => ({
      ...prev,
      userAnswers: new Map(prev.userAnswers.set(questionId, {
        answer,
        isCorrect,
        timeSpent
      }))
    }));

    // 自动进入下一题或显示结果
    setTimeout(() => {
      if (readingState.currentQuestionIndex < (content.questions?.length || 0) - 1) {
        nextQuestion();
      } else {
        calculateFinalScore();
        setReadingState(prev => ({ ...prev, showResults: true }));
      }
    }, 1500);
  }, [content.questions, readingState.currentQuestionIndex, readingState.questionStartTime]);

  // 计算最终得分
  const calculateFinalScore = useCallback(() => {
    if (!content.questions || content.questions.length === 0) {
      setReadingState(prev => ({ ...prev, comprehensionScore: 80 })); // 纯阅读给个基础分
      return;
    }

    const totalQuestions = content.questions.length;
    const correctAnswers = Array.from(readingState.userAnswers.values())
      .filter(answer => answer.isCorrect).length;
    
    const baseScore = (correctAnswers / totalQuestions) * 100;
    
    // 根据阅读速度调整分数
    let speedBonus = 0;
    if (readingState.readingSpeed >= 200) speedBonus = 10;
    else if (readingState.readingSpeed >= 150) speedBonus = 5;

    const finalScore = Math.min(100, Math.round(baseScore + speedBonus));
    setReadingState(prev => ({ ...prev, comprehensionScore: finalScore }));
  }, [content.questions, readingState.userAnswers, readingState.readingSpeed]);

  // 重新开始阅读
  const restartReading = useCallback(() => {
    setReadingState({
      currentQuestionIndex: 0,
      userAnswers: new Map(),
      showTranslation: false,
      readingStartTime: Date.now(),
      questionStartTime: Date.now(),
      highlightedWords: new Set(),
      readingSpeed: 0,
      comprehensionScore: 0,
      readingTime: 0,
      showResults: false
    });
    setSelectedWord('');
  }, []);

  // 下一题
  const nextQuestion = useCallback(() => {
    setReadingState(prev => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      questionStartTime: Date.now()
    }));
  }, []);

  // 跳转到指定题目
  const goToQuestion = useCallback((index: number) => {
    setReadingState(prev => ({
      ...prev,
      currentQuestionIndex: index,
      questionStartTime: Date.now()
    }));
  }, []);

  // 获取阅读速度等级
  const getReadingSpeedLevel = useCallback(() => {
    if (readingState.readingSpeed >= 250) return { level: '快速', color: 'text-green-600' };
    if (readingState.readingSpeed >= 200) return { level: '良好', color: 'text-blue-600' };
    if (readingState.readingSpeed >= 150) return { level: '一般', color: 'text-yellow-600' };
    return { level: '需要提升', color: 'text-red-600' };
  }, [readingState.readingSpeed]);

  // 格式化时间
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }, []);

  // 处理单词点击（返回处理后的数据，让组件决定如何使用）
  const handleWordClick = useCallback((word: string, event: React.MouseEvent) => {
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    setSelectedWord(cleanWord);
    handleWordHighlight(cleanWord);
    
    return {
      cleanWord,
      position: { x: event.clientX, y: event.clientY }
    };
  }, [setSelectedWord, handleWordHighlight]);

  // 播放文本语音
  const playText = useCallback((text: string, speechSupported: boolean, speak: (text: string, options?: any) => void) => {
    if (speechSupported) {
      speak(text, { rate: 0.9, pitch: 1.0 });
    }
  }, []);

  // 清除选中词汇
  const clearSelectedWord = useCallback(() => {
    setSelectedWord('');
  }, [setSelectedWord]);

  // 获取会话统计数据
  const getSessionStats = useCallback(() => {
    const totalQuestions = content.questions?.length || 0;
    const answeredQuestions = readingState.userAnswers.size;
    const correctAnswers = Array.from(readingState.userAnswers.values()).filter(a => a.isCorrect).length;
    const totalTimeSpent = Date.now() - readingState.readingStartTime;
    
    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      accuracyScore: readingState.comprehensionScore,
      readingTime: readingState.readingTime,
      readingSpeed: readingState.readingSpeed,
      timeSpent: totalTimeSpent,
      highlightedWordsCount: readingState.highlightedWords.size,
      showedTranslation: readingState.showTranslation
    };
  }, [content.questions, readingState]);

  // 完成阅读练习时记录数据
  const finishReading = useCallback(async () => {
    const stats = getSessionStats();
    
    try {
      await LearningRecordCollector.recordReading({
        contentId: content.id,
        totalQuestions: stats.totalQuestions,
        correctAnswers: stats.correctAnswers,
        readingTime: stats.readingTime,
        readingSpeed: stats.readingSpeed,
        comprehensionScore: stats.accuracyScore,
        highlightedWordsCount: stats.highlightedWordsCount,
        usedTranslation: stats.showedTranslation,
        difficultyLevel: content.difficultyLevel
      });
    } catch (error) {
      console.error('Failed to record reading data:', error);
    }
  }, [content, getSessionStats]);

  return {
    readingState,
    selectedWord,
    setSelectedWord,
    toggleTranslation,
    handleWordHighlight,
    handleAnswerSubmit,
    calculateFinalScore,
    restartReading,
    nextQuestion,
    goToQuestion,
    getReadingSpeedLevel,
    getSessionStats,
    finishReading,
    formatTime,
    handleWordClick,
    playText,
    clearSelectedWord
  };
}