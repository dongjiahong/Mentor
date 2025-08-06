import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  VoiceLearningMode, 
  VoiceLearningSession, 
  VoiceAttempt, 
  VoicePracticeContent,
  VoicePracticeSentence,
  DialoguePracticeScenario,
  PronunciationScore,
  AppError 
} from '@/types';
import { useVoiceRecognition } from './useVoiceRecognition';
import { useSpeech } from './useSpeech';
import { PronunciationEvaluator } from '@/services/pronunciation/PronunciationEvaluator';

export interface VoiceLearningState {
  mode: VoiceLearningMode | null;
  currentContent: VoicePracticeContent | DialoguePracticeScenario | null;
  currentSession: VoiceLearningSession | null;
  currentSentenceIndex: number;
  isActive: boolean;
  isLoading: boolean;
  error: AppError | null;
}

export interface VoiceLearningProgress {
  totalSentences: number;
  completedSentences: number;
  averageScore: number;
  bestScore: number;
  totalAttempts: number;
  sessionDuration: number; // 秒
}

export interface UseVoiceLearningOptions {
  onSessionStart?: (session: VoiceLearningSession) => void;
  onSessionComplete?: (session: VoiceLearningSession) => void;
  onAttemptComplete?: (attempt: VoiceAttempt) => void;
  onError?: (error: AppError) => void;
  autoAdvance?: boolean; // 是否自动进入下一句
  minScoreToAdvance?: number; // 自动进入下一句的最低分数
}

export interface UseVoiceLearningReturn {
  // 状态
  state: VoiceLearningState;
  progress: VoiceLearningProgress;
  currentSentence: VoicePracticeSentence | null;
  
  // 控制方法
  startSession: (mode: VoiceLearningMode, content: VoicePracticeContent | DialoguePracticeScenario) => void;
  endSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  
  // 句子导航
  nextSentence: () => void;
  previousSentence: () => void;
  goToSentence: (index: number) => void;
  
  // 语音交互
  playCurrentSentence: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  
  // 练习控制
  retryCurrentSentence: () => void;
  skipCurrentSentence: () => void;
  
  // 语音识别状态
  isRecording: boolean;
  recognitionResult: string | null;
  lastAttempt: VoiceAttempt | null;
}

