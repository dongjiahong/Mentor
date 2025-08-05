import { useState, useCallback, useRef, useEffect } from 'react';
import { AppError, ErrorType, RecognitionOptions, PronunciationScore } from '@/types';

export interface VoiceRecognitionState {
  isRecording: boolean;
  isProcessing: boolean;
  hasPermission: boolean;
  permissionRequested: boolean;
  isSupported: boolean;
}

export interface RecognitionResult {
  text: string;
  confidence?: number;
  timestamp: Date;
}

export interface UseVoiceRecognitionOptions {
  onRecordingStart?: () => void;
  onRecordingComplete?: (result: string) => void;
  onError?: (error: AppError) => void;
  defaultOptions?: RecognitionOptions;
  timeout?: number; // 录音超时时间（毫秒）
}

export interface UseVoiceRecognitionReturn {
  state: VoiceRecognitionState;
  result: RecognitionResult | null;
  options: RecognitionOptions;
  setOptions: (options: RecognitionOptions) => void;
  requestPermission: () => Promise<boolean>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetResult: () => void;
}

/**
 * 语音识别自定义Hook
 */
export function useVoiceRecognition({
  onRecordingStart,
  onRecordingComplete,
  onError,
  defaultOptions = {
    lang: 'en-US',
    continuous: false,
    interimResults: true,
    maxAlternatives: 1
  },
  timeout = 30000
}: UseVoiceRecognitionOptions = {}): UseVoiceRecognitionReturn {
  
  const [state, setState] = useState<VoiceRecognitionState>({
    isRecording: false,
    isProcessing: false,
    hasPermission: false,
    permissionRequested: false,
    isSupported: checkSpeechRecognitionSupport()
  });

  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [options, setOptions] = useState<RecognitionOptions>(defaultOptions);

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化语音识别
  useEffect(() => {
    if (state.isSupported) {
      try {
        if ('webkitSpeechRecognition' in window) {
          recognitionRef.current = new (window as any).webkitSpeechRecognition();
        } else if ('SpeechRecognition' in window) {
          recognitionRef.current = new (window as any).SpeechRecognition();
        }
      } catch (error) {
        setState(prev => ({ ...prev, isSupported: false }));
      }
    }
  }, [state.isSupported]);

  // 在组件挂载时检查权限状态
  useEffect(() => {
    const checkInitialPermission = async () => {
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (permission.state === 'granted') {
            setState(prev => ({ ...prev, hasPermission: true, permissionRequested: true }));
          } else if (permission.state === 'denied') {
            setState(prev => ({ ...prev, hasPermission: false, permissionRequested: true }));
          }
        } catch (error) {
          // 权限API不支持，忽略错误
        }
      }
    };

    checkInitialPermission();
  }, []);

  // 检查麦克风权限
  const checkMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      // 首先检查权限API
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (permission.state === 'denied') {
            setState(prev => ({ ...prev, hasPermission: false }));
            const appError = new AppError({
              type: ErrorType.MICROPHONE_PERMISSION_DENIED,
              message: '麦克风权限被永久拒绝，请在浏览器设置中手动允许',
              recoverable: false
            });
            onError?.(appError);
            return false;
          }
        } catch (error) {
          // 权限API不支持，继续使用getUserMedia
        }
      }

      // 尝试获取麦克风访问权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // 立即停止流，我们只是为了检查权限
      stream.getTracks().forEach(track => track.stop());
      setState(prev => ({ ...prev, hasPermission: true }));
      return true;
    } catch (error: any) {
      let errorMessage = '麦克风权限被拒绝，请允许访问麦克风';
      let recoverable = true;

      if (error.name === 'NotAllowedError') {
        errorMessage = '麦克风权限被拒绝，请点击地址栏的麦克风图标允许访问';
      } else if (error.name === 'NotFoundError') {
        errorMessage = '未找到麦克风设备，请检查设备连接';
        recoverable = false;
      } else if (error.name === 'NotReadableError') {
        errorMessage = '麦克风设备被其他应用占用，请关闭其他应用后重试';
      }

      const appError = new AppError({
        type: ErrorType.MICROPHONE_PERMISSION_DENIED,
        message: errorMessage,
        details: error,
        recoverable
      });
      onError?.(appError);
      setState(prev => ({ ...prev, hasPermission: false }));
      return false;
    }
  }, [onError]);

  // 请求麦克风权限
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, permissionRequested: true }));
    return await checkMicrophonePermission();
  }, [checkMicrophonePermission]);

  // 开始录音
  const startRecording = useCallback(async () => {
    if (!state.isSupported) {
      const error = new AppError({
        type: ErrorType.SPEECH_NOT_SUPPORTED,
        message: '当前浏览器不支持语音识别功能',
        recoverable: false
      });
      onError?.(error);
      return;
    }

    if (!recognitionRef.current) {
      const error = new AppError({
        type: ErrorType.SPEECH_NOT_SUPPORTED,
        message: '语音识别未初始化',
        recoverable: false
      });
      onError?.(error);
      return;
    }

    if (!state.hasPermission) {
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) return;
    }

    try {
      setState(prev => ({ ...prev, isRecording: true, isProcessing: false }));
      setResult(null);
      
      onRecordingStart?.();

      // 配置识别选项
      const recognition = recognitionRef.current;
      recognition.lang = options.lang || 'en-US';
      recognition.continuous = options.continuous || false;
      recognition.interimResults = options.interimResults || true;
      recognition.maxAlternatives = options.maxAlternatives || 1;

      let finalTranscript = '';
      let interimTranscript = '';

      // 设置事件监听器
      recognition.onresult = (event: any) => {
        interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // 更新临时结果
        if (interimTranscript) {
          setResult({
            text: finalTranscript + interimTranscript,
            confidence: event.results[event.results.length - 1][0].confidence,
            timestamp: new Date()
          });
        }
      };

      recognition.onend = () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        const finalResult: RecognitionResult = {
          text: finalTranscript.trim(),
          timestamp: new Date()
        };

        setResult(finalResult);
        setState(prev => ({ ...prev, isRecording: false, isProcessing: false }));
        onRecordingComplete?.(finalResult.text);
      };

      recognition.onerror = (event: unknown) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setState(prev => ({ ...prev, isRecording: false, isProcessing: false }));

        let errorType = ErrorType.API_ERROR;
        let message = `语音识别失败: ${event.error}`;

        switch (event.error) {
          case 'not-allowed':
            errorType = ErrorType.MICROPHONE_PERMISSION_DENIED;
            message = '麦克风权限被拒绝，请允许访问麦克风';
            setState(prev => ({ ...prev, hasPermission: false }));
            break;
          case 'no-speech':
            message = '未检测到语音输入，请重试';
            break;
          case 'network':
            errorType = ErrorType.NETWORK_ERROR;
            message = '网络连接错误，无法进行语音识别';
            break;
          case 'audio-capture':
            message = '音频捕获失败，请检查麦克风设备';
            break;
          case 'aborted':
            message = '语音识别被中断';
            break;
        }

        const appError = new AppError({
          type: errorType,
          message,
          details: event,
          recoverable: event.error !== 'not-allowed'
        });

        onError?.(appError);
      };

      recognition.onstart = () => {
        setState(prev => ({ ...prev, isRecording: true }));
      };

      // 设置录音超时
      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          stopRecording();
        }, timeout);
      }

      // 开始识别
      recognition.start();

    } catch (error) {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: false }));
      
      const appError = new AppError({
        type: ErrorType.API_ERROR,
        message: '启动语音识别失败',
        details: error,
        recoverable: true
      });
      onError?.(appError);
    }
  }, [
    state.isSupported,
    state.hasPermission,
    options,
    timeout,
    onRecordingStart,
    onRecordingComplete,
    onError,
    checkMicrophonePermission
  ]);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (recognitionRef.current && state.isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        // 忽略停止时的错误
      }
    }
    
    setState(prev => ({ ...prev, isRecording: false }));
  }, [state.isRecording]);

  // 重置结果
  const resetResult = useCallback(() => {
    setResult(null);
    setState(prev => ({ ...prev, isProcessing: false }));
  }, []);

  // 清理资源
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (recognitionRef.current && state.isRecording) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // 忽略清理时的错误
        }
      }
    };
  }, [state.isRecording]);

  return {
    state,
    result,
    options,
    setOptions,
    requestPermission,
    startRecording,
    stopRecording,
    resetResult
  };
}

