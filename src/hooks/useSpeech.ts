import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  WebSpeechService, 
  SpeechPlaybackState, 
  SpeechPlaybackEvents,
  defaultSpeechService 
} from '@/services/speech/SpeechService';
import { SpeechOptions, AppError } from '@/types';

export interface UseSpeechOptions {
  speechService?: WebSpeechService;
  defaultOptions?: SpeechOptions;
  onError?: (error: AppError) => void;
}

export interface UseSpeechReturn {
  // 播放状态
  playbackState: SpeechPlaybackState;
  isSupported: boolean;
  isRecognitionSupported: boolean;
  
  // 语音选项
  speechOptions: SpeechOptions;
  setSpeechOptions: (options: SpeechOptions) => void;
  
  // 可用语音
  availableVoices: SpeechSynthesisVoice[];
  englishVoices: SpeechSynthesisVoice[];
  
  // 播放控制
  speak: (text: string, options?: SpeechOptions) => Promise<void>;
  speakWord: (word: string, options?: SpeechOptions) => Promise<void>;
  speakSentence: (sentence: string, options?: SpeechOptions) => Promise<void>;
  speakArticle: (article: string, options?: SpeechOptions) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  
  // 语音识别
  startRecognition: () => Promise<string>;
  stopRecognition: () => void;
  
  // 工具函数
  estimateDuration: (text: string, rate?: number) => number;
}

/**
 * 语音功能的自定义Hook
 */
export function useSpeech(options: UseSpeechOptions = {}): UseSpeechReturn {
  const {
    speechService = defaultSpeechService,
    defaultOptions = {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      lang: 'en-US'
    },
    onError
  } = options;

  const [playbackState, setPlaybackState] = useState<SpeechPlaybackState>(
    speechService.getPlaybackState()
  );
  const [speechOptions, setSpeechOptions] = useState<SpeechOptions>(defaultOptions);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [englishVoices, setEnglishVoices] = useState<SpeechSynthesisVoice[]>([]);

  const eventsRef = useRef<SpeechPlaybackEvents>({});

  // 初始化语音列表
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = speechService.getSupportedVoices();
      const enVoices = speechService.getEnglishVoices();
      
      setAvailableVoices(allVoices);
      setEnglishVoices(enVoices);
      
      // 如果没有设置语音且有可用的英语语音，设置默认语音
      if (!speechOptions.voice && enVoices.length > 0) {
        setSpeechOptions(prev => ({ ...prev, voice: enVoices[0] }));
      }
    };

    loadVoices();
    
    // 某些浏览器需要等待语音加载完成
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [speechService, speechOptions.voice]);

  // 设置播放事件监听器
  useEffect(() => {
    eventsRef.current = {
      onStart: () => {
        setPlaybackState(speechService.getPlaybackState());
      },
      onEnd: () => {
        setPlaybackState(speechService.getPlaybackState());
      },
      onPause: () => {
        setPlaybackState(speechService.getPlaybackState());
      },
      onResume: () => {
        setPlaybackState(speechService.getPlaybackState());
      },
      onProgress: (progress) => {
        setPlaybackState(prev => ({ ...prev, progress }));
      },
      onError: (error) => {
        setPlaybackState(speechService.getPlaybackState());
        onError?.(error);
      }
    };

    speechService.setPlaybackEvents(eventsRef.current);

    return () => {
      speechService.setPlaybackEvents({});
    };
  }, [speechService, onError]);

  // 播放控制函数
  const speak = useCallback(async (text: string, options?: SpeechOptions) => {
    const finalOptions = { ...speechOptions, ...options };
    try {
      await speechService.speak(text, finalOptions);
    } catch (error) {
      onError?.(error as AppError);
      throw error;
    }
  }, [speechService, speechOptions, onError]);

  const speakWord = useCallback(async (word: string, options?: SpeechOptions) => {
    try {
      await speechService.speakWord(word, { ...speechOptions, ...options });
    } catch (error) {
      onError?.(error as AppError);
      throw error;
    }
  }, [speechService, speechOptions, onError]);

  const speakSentence = useCallback(async (sentence: string, options?: SpeechOptions) => {
    try {
      await speechService.speakSentence(sentence, { ...speechOptions, ...options });
    } catch (error) {
      onError?.(error as AppError);
      throw error;
    }
  }, [speechService, speechOptions, onError]);

  const speakArticle = useCallback(async (article: string, options?: SpeechOptions) => {
    try {
      await speechService.speakArticle(article, { ...speechOptions, ...options });
    } catch (error) {
      onError?.(error as AppError);
      throw error;
    }
  }, [speechService, speechOptions, onError]);

  const pause = useCallback(() => {
    speechService.pauseSpeech();
  }, [speechService]);

  const resume = useCallback(() => {
    speechService.resumeSpeech();
  }, [speechService]);

  const stop = useCallback(() => {
    speechService.stopSpeech();
  }, [speechService]);

  // 语音识别
  const startRecognition = useCallback(async () => {
    try {
      return await speechService.startRecognition();
    } catch (error) {
      onError?.(error as AppError);
      throw error;
    }
  }, [speechService, onError]);

  const stopRecognition = useCallback(() => {
    speechService.stopRecognition();
  }, [speechService]);

  // 工具函数
  const estimateDuration = useCallback((text: string, rate?: number) => {
    return speechService.estimateSpeechDuration(text, rate || speechOptions.rate || 1.0);
  }, [speechService, speechOptions.rate]);

  return {
    // 状态
    playbackState,
    isSupported: speechService.isSupported(),
    isRecognitionSupported: speechService.isRecognitionSupported(),
    
    // 选项
    speechOptions,
    setSpeechOptions,
    
    // 语音列表
    availableVoices,
    englishVoices,
    
    // 播放控制
    speak,
    speakWord,
    speakSentence,
    speakArticle,
    pause,
    resume,
    stop,
    
    // 语音识别
    startRecognition,
    stopRecognition,
    
    // 工具函数
    estimateDuration
  };
}