import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { 
  Mic, 
  Volume2, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings
} from 'lucide-react';

/**
 * STT调试页面
 * 用于诊断语音识别和TTS功能问题
 */
export function STTDebugPage() {
  const [browserInfo, setBrowserInfo] = useState<Record<string, any>>({});
  const [permissions, setPermissions] = useState<Record<string, string>>({});
  const [speechSupport, setSpeechSupport] = useState<Record<string, boolean>>({});
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  useEffect(() => {
    // 检查浏览器信息
    setBrowserInfo({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    });

    // 检查语音支持
    setSpeechSupport({
      speechSynthesis: 'speechSynthesis' in window,
      speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      mediaDevices: 'mediaDevices' in navigator,
      getUserMedia: 'getUserMedia' in navigator.mediaDevices
    });

    // 加载语音列表
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // 检查权限
  const checkPermissions = async () => {
    const results: Record<string, string> = {};

    if ('permissions' in navigator) {
      try {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        results.microphone = micPermission.state;
      } catch (error) {
        results.microphone = 'not-supported';
      }
    } else {
      results.microphone = 'api-not-supported';
    }

    setPermissions(results);
  };

  // 测试麦克风访问
  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setTestResults(prev => ({ ...prev, microphone: 'success' }));
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        microphone: `failed: ${error.name} - ${error.message}` 
      }));
    }
  };

  // 测试TTS
  const testTTS = () => {
    try {
      const utterance = new SpeechSynthesisUtterance('Hello, this is a test of text-to-speech functionality.');
      utterance.lang = 'en-US';
      utterance.volume = 1.0;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setTestResults(prev => ({ ...prev, tts: 'playing' }));
      };

      utterance.onend = () => {
        setTestResults(prev => ({ ...prev, tts: 'success' }));
      };

      utterance.onerror = (event) => {
        setTestResults(prev => ({ 
          ...prev, 
          tts: `failed: ${event.error}` 
        }));
      };

      speechSynthesis.speak(utterance);
    } catch (error: any) {
      setTestResults(prev => ({ 
        ...prev, 
        tts: `failed: ${error.message}` 
      }));
    }
  };

  // 测试STT
  const testSTT = () => {
    try {
      let recognition: any;
      if ('webkitSpeechRecognition' in window) {
        recognition = new (window as any).webkitSpeechRecognition();
      } else if ('SpeechRecognition' in window) {
        recognition = new (window as any).SpeechRecognition();
      } else {
        setTestResults(prev => ({ ...prev, stt: 'not-supported' }));
        return;
      }

      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setTestResults(prev => ({ ...prev, stt: 'listening' }));
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTestResults(prev => ({ 
          ...prev, 
          stt: `success: "${transcript}"` 
        }));
      };

      recognition.onerror = (event: any) => {
        setTestResults(prev => ({ 
          ...prev, 
          stt: `failed: ${event.error}` 
        }));
      };

      recognition.onend = () => {
        if (!testResults.stt || testResults.stt === 'listening') {
          setTestResults(prev => ({ ...prev, stt: 'no-speech-detected' }));
        }
      };

      recognition.start();

      // 5秒后自动停止
      setTimeout(() => {
        try {
          recognition.stop();
        } catch (error) {
          // 忽略停止错误
        }
      }, 5000);

    } catch (error: unknown) {
      setTestResults(prev => ({ 
        ...prev, 
        stt: `failed: ${error.message}` 
      }));
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'success' || status === 'granted') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (status === 'failed' || status === 'denied' || status.startsWith('failed:')) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    } else if (status === 'playing' || status === 'listening') {
      return <AlertCircle className="h-4 w-4 text-blue-600" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success' || status === 'granted') {
      return <Badge variant="default">正常</Badge>;
    } else if (status === 'failed' || status === 'denied' || status.startsWith('failed:')) {
      return <Badge variant="destructive">失败</Badge>;
    } else if (status === 'playing' || status === 'listening') {
      return <Badge variant="secondary">进行中</Badge>;
    } else {
      return <Badge variant="outline">未知</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">STT功能诊断</h1>
        <p className="text-muted-foreground">
          诊断语音识别和文本转语音功能的问题
        </p>
      </div>

      {/* 浏览器信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            浏览器信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>用户代理:</strong> {browserInfo.userAgent?.substring(0, 50)}...
            </div>
            <div>
              <strong>语言:</strong> {browserInfo.language}
            </div>
            <div>
              <strong>平台:</strong> {browserInfo.platform}
            </div>
            <div>
              <strong>在线状态:</strong> {browserInfo.onLine ? '在线' : '离线'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能支持检查 */}
      <Card>
        <CardHeader>
          <CardTitle>功能支持检查</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span>语音合成 (TTS)</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(speechSupport.speechSynthesis ? 'success' : 'failed')}
                {getStatusBadge(speechSupport.speechSynthesis ? 'success' : 'failed')}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>语音识别 (STT)</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(speechSupport.speechRecognition ? 'success' : 'failed')}
                {getStatusBadge(speechSupport.speechRecognition ? 'success' : 'failed')}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>媒体设备API</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(speechSupport.mediaDevices ? 'success' : 'failed')}
                {getStatusBadge(speechSupport.mediaDevices ? 'success' : 'failed')}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>getUserMedia</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(speechSupport.getUserMedia ? 'success' : 'failed')}
                {getStatusBadge(speechSupport.getUserMedia ? 'success' : 'failed')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 权限检查 */}
      <Card>
        <CardHeader>
          <CardTitle>权限检查</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Button onClick={checkPermissions} variant="outline" size="sm">
              检查权限状态
            </Button>
            {permissions.microphone && (
              <div className="flex items-center gap-2">
                <span className="text-sm">麦克风权限:</span>
                {getStatusIcon(permissions.microphone)}
                <span className="text-sm">{permissions.microphone}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 功能测试 */}
      <Card>
        <CardHeader>
          <CardTitle>功能测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 麦克风测试 */}
            <div className="space-y-2">
              <Button 
                onClick={testMicrophone} 
                variant="outline" 
                className="w-full"
                disabled={!speechSupport.getUserMedia}
              >
                <Mic className="h-4 w-4 mr-2" />
                测试麦克风
              </Button>
              {testResults.microphone && (
                <div className="flex items-center gap-2 text-sm">
                  {getStatusIcon(testResults.microphone)}
                  <span>{testResults.microphone}</span>
                </div>
              )}
            </div>

            {/* TTS测试 */}
            <div className="space-y-2">
              <Button 
                onClick={testTTS} 
                variant="outline" 
                className="w-full"
                disabled={!speechSupport.speechSynthesis}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                测试TTS
              </Button>
              {testResults.tts && (
                <div className="flex items-center gap-2 text-sm">
                  {getStatusIcon(testResults.tts)}
                  <span>{testResults.tts}</span>
                </div>
              )}
            </div>

            {/* STT测试 */}
            <div className="space-y-2">
              <Button 
                onClick={testSTT} 
                variant="outline" 
                className="w-full"
                disabled={!speechSupport.speechRecognition}
              >
                <Mic className="h-4 w-4 mr-2" />
                测试STT (5秒)
              </Button>
              {testResults.stt && (
                <div className="flex items-center gap-2 text-sm">
                  {getStatusIcon(testResults.stt)}
                  <span className="break-all">{testResults.stt}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 可用语音列表 */}
      <Card>
        <CardHeader>
          <CardTitle>可用语音 ({voices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {voices.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                没有找到可用的语音。请确保浏览器支持语音合成功能。
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {voices.map((voice, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{voice.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {voice.lang} • {voice.localService ? '本地' : '远程'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const utterance = new SpeechSynthesisUtterance('Hello, this is a test.');
                      utterance.voice = voice;
                      speechSynthesis.speak(utterance);
                    }}
                  >
                    测试
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 故障排除建议 */}
      <Card>
        <CardHeader>
          <CardTitle>故障排除建议</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <h4 className="font-medium">如果TTS不工作：</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>检查浏览器音量设置</li>
              <li>确保系统音量未静音</li>
              <li>尝试不同的语音</li>
              <li>刷新页面重试</li>
            </ul>
          </div>

          <hr className="my-4" />

          <div className="space-y-2 text-sm">
            <h4 className="font-medium">如果STT不工作：</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>检查麦克风权限是否被拒绝</li>
              <li>确保麦克风设备正常工作</li>
              <li>使用Chrome或Edge浏览器</li>
              <li>确保网站使用HTTPS协议</li>
              <li>检查是否有其他应用占用麦克风</li>
            </ul>
          </div>

          <hr className="my-4" />

          <div className="space-y-2 text-sm">
            <h4 className="font-medium">推荐的浏览器：</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Chrome 25+ (完全支持)</li>
              <li>Edge 79+ (完全支持)</li>
              <li>Safari 14.1+ (部分支持)</li>
              <li>Firefox (有限支持)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}