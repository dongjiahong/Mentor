import { useState } from 'react';
import { VoiceRecorder } from '@/components/features';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppError, PronunciationScore } from '@/types';

/**
 * 语音录制测试页面
 */
export function VoiceRecorderTestPage() {
  const [targetText, setTargetText] = useState('Hello, how are you today?');
  const [lastResult, setLastResult] = useState<string>('');
  const [lastScore, setLastScore] = useState<PronunciationScore | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const handleRecordingComplete = (result: string, score?: PronunciationScore) => {
    setLastResult(result);
    setLastScore(score || null);
    setError(null);
  };

  const handleError = (error: AppError) => {
    setError(error);
  };

  const clearResults = () => {
    setLastResult('');
    setLastScore(null);
    setError(null);
  };

  const sampleTexts = [
    'Hello, how are you today?',
    'The weather is beautiful today.',
    'I would like to order a coffee, please.',
    'Can you help me find the nearest subway station?',
    'Thank you very much for your assistance.',
    'What time does the meeting start tomorrow?'
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">语音录制测试</h1>
        <p className="text-muted-foreground">
          测试STT（语音转文本）功能和发音评估
        </p>
      </div>

      {/* 目标文本设置 */}
      <Card>
        <CardHeader>
          <CardTitle>设置目标文本</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-text">目标文本</Label>
            <Input
              id="target-text"
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              placeholder="输入要练习的英文句子..."
            />
          </div>
          
          <div className="space-y-2">
            <Label>快速选择示例文本</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sampleTexts.map((text, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setTargetText(text)}
                  className="text-left justify-start h-auto p-2"
                >
                  {text}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={clearResults} variant="outline">
              清除结果
            </Button>
            <Button 
              onClick={() => {
                const utterance = new SpeechSynthesisUtterance('测试语音播放功能');
                utterance.lang = 'zh-CN';
                speechSynthesis.speak(utterance);
              }} 
              variant="outline"
            >
              测试TTS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 语音录制组件 */}
      <VoiceRecorder
        targetText={targetText}
        showTargetText={true}
        showComparison={true}
        showPronunciationScore={true}
        autoEvaluate={true}
        onRecordingComplete={handleRecordingComplete}
        onError={handleError}
      />

      {/* 错误显示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>错误:</strong> {error.message}
            {error.recoverable && (
              <span className="block mt-1 text-sm">
                这是一个可恢复的错误，请重试。
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* 结果显示 */}
      {(lastResult || lastScore) && (
        <Card>
          <CardHeader>
            <CardTitle>最近的录制结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lastResult && (
              <div>
                <Label className="text-sm font-medium">识别文本</Label>
                <div className="p-3 bg-muted rounded-md mt-1">
                  <p className="text-sm">{lastResult}</p>
                </div>
              </div>
            )}

            {lastScore && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">发音评估详情</Label>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-md">
                    <div className="text-2xl font-bold text-primary">
                      {lastScore.overallScore}
                    </div>
                    <div className="text-xs text-muted-foreground">总分</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-md">
                    <div className="text-2xl font-bold text-blue-600">
                      {lastScore.accuracyScore}
                    </div>
                    <div className="text-xs text-muted-foreground">准确度</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-md">
                    <div className="text-2xl font-bold text-green-600">
                      {lastScore.fluencyScore}
                    </div>
                    <div className="text-xs text-muted-foreground">流利度</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-md">
                    <div className="text-2xl font-bold text-purple-600">
                      {lastScore.pronunciationScore}
                    </div>
                    <div className="text-xs text-muted-foreground">发音</div>
                  </div>
                </div>

                {lastScore.feedback && (
                  <div>
                    <Label className="text-sm font-medium">反馈建议</Label>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mt-1">
                      <p className="text-sm">{lastScore.feedback}</p>
                    </div>
                  </div>
                )}

                {lastScore.mistakes && lastScore.mistakes.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">
                      需要改进的地方 ({lastScore.mistakes.length})
                    </Label>
                    <div className="space-y-2 mt-1">
                      {lastScore.mistakes.map((mistake, index) => (
                        <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                          <span className="font-medium">{mistake.word}</span>: {mistake.suggestion}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>1. 在上方输入框中设置要练习的英文句子，或选择示例文本</p>
          <p>2. 点击"播放"按钮听标准发音</p>
          <p>3. 点击麦克风按钮开始录音，系统会自动识别您的语音</p>
          <p>4. 录音完成后，系统会显示识别结果和发音评估</p>
          <p>5. 可以通过设置按钮调整识别语言和其他参数</p>
          <p>6. 支持的浏览器：Chrome、Edge、Safari等支持Web Speech API的浏览器</p>
        </CardContent>
      </Card>
    </div>
  );
}