// 辅助函数：检查浏览器是否支持语音识别
function checkSpeechRecognitionSupport(): boolean {
  return (
    'webkitSpeechRecognition' in window ||
    'SpeechRecognition' in window
  );
}

// 辅助函数：评估发音准确度
export function evaluatePronunciation(
  targetText: string, 
  spokenText: string
): PronunciationScore {
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

  // 计算文本相似度
  const similarity = calculateTextSimilarity(
    targetText.toLowerCase().trim(), 
    spokenText.toLowerCase().trim()
  );
  
  const accuracyScore = Math.round(similarity * 100);
  const fluencyScore = Math.max(accuracyScore - 10, 0); // 流利度通常略低于准确度
  const pronunciationScore = accuracyScore;
  const overallScore = Math.round((accuracyScore + fluencyScore + pronunciationScore) / 3);

  // 生成反馈
  const feedback = generatePronunciationFeedback(overallScore, targetText, spokenText);
  
  // 找出错误
  const mistakes = findPronunciationMistakes(targetText, spokenText);

  return {
    overallScore,
    accuracyScore,
    fluencyScore,
    pronunciationScore,
    feedback,
    mistakes
  };
}

// 计算文本相似度
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const words1 = text1.split(/\s+/).filter(w => w.length > 0);
  const words2 = text2.split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 && words2.length === 0) return 1;
  if (words1.length === 0 || words2.length === 0) return 0;
  
  let matches = 0;
  const maxLength = Math.max(words1.length, words2.length);
  
  for (let i = 0; i < Math.min(words1.length, words2.length); i++) {
    if (words1[i] === words2[i]) {
      matches++;
    } else if (words1[i].toLowerCase() === words2[i].toLowerCase()) {
      matches += 0.8; // 大小写不同扣分
    } else {
      // 计算编辑距离相似度
      const distance = levenshteinDistance(words1[i], words2[i]);
      const maxLen = Math.max(words1[i].length, words2[i].length);
      if (maxLen > 0) {
        const wordSimilarity = Math.max(0, 1 - distance / maxLen);
        matches += wordSimilarity * 0.6; // 部分匹配给予部分分数
      }
    }
  }
  
  // 考虑长度差异的惩罚
  const lengthPenalty = Math.abs(words1.length - words2.length) / maxLength;
  const finalScore = (matches / maxLength) * (1 - lengthPenalty * 0.3);
  
  return Math.max(0, Math.min(1, finalScore));
}

