import { useState, useCallback, useEffect } from 'react';
import { WritingPracticeContent, WritingScore } from '@/types';
import { WritingEvaluationService } from '@/services/practice/writing/WritingEvaluationService';
import { getWordCount } from '@/lib/writingUtils';

export interface WritingState {
  currentContent: string;
  wordCount: number;
  timeSpent: number;
  startTime: number;
  status: 'draft' | 'submitted' | 'graded';
  score?: WritingScore;
  autoSaveTimer?: NodeJS.Timeout;
}

export interface UseWritingSessionReturn {
  writingState: WritingState;
  updateContent: (content: string) => void;
  submitWriting: () => void;
  restartWriting: () => void;
  saveDraft: () => void;
}

/**
 * 写作会话状态管理Hook
 */
export function useWritingSession(practiceContent: WritingPracticeContent): UseWritingSessionReturn {
  const [writingState, setWritingState] = useState<WritingState>({
    currentContent: '',
    wordCount: 0,
    timeSpent: 0,
    startTime: Date.now(),
    status: 'draft'
  });

  // 更新计时器
  useEffect(() => {
    const timer = setInterval(() => {
      setWritingState(prev => ({
        ...prev,
        timeSpent: Math.floor((Date.now() - prev.startTime) / 1000)
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 自动保存功能
  useEffect(() => {
    if (writingState.autoSaveTimer) {
      clearTimeout(writingState.autoSaveTimer);
    }

    const timer = setTimeout(() => {
      // 这里可以实现自动保存到localStorage或服务器
      console.log('自动保存草稿');
    }, 5000);

    setWritingState(prev => ({
      ...prev,
      autoSaveTimer: timer
    }));

    return () => {
      if (writingState.autoSaveTimer) {
        clearTimeout(writingState.autoSaveTimer);
      }
    };
  }, [writingState.currentContent]);

  // 更新内容
  const updateContent = useCallback((content: string) => {
    const wordCount = getWordCount(content);
    setWritingState(prev => ({
      ...prev,
      currentContent: content,
      wordCount
    }));
  }, []);

  // 提交写作
  const submitWriting = useCallback(() => {
    if (!writingState.currentContent.trim()) return;

    const score = WritingEvaluationService.evaluateWriting(writingState.currentContent, practiceContent);
    
    setWritingState(prev => ({
      ...prev,
      status: 'graded',
      score
    }));
  }, [writingState.currentContent, practiceContent]);

  // 重新开始
  const restartWriting = useCallback(() => {
    setWritingState({
      currentContent: '',
      wordCount: 0,
      timeSpent: 0,
      startTime: Date.now(),
      status: 'draft'
    });
  }, []);

  // 保存草稿
  const saveDraft = useCallback(() => {
    // 这里可以实现保存到localStorage或服务器的逻辑
    console.log('保存草稿');
  }, []);

  // 获取会话统计数据
  const getSessionStats = useCallback(() => {
    return {
      wordCount: writingState.wordCount,
      timeSpent: writingState.timeSpent * 1000, // 转换为毫秒以与其他模块保持一致
      accuracyScore: writingState.score?.totalScore || 0,
      status: writingState.status,
      scores: writingState.score ? {
        grammar: writingState.score.grammar,
        vocabulary: writingState.score.vocabulary,
        coherence: writingState.score.coherence,
        taskResponse: writingState.score.taskResponse,
        totalScore: writingState.score.totalScore
      } : null,
      practiceType: practiceContent.practiceType
    };
  }, [writingState, practiceContent.practiceType]);

  return {
    writingState,
    updateContent,
    submitWriting,
    restartWriting,
    saveDraft,
    getSessionStats
  };
}