import { useState, useCallback, useEffect } from 'react';
import { ListeningPracticeContent, UniversalContent, UserAnswer, ListeningSentence } from '@/types';
import { getDefaultSpeechService } from '@/services/language/speech/SpeechService';
import { LearningRecordCollector } from '@/services/assessment/LearningRecordCollector';
import { 
  convertToListeningContent, 
  createListeningSentences, 
  setSentenceTimestamps,
  calculateTextSimilarity
} from '@/utils/listeningHelpers';

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
  sentences: ListeningSentence[];
  playingSentenceId: string | null;
  isPlayingFullText: boolean;
  currentFullTextIndex: number;
  sessionStartTime: number;
}

export function useListeningSession(content: ListeningPracticeContent | UniversalContent) {
  // 确保content是ListeningPracticeContent类型
  const listeningContent: ListeningPracticeContent = 
    'practiceType' in content ? content : convertToListeningContent(content);

  // 初始化句子数据
  const initializeSentences = useCallback(() => {
    if (listeningContent.sentences && listeningContent.sentences.length > 0) {
      return listeningContent.sentences;
    } else if (listeningContent.transcript) {
      const sentences = createListeningSentences(listeningContent.transcript);
      return setSentenceTimestamps(sentences);
    }
    return [];
  }, [listeningContent.sentences, listeningContent.transcript]);

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
  const [sessionState, setSessionState] = useState<ListeningSessionState>(() => {
    const initialSentences = initializeSentences();
    return {
      sentences: initialSentences,
      playingSentenceId: null,
      isPlayingFullText: false,
      currentFullTextIndex: -1,
      sessionStartTime: Date.now()
    };
  });

  // 停止所有播放
  const stopAllPlayback = useCallback(() => {
    speechService.stopSpeech();
    setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0, progress: 0 }));
    setSessionState(prev => ({ 
      ...prev, 
      playingSentenceId: null,
      isPlayingFullText: false,
      currentFullTextIndex: -1
    }));
  }, [speechService]);

  // 重试练习
  const handleRetry = useCallback(() => {
    const initialSentences = initializeSentences();
    stopAllPlayback();
    setSessionState({
      sentences: initialSentences,
      playingSentenceId: null,
      isPlayingFullText: false,
      currentFullTextIndex: -1,
      sessionStartTime: Date.now()
    });
  }, [initializeSentences, stopAllPlayback]);

  // 播放指定句子
  const playSentence = useCallback(async (sentenceId: string) => {
    const sentence = sessionState.sentences.find(s => s.id === sentenceId);
    if (!sentence) return;

    try {
      // 停止当前播放
      if (audioState.isPlaying) {
        speechService.stopSpeech();
      }

      setSessionState(prev => ({ ...prev, playingSentenceId: sentenceId }));
      setAudioState(prev => ({ ...prev, isLoading: true, error: null }));

      // 设置播放事件
      speechService.setPlaybackEvents({
        onStart: () => {
          setAudioState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
          // 标记句子为已播放，但不自动显示原文
          setSessionState(prev => ({
            ...prev,
            sentences: prev.sentences.map(s => 
              s.id === sentenceId 
                ? { ...s, hasBeenPlayed: true }
                : s
            )
          }));
        },
        onEnd: () => {
          setAudioState(prev => ({ ...prev, isPlaying: false }));
          setSessionState(prev => ({ ...prev, playingSentenceId: null }));
        },
        onError: (error) => {
          setAudioState(prev => ({ ...prev, error: error.message, isLoading: false, isPlaying: false }));
          setSessionState(prev => ({ ...prev, playingSentenceId: null }));
        }
      });

      await speechService.speak(sentence.text, {
        rate: audioState.playbackRate,
        volume: audioState.volume,
        lang: 'en-US'
      });
    } catch (error) {
      setAudioState(prev => ({ ...prev, error: '句子播放失败', isLoading: false, isPlaying: false }));
      setSessionState(prev => ({ ...prev, playingSentenceId: null }));
    }
  }, [sessionState.sentences, audioState.isPlaying, audioState.playbackRate, audioState.volume, speechService]);

  // 播放全文
  const playFullText = useCallback(async () => {
    if (sessionState.sentences.length === 0) return;
    
    try {
      // 停止当前播放
      if (audioState.isPlaying) {
        speechService.stopSpeech();
      }

      setSessionState(prev => ({ 
        ...prev, 
        isPlayingFullText: true,
        currentFullTextIndex: 0,
        playingSentenceId: null 
      }));
      setAudioState(prev => ({ ...prev, isLoading: true, error: null }));

      // 播放所有句子
      const playNextSentence = async (index: number) => {
        if (index >= sessionState.sentences.length) {
          // 全文播放完成
          setSessionState(prev => ({ 
            ...prev, 
            isPlayingFullText: false,
            currentFullTextIndex: -1 
          }));
          setAudioState(prev => ({ ...prev, isPlaying: false }));
          return;
        }

        const sentence = sessionState.sentences[index];
        setSessionState(prev => ({ ...prev, currentFullTextIndex: index }));

        // 设置播放事件
        speechService.setPlaybackEvents({
          onStart: () => {
            setAudioState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
            // 标记当前句子为已播放
            setSessionState(prev => ({
              ...prev,
              sentences: prev.sentences.map(s => 
                s.id === sentence.id 
                  ? { ...s, hasBeenPlayed: true }
                  : s
              )
            }));
          },
          onEnd: () => {
            // 播放下一句，添加500ms停顿
            setTimeout(() => {
              playNextSentence(index + 1);
            }, 500);
          },
          onError: (error) => {
            setAudioState(prev => ({ ...prev, error: error.message, isLoading: false, isPlaying: false }));
            setSessionState(prev => ({ 
              ...prev, 
              isPlayingFullText: false,
              currentFullTextIndex: -1 
            }));
          }
        });

        await speechService.speak(sentence.text, {
          rate: audioState.playbackRate,
          volume: audioState.volume,
          lang: 'en-US'
        });
      };

      // 开始播放第一句
      await playNextSentence(0);
    } catch (error) {
      setAudioState(prev => ({ ...prev, error: '全文播放失败', isLoading: false, isPlaying: false }));
      setSessionState(prev => ({ 
        ...prev, 
        isPlayingFullText: false,
        currentFullTextIndex: -1 
      }));
    }
  }, [sessionState.sentences, audioState.isPlaying, audioState.playbackRate, audioState.volume, speechService]);

  // 更新句子用户输入
  const updateSentenceInput = useCallback((sentenceId: string, userInput: string) => {
    setSessionState(prev => ({
      ...prev,
      sentences: prev.sentences.map(sentence => {
        if (sentence.id === sentenceId) {
          const similarity = calculateTextSimilarity(sentence.text, userInput);
          return {
            ...sentence,
            userInput,
            similarity
          };
        }
        return sentence;
      })
    }));
  }, []);

  // 显示/隐藏句子
  const toggleSentenceReveal = useCallback((sentenceId: string) => {
    setSessionState(prev => ({
      ...prev,
      sentences: prev.sentences.map(sentence =>
        sentence.id === sentenceId
          ? { ...sentence, isRevealed: !sentence.isRevealed }
          : sentence
      )
    }));
  }, []);

  // 清理资源
  useEffect(() => {
    return () => {
      speechService.stopSpeech();
    };
  }, [speechService]);

  // 计算会话统计数据
  const getSessionStats = useCallback(() => {
    const totalSentences = sessionState.sentences.length;
    const answeredSentences = sessionState.sentences.filter(s => s.userInput && s.userInput.trim().length > 0).length;
    const correctSentences = sessionState.sentences.filter(s => s.similarity && s.similarity >= 0.7).length;
    const totalTimeSpent = Date.now() - sessionState.sessionStartTime;
    const playedSentences = sessionState.sentences.filter(s => s.hasBeenPlayed).length;
    
    const accuracyScore = totalSentences > 0 ? (correctSentences / totalSentences) * 100 : 0;
    const completionRate = totalSentences > 0 ? (answeredSentences / totalSentences) * 100 : 0;

    return {
      totalSentences,
      answeredSentences,
      correctSentences,
      playedSentences,
      accuracyScore: Math.round(accuracyScore),
      completionRate: Math.round(completionRate),
      timeSpent: totalTimeSpent,
      averageSimilarity: sessionState.sentences.reduce((sum, s) => sum + (s.similarity || 0), 0) / totalSentences
    };
  }, [sessionState.sentences, sessionState.sessionStartTime]);

  // 完成听力练习时记录数据
  const finishListening = useCallback(async () => {
    const stats = getSessionStats();
    
    try {
      await LearningRecordCollector.recordListening({
        contentId: listeningContent.id,
        totalSegments: stats.totalSentences,
        correctSegments: stats.correctSentences,
        listeningTime: Math.round(stats.timeSpent / 1000), // 转换为秒
        replayCount: stats.playedSentences,
        finalScore: stats.accuracyScore,
        playbackSpeed: audioState.playbackRate,
        difficultyLevel: listeningContent.difficultyLevel
      });
    } catch (error) {
      console.error('Failed to record listening data:', error);
    }
  }, [listeningContent, getSessionStats, audioState.playbackRate]);

  return {
    listeningContent,
    audioState,
    sessionState,
    getSessionStats,
    finishListening,
    handlers: {
      handleRetry,
      playSentence,
      playFullText,
      updateSentenceInput,
      toggleSentenceReveal,
      stopAllPlayback
    }
  };
}