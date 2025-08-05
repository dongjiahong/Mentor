import { 
  SpeechService as ISpeechService, 
  SpeechOptions, 
  RecognitionOptions, 
  AppError, 
  ErrorType,
  DEFAULT_SPEECH_OPTIONS,
  DEFAULT_RECOGNITION_OPTIONS
} from '@/types';

/**
 * 语音播放状态
 */
export interface SpeechPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentText: string;
  currentPosition: number;
  totalLength: number;
  progress: number; // 0-100
}

/**
 * 语音播放事件
 */
export interface SpeechPlaybackEvents {
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: AppError) => void;
  onProgress?: (progress: number) => void;
}

/**
 * Web Speech API 封装的语音服务实现
 */
export class WebSpeechService implements ISpeechService {
  private synthesis: SpeechSynthesis;
  private recognition: any | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private playbackState: SpeechPlaybackState = {
    isPlaying: false,
    isPaused: false,
    currentText: '',
    currentPosition: 0,
    totalLength: 0,
    progress: 0
  };
  private playbackEvents: SpeechPlaybackEvents = {};

  constructor() {
    this.synthesis = window.speechSynthesis;
    
    // 初始化语音识别
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    }
  }

  /**
   * 检查是否为 Chrome 浏览器
   */
  private isChrome(): boolean {
    return /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
  }

  /**
   * 等待语音列表加载完成
   */
  private waitForVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      const voices = this.synthesis.getVoices();
      
      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      // 等待语音加载事件
      const handleVoicesChanged = () => {
        const loadedVoices = this.synthesis.getVoices();
        if (loadedVoices.length > 0) {
          this.synthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          resolve(loadedVoices);
        }
      };

      this.synthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // 超时保护
      setTimeout(() => {
        this.synthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve(this.synthesis.getVoices());
      }, 3000);
    });
  }

  /**
   * 检查浏览器是否支持语音功能
   */
  isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * 检查是否支持语音识别
   */
  isRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * 获取支持的语音列表
   */
  getSupportedVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  /**
   * 获取英语语音
   */
  getEnglishVoices(): SpeechSynthesisVoice[] {
    return this.getSupportedVoices().filter(voice => 
      voice.lang.startsWith('en-')
    );
  }

  /**
   * 获取当前播放状态
   */
  getPlaybackState(): SpeechPlaybackState {
    return { ...this.playbackState };
  }

  /**
   * 获取当前播放的语音对象
   */
  getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  /**
   * 设置播放事件监听器
   */
  setPlaybackEvents(events: SpeechPlaybackEvents): void {
    this.playbackEvents = events;
  }

  /**
   * 文本转语音播放
   */
  async speak(text: string, options?: SpeechOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new AppError({
        type: ErrorType.SPEECH_NOT_SUPPORTED,
        message: '当前浏览器不支持语音合成功能',
        recoverable: false
      });
    }

    // Chrome 需要清理之前的语音队列
    if (this.synthesis.speaking || this.synthesis.pending) {
      this.synthesis.cancel();
      // 等待一小段时间确保清理完成
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return new Promise(async (resolve, reject) => {
      try {
        // 确保语音列表已加载
        const voices = await this.waitForVoices();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // 应用语音选项
        const speechOptions = { ...DEFAULT_SPEECH_OPTIONS, ...options };
        utterance.rate = Math.max(0.1, Math.min(10, speechOptions.rate!));
        utterance.pitch = Math.max(0, Math.min(2, speechOptions.pitch!));
        utterance.volume = Math.max(0, Math.min(1, speechOptions.volume!));
        utterance.lang = speechOptions.lang!;
        
        // 确保音量不为0
        if (utterance.volume === 0) {
          utterance.volume = 1.0;
        }

        // 选择语音
        if (speechOptions.voice) {
          utterance.voice = speechOptions.voice;
        } else {
          // 默认选择英语语音
          const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
          if (englishVoices.length > 0) {
            utterance.voice = englishVoices[0];
          }
        }

      // 设置事件监听器
      utterance.onstart = () => {
        this.playbackState = {
          isPlaying: true,
          isPaused: false,
          currentText: text,
          currentPosition: 0,
          totalLength: text.length,
          progress: 0
        };
        this.playbackEvents.onStart?.();
      };

      utterance.onend = () => {
        this.playbackState = {
          isPlaying: false,
          isPaused: false,
          currentText: '',
          currentPosition: 0,
          totalLength: 0,
          progress: 100
        };
        this.currentUtterance = null;
        this.playbackEvents.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('TTS Error:', event.error, event);
        const error = new AppError({
          type: ErrorType.API_ERROR,
          message: `语音播放失败: ${event.error}`,
          details: event,
          recoverable: true
        });
        this.playbackState.isPlaying = false;
        this.currentUtterance = null;
        this.playbackEvents.onError?.(error);
        reject(error);
      };

      utterance.onpause = () => {
        this.playbackState.isPaused = true;
        this.playbackEvents.onPause?.();
      };

      utterance.onresume = () => {
        this.playbackState.isPaused = false;
        this.playbackEvents.onResume?.();
      };

      // 模拟进度更新（Web Speech API 不提供真实进度）
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const progress = Math.min((event.charIndex / text.length) * 100, 100);
          this.playbackState.progress = progress;
          this.playbackState.currentPosition = event.charIndex;
          this.playbackEvents.onProgress?.(progress);
        }
      };

        // 设置超时保护，防止 Chrome 中的静默失败
        const timeoutId = setTimeout(() => {
          if (this.playbackState.isPlaying) {
            const error = new AppError({
              type: ErrorType.API_ERROR,
              message: '语音播放超时',
              recoverable: true
            });
            this.playbackState.isPlaying = false;
            this.currentUtterance = null;
            this.playbackEvents.onError?.(error);
            reject(error);
          }
        }, 15000); // 15秒超时

        // 清理超时
        const originalOnEnd = utterance.onend;
        const originalOnError = utterance.onerror;
        
        utterance.onend = (event) => {
          clearTimeout(timeoutId);
          originalOnEnd?.(event);
        };
        
        utterance.onerror = (event) => {
          clearTimeout(timeoutId);
          originalOnError?.(event);
        };

        this.currentUtterance = utterance;
        
        // Chrome 特殊处理：确保在用户交互后播放
        console.log('开始播放 TTS:', text.substring(0, 50) + '...');
        this.synthesis.speak(utterance);
        
        // Chrome 的一个已知问题：有时需要手动触发
        if (this.isChrome() && !this.synthesis.speaking) {
          setTimeout(() => {
            if (!this.synthesis.speaking && this.currentUtterance === utterance) {
              console.log('Chrome TTS 未开始，尝试重新播放');
              this.synthesis.speak(utterance);
            }
          }, 100);
        }
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 暂停语音播放
   */
  pauseSpeech(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  /**
   * 恢复语音播放
   */
  resumeSpeech(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * 停止语音播放
   */
  stopSpeech(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
      this.playbackState = {
        isPlaying: false,
        isPaused: false,
        currentText: '',
        currentPosition: 0,
        totalLength: 0,
        progress: 0
      };
      this.currentUtterance = null;
    }
  }

  /**
   * 开始语音识别
   */
  async startRecognition(options?: RecognitionOptions): Promise<string> {
    if (!this.isRecognitionSupported()) {
      throw new AppError({
        type: ErrorType.SPEECH_NOT_SUPPORTED,
        message: '当前浏览器不支持语音识别功能',
        recoverable: false
      });
    }

    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new AppError({
          type: ErrorType.SPEECH_NOT_SUPPORTED,
          message: '语音识别未初始化',
          recoverable: false
        }));
        return;
      }

      // 应用识别选项
      const recognitionOptions = { ...DEFAULT_RECOGNITION_OPTIONS, ...options };
      this.recognition.lang = recognitionOptions.lang!;
      this.recognition.continuous = recognitionOptions.continuous!;
      this.recognition.interimResults = recognitionOptions.interimResults!;
      this.recognition.maxAlternatives = recognitionOptions.maxAlternatives!;

      let finalTranscript = '';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
      };

      this.recognition.onend = () => {
        resolve(finalTranscript.trim());
      };

      this.recognition.onerror = (event: any) => {
        let errorType = ErrorType.API_ERROR;
        let message = `语音识别失败: ${event.error}`;

        if (event.error === 'not-allowed') {
          errorType = ErrorType.MICROPHONE_PERMISSION_DENIED;
          message = '麦克风权限被拒绝，请允许访问麦克风';
        } else if (event.error === 'no-speech') {
          message = '未检测到语音输入';
        } else if (event.error === 'network') {
          errorType = ErrorType.NETWORK_ERROR;
          message = '网络连接错误，无法进行语音识别';
        }

        reject(new AppError({
          type: errorType,
          message,
          details: event,
          recoverable: event.error !== 'not-allowed'
        }));
      };

      this.recognition.start();
    });
  }

  /**
   * 停止语音识别
   */
  stopRecognition(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  /**
   * 播放单词发音
   */
  async speakWord(word: string, options?: SpeechOptions): Promise<void> {
    const wordOptions = {
      ...options,
      rate: (options?.rate || 1.0) * 0.8, // 单词播放稍慢一些
    };
    return this.speak(word, wordOptions);
  }

  /**
   * 播放句子
   */
  async speakSentence(sentence: string, options?: SpeechOptions): Promise<void> {
    return this.speak(sentence, options);
  }

  /**
   * 播放整篇文章
   */
  async speakArticle(article: string, options?: SpeechOptions): Promise<void> {
    return this.speak(article, options);
  }

  /**
   * 获取语音播放时长估算（毫秒）
   */
  estimateSpeechDuration(text: string, rate: number = 1.0): number {
    // 平均每分钟150-200个单词，这里使用175作为基准
    const wordsPerMinute = 175 * rate;
    const wordCount = text.split(/\s+/).length;
    return (wordCount / wordsPerMinute) * 60 * 1000;
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stopSpeech();
    this.stopRecognition();
    this.playbackEvents = {};
  }
}

// 创建默认的语音服务实例
export const defaultSpeechService = new WebSpeechService();

// 工厂函数
export function createSpeechService(): WebSpeechService {
  return new WebSpeechService();
}