export function useVoiceLearning(options: UseVoiceLearningOptions = {}): UseVoiceLearningReturn {
  const {
    onSessionStart,
    onSessionComplete,
    onAttemptComplete,
    onError,
    autoAdvance = true,
    minScoreToAdvance = 70
  } = options;

  // 状态管理
  const [state, setState] = useState<VoiceLearningState>({
    mode: null,
    currentContent: null,
    currentSession: null,
    currentSentenceIndex: 0,
    isActive: false,
    isLoading: false,
    error: null
  });

  const [lastAttempt, setLastAttempt] = useState<VoiceAttempt | null>(null);
  const sessionStartTimeRef = useRef<Date | null>(null);

  // 使用语音相关 Hooks
  const { speak } = useSpeech({ onError });
  const { 
    state: voiceState, 
    result: voiceResult, 
    startRecording: startVoiceRecording, 
    stopRecording: stopVoiceRecording,
    resetResult: resetVoiceResult
  } = useVoiceRecognition({
    onRecordingComplete: handleRecordingComplete,
    onError,
    timeout: 30000
  });

  // 处理录音完成
  async function handleRecordingComplete(spokenText: string) {
    if (!state.currentContent || !state.currentSession) return;

    const currentSentence = getCurrentSentence();
    if (!currentSentence) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // 创建语音尝试记录
      const attempt: VoiceAttempt = {
        id: `attempt_${Date.now()}`,
        sentenceId: currentSentence.id,
        originalText: currentSentence.text,
        spokenText: spokenText,
        similarity: calculateSimilarity(currentSentence.text, spokenText),
        timestamp: new Date()
      };

      // 如果是跟读模式，进行发音评估
      if (state.mode === 'follow_along') {
        try {
          const pronunciationScore = PronunciationEvaluator.evaluate(
            currentSentence.text, 
            spokenText
          );
          attempt.pronunciationScore = pronunciationScore;
          attempt.similarity = pronunciationScore.overallScore;
        } catch (error) {
          console.warn('发音评估失败:', error);
        }
      }

      setLastAttempt(attempt);

      // 更新会话记录
      setState(prev => ({
        ...prev,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          attempts: [...prev.currentSession.attempts, attempt]
        } : null,
        isLoading: false
      }));

      onAttemptComplete?.(attempt);

      // 自动进入下一句
      if (autoAdvance && attempt.similarity >= minScoreToAdvance) {
        setTimeout(() => {
          nextSentence();
        }, 1500); // 给用户时间查看结果
      }

    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false, error: error as AppError }));
      onError?.(error as AppError);
    }
  }

  // 计算文本相似度的简单实现
  function calculateSimilarity(original: string, spoken: string): number {
    const originalWords = original.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const spokenWords = spoken.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    
    if (originalWords.length === 0) return 0;
    
    let matches = 0;
    spokenWords.forEach(spokenWord => {
      if (originalWords.includes(spokenWord)) {
        matches++;
      }
    });
    
    return Math.round((matches / originalWords.length) * 100);
  }

  // 获取当前句子
  const getCurrentSentence = useCallback((): VoicePracticeSentence | null => {
    if (!state.currentContent) return null;
    
    // 处理 VoicePracticeContent 类型（句子练习）
    if ('sentences' in state.currentContent) {
      return state.currentContent.sentences[state.currentSentenceIndex] || null;
    }
    
    // 处理 DialoguePracticeScenario 类型（对话练习）
    if ('conversations' in state.currentContent) {
      const conversation = state.currentContent.conversations[state.currentSentenceIndex];
      if (!conversation) return null;
      
      // 将对话项转换为句子格式
      return {
        id: conversation.id,
        text: conversation.text || conversation.expectedResponse || '',
        translation: conversation.translation || '',
        difficulty: 2, // 默认难度
        phonetic: undefined,
        tips: conversation.speaker === 'user' ? 
          `请用英语回应：${conversation.hints?.[0] || ''}` : 
          undefined
      } as VoicePracticeSentence;
    }
    
    return null;
  }, [state.currentContent, state.currentSentenceIndex]);

  // 计算学习进度
  const progress: VoiceLearningProgress = {
    totalSentences: state.currentContent ? 
      ('sentences' in state.currentContent ? state.currentContent.sentences.length :
       'conversations' in state.currentContent ? state.currentContent.conversations.length : 0) : 0,
    completedSentences: state.currentSession?.attempts.length || 0,
    averageScore: state.currentSession?.attempts.length 
      ? Math.round(state.currentSession.attempts.reduce((sum, attempt) => sum + attempt.similarity, 0) / state.currentSession.attempts.length)
      : 0,
    bestScore: state.currentSession?.attempts.length 
      ? Math.max(...state.currentSession.attempts.map(attempt => attempt.similarity))
      : 0,
    totalAttempts: state.currentSession?.attempts.length || 0,
    sessionDuration: sessionStartTimeRef.current 
      ? Math.floor((Date.now() - sessionStartTimeRef.current.getTime()) / 1000)
      : 0
  };

  // 开始学习会话
  const startSession = useCallback((mode: VoiceLearningMode, content: VoicePracticeContent | DialoguePracticeScenario) => {
    const session: VoiceLearningSession = {
      id: `session_${Date.now()}`,
      mode,
      contentId: content.id,
      startTime: new Date(),
      attempts: [],
      completed: false
    };

    sessionStartTimeRef.current = new Date();
    setLastAttempt(null);
    resetVoiceResult();

    setState({
      mode,
      currentContent: content,
      currentSession: session,
      currentSentenceIndex: 0,
      isActive: true,
      isLoading: false,
      error: null
    });

    onSessionStart?.(session);
  }, [onSessionStart, resetVoiceResult]);

  // 结束学习会话
  const endSession = useCallback(() => {
    if (state.currentSession) {
      const completedSession: VoiceLearningSession = {
        ...state.currentSession,
        endTime: new Date(),
        completed: true,
        totalScore: progress.averageScore
      };

      onSessionComplete?.(completedSession);
    }

    setState(prev => ({
      ...prev,
      isActive: false,
      currentSession: null
    }));

    setLastAttempt(null);
    resetVoiceResult();
    sessionStartTimeRef.current = null;
  }, [state.currentSession, progress.averageScore, onSessionComplete, resetVoiceResult]);

  // 暂停会话
  const pauseSession = useCallback(() => {
    setState(prev => ({ ...prev, isActive: false }));
    stopVoiceRecording();
  }, [stopVoiceRecording]);

  // 恢复会话
  const resumeSession = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
  }, []);

  // 下一句
  const nextSentence = useCallback(() => {
    if (!state.currentContent) return;
    
    const totalItems = 'sentences' in state.currentContent ? 
      state.currentContent.sentences.length : 
      'conversations' in state.currentContent ? 
        state.currentContent.conversations.length : 0;
    
    const nextIndex = state.currentSentenceIndex + 1;
    if (nextIndex < totalItems) {
      setState(prev => ({ ...prev, currentSentenceIndex: nextIndex }));
      setLastAttempt(null);
      resetVoiceResult();
    } else {
      // 完成所有句子
      endSession();
    }
  }, [state.currentContent, state.currentSentenceIndex, endSession, resetVoiceResult]);

  // 上一句
  const previousSentence = useCallback(() => {
    if (state.currentSentenceIndex > 0) {
      setState(prev => ({ ...prev, currentSentenceIndex: prev.currentSentenceIndex - 1 }));
      setLastAttempt(null);
      resetVoiceResult();
    }
  }, [state.currentSentenceIndex, resetVoiceResult]);

  // 跳转到指定句子
  const goToSentence = useCallback((index: number) => {
    if (!state.currentContent) return;
    
    const totalItems = 'sentences' in state.currentContent ? 
      state.currentContent.sentences.length : 
      'conversations' in state.currentContent ? 
        state.currentContent.conversations.length : 0;
    
    if (index >= 0 && index < totalItems) {
      setState(prev => ({ ...prev, currentSentenceIndex: index }));
      setLastAttempt(null);
      resetVoiceResult();
    }
  }, [state.currentContent, resetVoiceResult]);

  // 播放当前句子
  const playCurrentSentence = useCallback(async () => {
    const currentSentence = getCurrentSentence();
    if (!currentSentence || !state.isActive) return;
    
    try {
      await speak(currentSentence.text, { rate: 0.9 });
    } catch (error) {
      console.warn('播放失败:', error);
    }
  }, [getCurrentSentence, state.isActive, speak]);

  // 开始录音
  const startRecording = useCallback(async () => {
    if (!state.isActive) return;
    setLastAttempt(null);
    resetVoiceResult();
    await startVoiceRecording();
  }, [state.isActive, startVoiceRecording, resetVoiceResult]);

  // 停止录音
  const stopRecording = useCallback(() => {
    stopVoiceRecording();
  }, [stopVoiceRecording]);

  // 重试当前句子
  const retryCurrentSentence = useCallback(() => {
    setLastAttempt(null);
    resetVoiceResult();
  }, [resetVoiceResult]);

  // 跳过当前句子
  const skipCurrentSentence = useCallback(() => {
    nextSentence();
  }, [nextSentence]);

  return {
    // 状态
    state,
    progress,
    currentSentence: getCurrentSentence(),
    
    // 控制方法
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    
    // 句子导航
    nextSentence,
    previousSentence,
    goToSentence,
    
    // 语音交互
    playCurrentSentence,
    startRecording,
    stopRecording,
    
    // 练习控制
    retryCurrentSentence,
    skipCurrentSentence,
    
    // 语音识别状态
    isRecording: voiceState.isRecording,
    recognitionResult: voiceResult?.text || null,
    lastAttempt
  };
}