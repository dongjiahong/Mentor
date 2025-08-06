import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  Square, 
  Play, 
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  Lightbulb,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { VoicePracticeSentence, VoiceAttempt, VoiceLearningMode } from '@/types';
import { cn } from '@/lib/utils';

interface VoiceInteractionPanelProps {
  currentSentence: VoicePracticeSentence | null;
  isRecording: boolean;
  recognitionResult: string | null;
  lastAttempt: VoiceAttempt | null;
  isLoading: boolean;
  onPlay: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRetry: () => void;
  onSkip: () => void;
  showTips?: boolean;
  mode?: VoiceLearningMode;
  className?: string;
}

export function VoiceInteractionPanel({
  currentSentence,
  isRecording,
  recognitionResult,
  lastAttempt,
  isLoading,
  onPlay,
  onStartRecording,
  onStopRecording,
  onRetry,
  onSkip,
  showTips = true,
  mode,
  className
}: VoiceInteractionPanelProps) {
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [waveAnimation, setWaveAnimation] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  // 录音计时器
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      setRecordingDuration(0);
      setWaveAnimation(true);
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setWaveAnimation(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // 格式化录音时长
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 获取相似度颜色
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 80) return 'text-green-600';
    if (similarity >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 获取相似度图标
  const getSimilarityIcon = (similarity: number) => {
    if (similarity >= 80) return CheckCircle;
    if (similarity >= 60) return AlertTriangle;
    return XCircle;
  };

  // 获取相似度描述
  const getSimilarityDescription = (similarity: number) => {
    if (similarity >= 90) return '优秀';
    if (similarity >= 80) return '良好';
    if (similarity >= 60) return '及格';
    return '需要改进';
  };

  if (!currentSentence) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Mic className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>请选择学习内容开始练习</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="h-5 w-5" />
            语音练习
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            难度: {currentSentence.difficulty}/5
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 目标句子显示 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">目标句子</h4>
            <div className="flex items-center gap-2">
              {mode === 'listening_comprehension' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="h-8 px-3"
                >
                  {showTranslation ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      隐藏翻译
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      显示翻译
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onPlay}
                disabled={isRecording}
                className="h-8 px-3"
              >
                <Volume2 className="h-4 w-4 mr-1" />
                播放
              </Button>
            </div>
          </div>
          
          <div className="p-4 bg-muted/50 rounded-lg border">
            <p className="text-foreground font-medium mb-2">
              {currentSentence.text}
            </p>
            {(mode !== 'listening_comprehension' || showTranslation) && (
              <p className="text-sm text-muted-foreground">
                {currentSentence.translation}
              </p>
            )}
          </div>
          
          {/* 音标和提示 */}
          {(currentSentence.phonetic || currentSentence.tips) && (
            <div className="space-y-2">
              {currentSentence.phonetic && (
                <div className="text-sm">
                  <span className="text-muted-foreground">音标: </span>
                  <span className="font-mono text-primary">
                    {currentSentence.phonetic}
                  </span>
                </div>
              )}
              
              {showTips && currentSentence.tips && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>发音提示：</strong>{currentSentence.tips}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* 录音控制区域 */}
        <div className="space-y-4">
          <div className="flex flex-col items-center space-y-4">
            {/* 主要控制按钮 */}
            <div className="flex items-center gap-3">
              {isRecording ? (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={onStopRecording}
                  className="rounded-full w-16 h-16 relative"
                >
                  <Square className="h-6 w-6" />
                  {waveAnimation && (
                    <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping" />
                  )}
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={onStartRecording}
                  disabled={isLoading}
                  className="rounded-full w-16 h-16"
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>
              )}
            </div>

            {/* 状态显示 */}
            <div className="text-center min-h-[40px] flex items-center justify-center">
              {isRecording && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  <span className="font-medium">
                    录音中 {formatDuration(recordingDuration)}
                  </span>
                </div>
              )}
              
              {isLoading && !isRecording && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>正在处理...</span>
                </div>
              )}
              
              {!isRecording && !isLoading && !lastAttempt && (
                <span className="text-muted-foreground">
                  点击麦克风开始录音
                </span>
              )}
            </div>
          </div>

          {/* 辅助控制按钮 */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isRecording || isLoading}
              className="h-9"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              重录
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onSkip}
              disabled={isRecording || isLoading}
              className="h-9"
            >
              <SkipForward className="h-4 w-4 mr-1" />
              跳过
            </Button>
          </div>
        </div>

        {/* 识别结果显示 */}
        {recognitionResult && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              识别结果
            </h4>
            <div className="p-3 bg-background border rounded-lg">
              <p className="text-sm">
                {recognitionResult || "未识别到内容"}
              </p>
            </div>
          </div>
        )}

        {/* 评估结果显示 */}
        {lastAttempt && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              评估结果
            </h4>
            
            <div className="p-4 bg-background border rounded-lg space-y-3">
              {/* 相似度得分 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const IconComponent = getSimilarityIcon(lastAttempt.similarity);
                    return (
                      <IconComponent 
                        className={cn("h-5 w-5", getSimilarityColor(lastAttempt.similarity))} 
                      />
                    );
                  })()}
                  <span className="font-medium">相似度得分</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xl font-bold",
                    getSimilarityColor(lastAttempt.similarity)
                  )}>
                    {lastAttempt.similarity}%
                  </span>
                  <Badge 
                    variant={lastAttempt.similarity >= 80 ? "default" : 
                            lastAttempt.similarity >= 60 ? "secondary" : "destructive"}
                  >
                    {getSimilarityDescription(lastAttempt.similarity)}
                  </Badge>
                </div>
              </div>

              {/* 进度条 */}
              <Progress 
                value={lastAttempt.similarity} 
                className={cn(
                  "h-2",
                  lastAttempt.similarity >= 80 ? "bg-green-100" :
                  lastAttempt.similarity >= 60 ? "bg-yellow-100" : "bg-red-100"
                )}
              />

              {/* 发音评分详情 */}
              {lastAttempt.pronunciationScore && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <div className="text-sm font-medium">准确度</div>
                    <div className={cn(
                      "text-lg font-bold",
                      getSimilarityColor(lastAttempt.pronunciationScore.accuracyScore)
                    )}>
                      {lastAttempt.pronunciationScore.accuracyScore}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">流利度</div>
                    <div className={cn(
                      "text-lg font-bold",
                      getSimilarityColor(lastAttempt.pronunciationScore.fluencyScore)
                    )}>
                      {lastAttempt.pronunciationScore.fluencyScore}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">发音</div>
                    <div className={cn(
                      "text-lg font-bold",
                      getSimilarityColor(lastAttempt.pronunciationScore.pronunciationScore)
                    )}>
                      {lastAttempt.pronunciationScore.pronunciationScore}
                    </div>
                  </div>
                </div>
              )}

              {/* 反馈建议 */}
              {lastAttempt.pronunciationScore?.feedback && (
                <Alert className="mt-3">
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    {lastAttempt.pronunciationScore.feedback}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}