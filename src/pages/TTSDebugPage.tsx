import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { 
  runSpeechDiagnostics, 
  testBasicTTS, 
  printDiagnosticReport,
  type SpeechDiagnosticResult 
} from '@/utils/speechDiagnostics';
import { useSpeech } from '@/hooks/useSpeech';

/**
 * TTS 调试页面
 * 用于诊断和测试 Chrome 中的 TTS 问题
 */
export function TTSDebugPage() {
  const [diagnosticResult, setDiagnosticResult] = useState<SpeechDiagnosticResult | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [isTestingTTS, setIsTestingTTS] = useState(false);
  const [testText, setTestText] = useState('Hello, this is a test of text-to-speech functionality.');

  const { speak, playbackState, isSupported } = useSpeech();

  // 页面加载时自动运行诊断
  useEffect(() => {
    runDiagnostic();
  }, []);

  const runDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const result = await runSpeechDiagnostics();
      setDiagnosticResult(result);
      printDiagnosticReport(result);
    } catch (error) {
      console.error('诊断失败:', error);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const runBasicTest = async () => {
    setIsTestingTTS(true);
    try {
      const result = await testBasicTTS(testText);
      setTestResult(result);
      console.log('基础 TTS 测试结果:', result);
    } catch (error) {
      console.error('TTS 测试失败:', error);
      setTestResult({ success: false, error: String(error) });
    } finally {
      setIsTestingTTS(false);
    }
  };

  const testWithUseSpeech = async () => {
    try {
      await speak(testText);
    } catch (error) {
      console.error('useSpeech 测试失败:', error);
    }
  };

  const getBrowserBadgeVariant = (browserInfo: any) => {
    if (browserInfo.isChrome) return 'destructive';
    if (browserInfo.isSafari) return 'default';
    if (browserInfo.isFirefox) return 'secondary';
    return 'outline';
  };

  const getBrowserName = (browserInfo: any) => {
    if (browserInfo.isChrome) return 'Chrome';
    if (browserInfo.isSafari) return 'Safari';
    if (browserInfo.isFirefox) return 'Firefox';
    return '未知浏览器';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">TTS 调试工具</h1>
        <p className="text-muted-foreground">
          诊断和测试文本转语音功能，特别针对 Chrome 浏览器的兼容性问题
        </p>
      </div>

      {/* 快速状态概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            快速状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant={isSupported ? 'default' : 'destructive'}>
              {isSupported ? '✓ TTS 支持' : '✗ TTS 不支持'}
            </Badge>
            {diagnosticResult && (
              <>
                <Badge variant={diagnosticResult.browserInfo ? getBrowserBadgeVariant(diagnosticResult.browserInfo) : 'outline'}>
                  {diagnosticResult.browserInfo ? getBrowserName(diagnosticResult.browserInfo) : '未知'}
                </Badge>
                <Badge variant={diagnosticResult.voicesCount > 0 ? 'default' : 'destructive'}>
                  {diagnosticResult.voicesCount} 个语音
                </Badge>
                <Badge variant={diagnosticResult.englishVoicesCount > 0 ? 'default' : 'destructive'}>
                  {diagnosticResult.englishVoicesCount} 个英语语音
                </Badge>
                {playbackState.isPlaying && (
                  <Badge variant="secondary">正在播放</Badge>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 诊断结果 */}
      <Card>
        <CardHeader>
          <CardTitle>系统诊断</CardTitle>
          <CardDescription>
            检查浏览器支持、语音列表和合成器状态
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runDiagnostic} 
            disabled={isRunningDiagnostic}
            className="w-full"
          >
            {isRunningDiagnostic && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRunningDiagnostic ? '正在诊断...' : '重新运行诊断'}
          </Button>

          {diagnosticResult && (
            <div className="space-y-4">
              {/* 错误提示 */}
              {diagnosticResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">发现以下问题：</div>
                      <ul className="list-disc list-inside space-y-1">
                        {diagnosticResult.errors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* 详细信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">浏览器信息</h4>
                  <div className="text-sm space-y-1">
                    <div>类型: {getBrowserName(diagnosticResult.browserInfo)}</div>
                    <div>User Agent: <code className="text-xs">{diagnosticResult.browserInfo.userAgent}</code></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">合成器状态</h4>
                  <div className="text-sm space-y-1">
                    <div>正在播放: {diagnosticResult.synthesisState.speaking ? '是' : '否'}</div>
                    <div>队列中: {diagnosticResult.synthesisState.pending ? '是' : '否'}</div>
                    <div>已暂停: {diagnosticResult.synthesisState.paused ? '是' : '否'}</div>
                  </div>
                </div>
              </div>

              {/* 语音列表 */}
              {diagnosticResult.currentVoices.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">可用语音 ({diagnosticResult.currentVoices.length})</h4>
                  <div className="max-h-40 overflow-y-auto border rounded p-2">
                    {diagnosticResult.currentVoices.map((voice, index) => (
                      <div key={index} className="text-sm py-1 flex justify-between">
                        <span>{voice.name}</span>
                        <span className="text-muted-foreground">
                          {voice.lang} {voice.localService ? '(本地)' : '(远程)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TTS 测试 */}
      <Card>
        <CardHeader>
          <CardTitle>TTS 功能测试</CardTitle>
          <CardDescription>
            测试基础 TTS 功能和 useSpeech Hook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">测试文本</label>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="输入要测试的文本..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={runBasicTest} 
              disabled={isTestingTTS || !testText.trim()}
              variant="outline"
            >
              {isTestingTTS && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              基础 API 测试
            </Button>

            <Button 
              onClick={testWithUseSpeech} 
              disabled={playbackState.isPlaying || !testText.trim()}
            >
              <Play className="mr-2 h-4 w-4" />
              useSpeech 测试
            </Button>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">
                    {testResult.success ? '✓ 基础 TTS 测试成功' : '✗ 基础 TTS 测试失败'}
                  </div>
                  <div className="text-sm">
                    耗时: {testResult.duration}ms
                  </div>
                  {testResult.error && (
                    <div className="text-sm">错误: {testResult.error}</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 播放状态 */}
          {playbackState.isPlaying && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                正在播放: {playbackState.currentText.substring(0, 50)}...
                <br />
                进度: {Math.round(playbackState.progress)}%
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Chrome 特殊说明 */}
      {diagnosticResult?.browserInfo.isChrome && (
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">Chrome 特殊注意事项</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>• Chrome 要求用户先与页面交互才能播放语音</div>
            <div>• 确保页面是通过 HTTPS 访问的（本地开发除外）</div>
            <div>• Chrome 的语音列表加载可能需要时间</div>
            <div>• 检查浏览器设置中是否禁用了语音合成</div>
            <div>• 尝试在浏览器地址栏输入 chrome://settings/content/sound 检查声音设置</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}