// 计算编辑距离
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1,     // 插入
          matrix[i - 1][j] + 1      // 删除
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// 生成发音反馈
function generatePronunciationFeedback(
  score: number, 
  _targetText: string, 
  _spokenText: string
): string {
  if (score >= 90) {
    return "发音非常准确！继续保持这个水平。";
  } else if (score >= 80) {
    return "发音很好，只有少数地方需要改进。";
  } else if (score >= 70) {
    return "发音基本正确，建议多练习提高准确度。";
  } else if (score >= 60) {
    return "发音需要改进，建议慢一点说，注意每个单词的发音。";
  } else if (score >= 40) {
    return "发音有较大问题，建议先听标准发音，然后慢慢跟读。";
  } else {
    return "发音需要大幅改进，建议从单个单词开始练习。";
  }
}

// 找出发音错误
function findPronunciationMistakes(_targetText: string, _spokenText: string) {
  const targetWords = _targetText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const spokenWords = _spokenText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  const mistakes = [];
  const maxLength = Math.max(targetWords.length, spokenWords.length);
  
  for (let i = 0; i < maxLength; i++) {
    const targetWord = targetWords[i] || '';
    const spokenWord = spokenWords[i] || '';
    
    if (targetWord && spokenWord && targetWord !== spokenWord) {
      // 检查是否是相似的单词（可能是发音问题）
      const distance = levenshteinDistance(targetWord, spokenWord);
      const similarity = 1 - distance / Math.max(targetWord.length, spokenWord.length);
      
      if (similarity < 0.7) { // 相似度低于70%认为是错误
        mistakes.push({
          word: spokenWord,
          expected: targetWord,
          actual: spokenWord,
          suggestion: `应该是 "${targetWord}"`
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
  
  return mistakes.slice(0, 5); // 最多显示5个错误
}