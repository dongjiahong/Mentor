/**
 * TTS 诊断工具
 * 用于调试 Chrome 中的语音合成问题
 */

export interface SpeechDiagnosticResult {
  isSupported: boolean;
  voicesCount: number;
  englishVoicesCount: number;
  currentVoices: SpeechSynthesisVoice[];
  browserInfo: {
    userAgent: string;
    isChrome: boolean;
    isSafari: boolean;
    isFirefox: boolean;
  };
  synthesisState: {
    speaking: boolean;
    pending: boolean;
    paused: boolean;
  };
  errors: string[];
}

/**
 * 运行 TTS 诊断
 */
export async function runSpeechDiagnostics(): Promise<SpeechDiagnosticResult> {
  const errors: string[] = [];
  
  // 检查基础支持
  const isSupported = 'speechSynthesis' in window;
  if (!isSupported) {
    errors.push('浏览器不支持 speechSynthesis API');
  }

  // 浏览器信息
  const userAgent = navigator.userAgent;
  const browserInfo = {
    userAgent,
    isChrome: /Chrome/.test(userAgent) && !/Edge/.test(userAgent),
    isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
    isFirefox: /Firefox/.test(userAgent)
  };

  // 获取语音列表
  let currentVoices: SpeechSynthesisVoice[] = [];
  let voicesCount = 0;
  let englishVoicesCount = 0;

  if (isSupported) {
    // 等待语音列表加载
    currentVoices = await waitForVoices();
    voicesCount = currentVoices.length;
    englishVoicesCount = currentVoices.filter(voice => 
      voice.lang.startsWith('en-')
    ).length;

    if (voicesCount === 0) {
      errors.push('没有可用的语音');
    }
    if (englishVoicesCount === 0) {
      errors.push('没有可用的英语语音');
    }
  }

  // 语音合成状态
  const synthesisState = isSupported ? {
    speaking: speechSynthesis.speaking,
    pending: speechSynthesis.pending,
    paused: speechSynthesis.paused
  } : {
    speaking: false,
    pending: false,
    paused: false
  };

  return {
    isSupported,
    voicesCount,
    englishVoicesCount,
    currentVoices,
    browserInfo,
    synthesisState,
    errors
  };
}

/**
 * 等待语音列表加载完成
 */
function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // 等待语音加载事件
    const handleVoicesChanged = () => {
      const loadedVoices = speechSynthesis.getVoices();
      if (loadedVoices.length > 0) {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve(loadedVoices);
      }
    };

    speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    
    // 超时保护
    setTimeout(() => {
      speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(speechSynthesis.getVoices());
    }, 3000);
  });
}

/**
 * 测试基础 TTS 功能
 */
export async function testBasicTTS(text: string = 'Hello, this is a test.'): Promise<{
  success: boolean;
  error?: string;
  duration: number;
}> {
  const startTime = Date.now();
  
  try {
    if (!('speechSynthesis' in window)) {
      throw new Error('speechSynthesis 不支持');
    }

    // 等待语音列表
    const voices = await waitForVoices();
    
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 设置基础参数
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      
      // 选择英语语音
      const englishVoices = voices.filter(voice => voice.lang.startsWith('en-'));
      if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0];
      }

      let resolved = false;

      utterance.onstart = () => {
        console.log('TTS 开始播放');
      };

      utterance.onend = () => {
        if (!resolved) {
          resolved = true;
          const duration = Date.now() - startTime;
          resolve({ success: true, duration });
        }
      };

      utterance.onerror = (event) => {
        if (!resolved) {
          resolved = true;
          const duration = Date.now() - startTime;
          resolve({ 
            success: false, 
            error: `TTS 错误: ${event.error}`,
            duration 
          });
        }
      };

      // 超时保护
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          speechSynthesis.cancel();
          const duration = Date.now() - startTime;
          resolve({ 
            success: false, 
            error: 'TTS 播放超时',
            duration 
          });
        }
      }, 10000);

      console.log('开始 TTS 测试播放...');
      speechSynthesis.speak(utterance);
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      duration 
    };
  }
}

/**
 * 打印诊断报告
 */
export function printDiagnosticReport(result: SpeechDiagnosticResult): void {
  console.group('🔊 TTS 诊断报告');
  
  console.log('📱 浏览器信息:');
  console.log(`  User Agent: ${result.browserInfo.userAgent}`);
  console.log(`  Chrome: ${result.browserInfo.isChrome}`);
  console.log(`  Safari: ${result.browserInfo.isSafari}`);
  console.log(`  Firefox: ${result.browserInfo.isFirefox}`);
  
  console.log('\n🎤 语音支持:');
  console.log(`  支持 TTS: ${result.isSupported}`);
  console.log(`  可用语音数量: ${result.voicesCount}`);
  console.log(`  英语语音数量: ${result.englishVoicesCount}`);
  
  if (result.currentVoices.length > 0) {
    console.log('\n🗣️ 可用语音列表:');
    result.currentVoices.forEach((voice, index) => {
      console.log(`  ${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? '本地' : '远程'}`);
    });
  }
  
  console.log('\n⚡ 合成器状态:');
  console.log(`  正在播放: ${result.synthesisState.speaking}`);
  console.log(`  队列中: ${result.synthesisState.pending}`);
  console.log(`  已暂停: ${result.synthesisState.paused}`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ 发现的问题:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  console.groupEnd();
}