import { useState, useCallback, useEffect } from 'react';
import { ListeningPracticeContent, UniversalContent, UserAnswer } from '@/types';
import { getDefaultSpeechService } from '@/services/language/speech/SpeechService';
import { convertToListeningContent } from '@/utils/listeningHelpers';

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isLoading: boolean;
  error: string | null;
  progress: number;
}

interface ListeningSessionState {
  currentQuestionIndex: number;
  userAnswers: Map<string, UserAnswer>;
  showTranscript: boolean;
  showResults: boolean;
  sessionStartTime: number;
  questionStartTime: number;
}

export function useListeningSession(content: ListeningPracticeContent | UniversalContent) {
  // 确保content是ListeningPracticeContent类型
  const listeningContent: ListeningPracticeContent = 
    'practiceType' in content ? content : convertToListeningContent(content);

  const speechService = getDefaultSpeechService();
  
  // 音频状态
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    isLoading: false,
    error: null,
    progress: 0
  });

  // 会话状态
  const [sessionState, setSessionState] = useState<ListeningSessionState>({
    currentQuestionIndex: 0,
    userAnswers: new Map(),
    showTranscript: false,
    showResults: false,
    sessionStartTime: Date.now(),
    questionStartTime: Date.now()
  });

  // TTS音频控制处理函数
  const handlePlayPause = useCallback(async () => {
    if (audioState.isPlaying) {
      speechService.stopSpeech();
      setAudioState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
    } else {
      try {
        setAudioState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // 设置TTS播放事件监听器
        speechService.setPlaybackEvents({
          onStart: () => {
            const estimatedDuration = speechService.estimateSpeechDuration(
              listeningContent.transcript || listeningContent.title,
              audioState.playbackRate
            ) / 1000;
            setAudioState(prev => ({ 
              ...prev, 
              isPlaying: true, 
              isLoading: false,
              duration: estimatedDuration
            }));
          },
          onEnd: () => {
            setAudioState(prev => ({ ...prev, isPlaying: false, progress: 100, currentTime: audioState.duration }));
          },
          onProgress: (progress) => {
            setAudioState(prev => ({ 
              ...prev, 
              progress,
              currentTime: (progress / 100) * prev.duration
            }));
          },
          onError: (error) => {
            setAudioState(prev => ({ ...prev, error: error.message, isLoading: false, isPlaying: false }));
          }
        });
        
        // 使用学习内容的文本进行TTS播放
        const textToSpeak = listeningContent.transcript || listeningContent.title;
        await speechService.speak(textToSpeak, {
          rate: audioState.playbackRate,
          volume: audioState.volume,
          lang: 'en-US'
        });
      } catch (error) {
        setAudioState(prev => ({ ...prev, error: 'TTS播放失败', isLoading: false, isPlaying: false }));
      }
    }
  }, [audioState.isPlaying, audioState.playbackRate, audioState.volume, listeningContent, speechService]);

  const handleStop = useCallback(() => {
    speechService.stopSpeech();
    setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0, progress: 0 }));
  }, [speechService]);

  const handleSeek = useCallback((time: number) => {
    // TTS不支持跳转，但我们可以更新UI状态
    // 如果需要跳转功能，需要重新开始播放
    if (audioState.isPlaying) {
      speechService.stopSpeech();
      setAudioState(prev => ({ ...prev, currentTime: time, progress: (time / prev.duration) * 100 }));
    } else {
      setAudioState(prev => ({ ...prev, currentTime: time, progress: (time / prev.duration) * 100 }));
    }
  }, [audioState.isPlaying, speechService]);

  const handleVolumeChange = useCallback((volume: number) => {
    const newVolume = volume / 100;
    setAudioState(prev => ({ ...prev, volume: newVolume }));
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setAudioState(prev => ({ ...prev, playbackRate: rate }));
    // 如果正在播放，需要重新开始播放以应用新的速度
    if (audioState.isPlaying) {
      speechService.stopSpeech();
      // 延迟一点时间后重新播放
      setTimeout(() => {
        handlePlayPause();
      }, 100);
    }
  }, [audioState.isPlaying, speechService, handlePlayPause]);

  // 处理答案提交
  const handleAnswerSubmit = useCallback((questionId: string, answer: string) => {
    const timeSpent = Date.now() - sessionState.questionStartTime;
    const question = listeningContent.questions?.[sessionState.currentQuestionIndex];
    
    if (!question) return;

    const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.toLowerCase();
    
    setSessionState(prev => ({
      ...prev,
      userAnswers: new Map(prev.userAnswers.set(questionId, {
        questionId,
        answer,
        isCorrect,
        timeSpent
      }))
    }));

    // 自动跳转到下一题
    if (sessionState.currentQuestionIndex < (listeningContent.questions?.length || 0) - 1) {
      setTimeout(() => {
        setSessionState(prev => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          questionStartTime: Date.now()
        }));
      }, 1500);
    } else {
      // 所有题目完成，显示结果
      setTimeout(() => {
        setSessionState(prev => ({ ...prev, showResults: true }));
      }, 1500);
    }
  }, [sessionState.currentQuestionIndex, sessionState.questionStartTime, listeningContent.questions]);

  // 题目导航
  const handleQuestionChange = useCallback((index: number) => {
    setSessionState(prev => ({
      ...prev,
      currentQuestionIndex: index,
      questionStartTime: Date.now()
    }));
  }, []);

  // 切换文稿显示
  const toggleTranscript = useCallback(() => {
    setSessionState(prev => ({ ...prev, showTranscript: !prev.showTranscript }));
  }, []);

  // 重试练习
  const handleRetry = useCallback(() => {
    setSessionState({
      currentQuestionIndex: 0,
      userAnswers: new Map(),
      showTranscript: false,
      showResults: false,
      sessionStartTime: Date.now(),
      questionStartTime: Date.now()
    });
  }, []);

  // TTS 初始化
  useEffect(() => {
    // 设置估计的音频时长
    if (listeningContent.transcript) {
      const estimatedDuration = speechService.estimateSpeechDuration(
        listeningContent.transcript,
        1.0
      ) / 1000;
      setAudioState(prev => ({ ...prev, duration: estimatedDuration }));
    }

    // 清理资源
    return () => {
      speechService.stopSpeech();
    };
  }, [listeningContent.transcript, speechService]);

  return {
    listeningContent,
    audioState,
    sessionState,
    audioHandlers: {
      handlePlayPause,
      handleStop,
      handleSeek,
      handleVolumeChange,
      handlePlaybackRateChange
    },
    sessionHandlers: {
      handleAnswerSubmit,
      handleQuestionChange,
      toggleTranscript,
      handleRetry
    }
  };
}