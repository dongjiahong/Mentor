import { useState, useCallback, useRef, useEffect } from 'react';
import { AppError, ErrorType, RecognitionOptions } from '@/types';

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

      recognition.onerror = (event: any) => {
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

