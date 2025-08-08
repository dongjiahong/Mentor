import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  Square, 
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useSpeech } from '@/hooks/useSpeech';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { PronunciationEvaluator } from '@/services/language/pronunciation/PronunciationEvaluator';
import { AppError, PronunciationScore } from '@/types';
import { cn } from '@/lib/utils';

export interface VoiceRecorderProps {
  className?: string;
  targetText: string;
  placeholder?: string;
  showTargetText?: boolean;
  showComparison?: boolean;
  showPronunciationScore?: boolean;
  autoEvaluate?: boolean;
  onRecordingStart?: () => void;
  onRecordingComplete?: (result: string, score?: PronunciationScore) => void;
  onError?: (error: AppError) => void;
}



/**
 * 语音录制组件
 * 支持语音识别、文本对比和发音评估
 */
export function VoiceRecorder({
  className,
  targetText,
  placeholder = "点击录音按钮开始录制...",
  showTargetText = true,
  showComparison = true,
  showPronunciationScore = true,
  autoEvaluate = true,
  onRecordingStart,
  onRecordingComplete,
  onError
}: VoiceRecorderProps) {
  const [pronunciationScore, setPronunciationScore] = useState<PronunciationScore | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const { speak } = useSpeech({ onError });

  const {
    state,
    result,
    options,
    setOptions,
    requestPermission,
    startRecording: startVoiceRecording,
    stopRecording,
    resetResult
  } = useVoiceRecognition({
    onRecordingStart,
    onRecordingComplete: async (text: string) => {
      if (autoEvaluate && text.trim() && targetText.trim()) {
        setIsEvaluating(true);
        try {
          const score = PronunciationEvaluator.evaluate(targetText, text);
          setPronunciationScore(score);
          onRecordingComplete?.(text, score);
        } catch (error) {
          onError?.(error as AppError);
        } finally {
          setIsEvaluating(false);
        }
      } else {
        onRecordingComplete?.(text);
      }
    },
    onError,
    timeout: 30000
  });

  // 开始录音
  const startRecording = useCallback(async () => {
    setPronunciationScore(null);
    await startVoiceRecording();
  }, [startVoiceRecording]);

  // 重新录制
  const resetRecording = useCallback(() => {
    resetResult();
    setPronunciationScore(null);
  }, [resetResult]);

  // 播放目标文本
  const playTargetText = useCallback(async () => {
    if (!targetText.trim()) return;
    try {
      await speak(targetText);
    } catch (error) {
      // 错误已在useSpeech中处理
    }
  }, [targetText, speak]);

  // 如果不支持语音识别，显示提示
  if (!state.isSupported) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              当前浏览器不支持语音识别功能。请使用Chrome、Edge或其他支持Web Speech API的浏览器。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">语音录制</CardTitle>
          
          {/* 设置按钮 */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">识别设置</h4>
                
                {/* 语言选择 */}
                <div className="space-y-2">
                  <Label>识别语言</Label>
                  <Select
                    value={options.lang}
                    onValueChange={(value) => 
                      setOptions({ ...options, lang: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">英语 (美国)</SelectItem>
                      <SelectItem value="en-GB">英语 (英国)</SelectItem>
                      <SelectItem value="en-AU">英语 (澳大利亚)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 候选数量 */}
                <div className="space-y-2">
                  <Label>候选结果数量: {options.maxAlternatives}</Label>
                  <Slider
                    value={[options.maxAlternatives || 1]}
                    onValueChange={(value) => 
                      setOptions({ ...options, maxAlternatives: value[0] })
                    }
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 目标文本显示 */}
        {showTargetText && targetText && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">目标文本</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={playTargetText}
                disabled={state.isRecording}
              >
                <Play className="h-4 w-4 mr-1" />
                播放
              </Button>
            </div>
            <div className="p-3 bg-muted rounded-md text-sm">
              {targetText}
            </div>
          </div>
        )}

        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="p-2 bg-gray-100 rounded text-xs">
            <div>支持STT: {state.isSupported ? '是' : '否'}</div>
            <div>有权限: {state.hasPermission ? '是' : '否'}</div>
            <div>已请求权限: {state.permissionRequested ? '是' : '否'}</div>
            <div>正在录音: {state.isRecording ? '是' : '否'}</div>
          </div>
        )}

        {/* 录音控制 */}
        <div className="flex flex-col items-center space-y-4">
          {/* 权限请求 */}
          {!state.hasPermission && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>需要麦克风权限才能进行语音录制</p>
                  {!state.permissionRequested ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestPermission}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      请求麦克风权限
                    </Button>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      <p>如果权限被拒绝，请：</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>点击地址栏左侧的麦克风图标</li>
                        <li>选择"允许"访问麦克风</li>
                        <li>刷新页面重试</li>
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 录音按钮 */}
          {state.hasPermission && (
            <div className="flex items-center gap-2">
              {state.isRecording ? (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRecording}
                  className="rounded-full w-16 h-16"
                >
                  <Square className="h-6 w-6" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={startRecording}
                  disabled={isEvaluating || !targetText.trim()}
                  className="rounded-full w-16 h-16"
                >
                  <Mic className="h-6 w-6" />
                </Button>
              )}

              {result && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetRecording}
                  disabled={state.isRecording || isEvaluating}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  重录
                </Button>
              )}
            </div>
          )}

          {/* 状态显示 */}
          <div className="text-center">
            {state.isRecording && (
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <span className="text-sm">正在录音...</span>
              </div>
            )}
            {isEvaluating && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-sm">正在评估...</span>
              </div>
            )}
            {!state.isRecording && !isEvaluating && !result && (
              <span className="text-sm text-muted-foreground">{placeholder}</span>
            )}
          </div>
        </div>

        {/* 识别结果 */}
        {result && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">识别结果</Label>
            <div className="p-3 bg-background border rounded-md">
              <p className="text-sm">{result.text || "未识别到内容"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                录制时间: {result.timestamp.toLocaleTimeString()}
                {result.confidence && (
                  <span className="ml-2">置信度: {Math.round(result.confidence * 100)}%</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* 文本对比 */}
        {showComparison && result && targetText && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">文本对比</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">目标文本</Label>
                <div className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                  {targetText}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">识别结果</Label>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  {result.text || "无内容"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 发音评分 */}
        {showPronunciationScore && pronunciationScore && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">发音评估</Label>
            
            {/* 总体评分 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {pronunciationScore.overallScore >= 80 ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : pronunciationScore.overallScore >= 60 ? (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">总分: {pronunciationScore.overallScore}</span>
              </div>
              <Badge 
                variant={
                  pronunciationScore.overallScore >= 80 ? "default" : 
                  pronunciationScore.overallScore >= 60 ? "secondary" : "destructive"
                }
              >
                {pronunciationScore.overallScore >= 80 ? "优秀" : 
                 pronunciationScore.overallScore >= 60 ? "良好" : "需要改进"}
              </Badge>
            </div>

            {/* 详细评分 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">准确度</span>
                <span className="text-sm font-medium">{pronunciationScore.accuracyScore}</span>
              </div>
              <Progress value={pronunciationScore.accuracyScore} className="h-2" />
              
              <div className="flex justify-between items-center">
                <span className="text-sm">流利度</span>
                <span className="text-sm font-medium">{pronunciationScore.fluencyScore}</span>
              </div>
              <Progress value={pronunciationScore.fluencyScore} className="h-2" />
            </div>

            {/* 反馈建议 */}
            {pronunciationScore.feedback && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm">{pronunciationScore.feedback}</p>
              </div>
            )}

            {/* 错误详情 */}
            {pronunciationScore.mistakes && pronunciationScore.mistakes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">需要注意的地方</Label>
                <div className="space-y-1">
                  {pronunciationScore.mistakes.map((mistake, index) => (
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
  );
}