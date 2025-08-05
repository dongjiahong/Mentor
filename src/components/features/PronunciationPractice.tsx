import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  Square, 

  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Volume2,
  Target,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { PronunciationEvaluator } from '@/services/pronunciation/PronunciationEvaluator';
import { AppError, PronunciationScore } from '@/types';
import { cn } from '@/lib/utils';

export interface PronunciationPracticeProps {
  className?: string;
  targetText: string;
  practiceType?: 'word' | 'sentence' | 'paragraph';
  difficulty?: 'easy' | 'medium' | 'hard';
  showDetailedAnalysis?: boolean;
  onScoreUpdate?: (score: PronunciationScore) => void;
  onComplete?: (finalScore: PronunciationScore) => void;
  onError?: (error: AppError) => void;
}

interface PracticeSession {
  attempts: PronunciationScore[];
  bestScore: number;
  averageScore: number;
  startTime: Date;
}

/**
 * 发音练习组件
 * 提供专业的发音评估和练习界面
 */
export function PronunciationPractice({
  className,
  targetText,
  practiceType = 'sentence',
  difficulty = 'medium',
  showDetailedAnalysis = true,
  onScoreUpdate,
  onComplete,
  onError
}: PronunciationPracticeProps) {
  const [currentScore, setCurrentScore] = useState<PronunciationScore | null>(null);
  const [session, setSession] = useState<PracticeSession>({
    attempts: [],
    bestScore: 0,
    averageScore: 0,
    startTime: new Date()
  });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeTab, setActiveTab] = useState('practice');

  const { speak } = useSpeech({ onError });

  const {
    state,
    result,
    startRecording,
    stopRecording,
    resetResult
  } = useVoiceRecognition({
    onRecordingComplete: async (text: string) => {
      if (text.trim() && targetText.trim()) {
        setIsEvaluating(true);
        try {
          const score = PronunciationEvaluator.evaluate(targetText, text);
          setCurrentScore(score);
          updateSession(score);
          onScoreUpdate?.(score);
        } catch (error) {
          onError?.(error as AppError);
        } finally {
          setIsEvaluating(false);
        }
      }
    },
    onError,
    timeout: 30000
  });

  // 更新练习会话数据
  const updateSession = useCallback((score: PronunciationScore) => {
    setSession(prev => {
      const newAttempts = [...prev.attempts, score];
      const bestScore = Math.max(prev.bestScore, score.overallScore);
      const averageScore = Math.round(
        newAttempts.reduce((sum, s) => sum + s.overallScore, 0) / newAttempts.length
      );

      const newSession = {
        ...prev,
        attempts: newAttempts,
        bestScore,
        averageScore
      };

      // 检查是否达到完成条件
      if (newAttempts.length >= 3 && bestScore >= 80) {
        onComplete?.(score);
      }

      return newSession;
    });
  }, [onComplete]);

  // 播放目标文本
  const playTargetText = useCallback(async () => {
    if (!targetText.trim()) return;
    try {
      await speak(targetText, { rate: 0.8 }); // 稍慢的语速用于练习
    } catch (error) {
      // 错误已在useSpeech中处理
    }
  }, [targetText, speak]);

  // 开始新的录音
  const startNewRecording = useCallback(async () => {
    setCurrentScore(null);
    resetResult();
    await startRecording();
  }, [startRecording, resetResult]);

  // 重置练习会话
  const resetSession = useCallback(() => {
    setSession({
      attempts: [],
      bestScore: 0,
      averageScore: 0,
      startTime: new Date()
    });
    setCurrentScore(null);
    resetResult();
  }, [resetResult]);

  // 获取练习建议
  const getPracticeAdvice = useCallback(() => {
    if (session.attempts.length === 0) {
      return "点击录音按钮开始练习，先听一遍标准发音再跟读。";
    }

    const latestScore = session.attempts[session.attempts.length - 1];
    const { overallScore, accuracyScore, fluencyScore, pronunciationScore } = latestScore;

    const advice: string[] = [];

    if (overallScore < 60) {
      advice.push("建议先多听几遍标准发音，熟悉正确的语音语调。");
    }

    if (accuracyScore < fluencyScore) {
      advice.push("注意单词的准确性，可以先逐个单词练习。");
    }

    if (fluencyScore < accuracyScore) {
      advice.push("提高流利度，尝试连贯地说完整句话。");
    }

    if (pronunciationScore < 70) {
      advice.push("注意发音技巧，特别是元音和辅音的区别。");
    }

    if (session.attempts.length >= 3 && session.bestScore < 70) {
      advice.push("可以尝试降低语速，确保每个音都发准确。");
    }

    return advice.length > 0 ? advice.join(" ") : "继续练习，你做得很好！";
  }, [session]);

  // 获取评分颜色
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 获取评分等级
  const getScoreGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', label: '优秀' };
    if (score >= 80) return { grade: 'B', label: '良好' };
    if (score >= 70) return { grade: 'C', label: '及格' };
    if (score >= 60) return { grade: 'D', label: '需改进' };
    return { grade: 'F', label: '不及格' };
  };

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
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            发音练习
            <Badge variant="outline" className="ml-2">
              {practiceType === 'word' ? '单词' : practiceType === 'sentence' ? '句子' : '段落'}
            </Badge>
            <Badge variant="secondary">
              {difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}
            </Badge>
          </CardTitle>
          
          {session.attempts.length > 0 && (
            <Button variant="outline" size="sm" onClick={resetSession}>
              <RotateCcw className="h-4 w-4 mr-1" />
              重新开始
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="practice">练习</TabsTrigger>
            <TabsTrigger value="analysis">分析</TabsTrigger>
            <TabsTrigger value="progress">进度</TabsTrigger>
          </TabsList>

          <TabsContent value="practice" className="space-y-4">
            {/* 目标文本显示 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  练习文本
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={playTargetText}
                  disabled={state.isRecording}
                >
                  <Volume2 className="h-4 w-4 mr-1" />
                  播放标准发音
                </Button>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-lg leading-relaxed">{targetText}</p>
              </div>
            </div>

            {/* 权限请求 */}
            {!state.hasPermission && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  需要麦克风权限才能进行发音练习。请点击浏览器地址栏的麦克风图标允许访问。
                </AlertDescription>
              </Alert>
            )}

            {/* 录音控制 */}
            {state.hasPermission && (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center gap-3">
                  {state.isRecording ? (
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={stopRecording}
                      className="rounded-full w-20 h-20"
                    >
                      <Square className="h-8 w-8" />
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={startNewRecording}
                      disabled={isEvaluating || !targetText.trim()}
                      className="rounded-full w-20 h-20"
                    >
                      <Mic className="h-8 w-8" />
                    </Button>
                  )}
                </div>

                {/* 状态显示 */}
                <div className="text-center">
                  {state.isRecording && (
                    <div className="flex items-center gap-2 text-red-600">
                      <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                      <span>正在录音...</span>
                    </div>
                  )}
                  {isEvaluating && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                      <span>正在评估...</span>
                    </div>
                  )}
                  {!state.isRecording && !isEvaluating && (
                    <span className="text-muted-foreground">
                      {session.attempts.length === 0 
                        ? "点击录音按钮开始练习" 
                        : "点击录音按钮继续练习"
                      }
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 练习建议 */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>练习建议：</strong>{getPracticeAdvice()}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {currentScore ? (
              <div className="space-y-4">
                {/* 总体评分 */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-3">
                    {currentScore.overallScore >= 80 ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : currentScore.overallScore >= 60 ? (
                      <AlertCircle className="h-8 w-8 text-yellow-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                    <div>
                      <div className={cn("text-3xl font-bold", getScoreColor(currentScore.overallScore))}>
                        {currentScore.overallScore}
                      </div>
                      <div className="text-sm text-muted-foreground">总分</div>
                    </div>
                    <Badge 
                      variant={currentScore.overallScore >= 80 ? "default" : 
                               currentScore.overallScore >= 60 ? "secondary" : "destructive"}
                      className="text-lg px-3 py-1"
                    >
                      {getScoreGrade(currentScore.overallScore).grade}
                    </Badge>
                  </div>
                </div>

                {/* 详细评分 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-background border rounded-lg">
                    <div className={cn("text-2xl font-bold", getScoreColor(currentScore.accuracyScore))}>
                      {currentScore.accuracyScore}
                    </div>
                    <div className="text-sm text-muted-foreground">准确度</div>
                    <Progress value={currentScore.accuracyScore} className="mt-2 h-2" />
                  </div>
                  
                  <div className="text-center p-3 bg-background border rounded-lg">
                    <div className={cn("text-2xl font-bold", getScoreColor(currentScore.fluencyScore))}>
                      {currentScore.fluencyScore}
                    </div>
                    <div className="text-sm text-muted-foreground">流利度</div>
                    <Progress value={currentScore.fluencyScore} className="mt-2 h-2" />
                  </div>
                  
                  <div className="text-center p-3 bg-background border rounded-lg">
                    <div className={cn("text-2xl font-bold", getScoreColor(currentScore.pronunciationScore))}>
                      {currentScore.pronunciationScore}
                    </div>
                    <div className="text-sm text-muted-foreground">发音</div>
                    <Progress value={currentScore.pronunciationScore} className="mt-2 h-2" />
                  </div>
                </div>

                {/* 反馈建议 */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium mb-2">评估反馈</h4>
                  <p className="text-sm">{currentScore.feedback}</p>
                </div>

                {/* 错误分析 */}
                {showDetailedAnalysis && currentScore.mistakes && currentScore.mistakes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">需要改进的地方</h4>
                    <div className="space-y-2">
                      {currentScore.mistakes.map((mistake, index) => (
                        <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {mistake.word && (
                                  <span className="text-red-600">"{mistake.actual}"</span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {mistake.suggestion}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 识别结果对比 */}
                {result && (
                  <div className="space-y-2">
                    <h4 className="font-medium">文本对比</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">目标文本</div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                          {targetText}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">识别结果</div>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                          {result.text || "无内容"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>完成一次录音后查看详细分析</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {session.attempts.length > 0 ? (
              <div className="space-y-4">
                {/* 会话统计 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-background border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {session.attempts.length}
                    </div>
                    <div className="text-sm text-muted-foreground">练习次数</div>
                  </div>
                  
                  <div className="text-center p-3 bg-background border rounded-lg">
                    <div className={cn("text-2xl font-bold", getScoreColor(session.bestScore))}>
                      {session.bestScore}
                    </div>
                    <div className="text-sm text-muted-foreground">最高分</div>
                  </div>
                  
                  <div className="text-center p-3 bg-background border rounded-lg">
                    <div className={cn("text-2xl font-bold", getScoreColor(session.averageScore))}>
                      {session.averageScore}
                    </div>
                    <div className="text-sm text-muted-foreground">平均分</div>
                  </div>
                  
                  <div className="text-center p-3 bg-background border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((Date.now() - session.startTime.getTime()) / 60000)}
                    </div>
                    <div className="text-sm text-muted-foreground">练习时长(分)</div>
                  </div>
                </div>

                {/* 进步趋势 */}
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    练习记录
                  </h4>
                  <div className="space-y-2">
                    {session.attempts.map((attempt, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-background border rounded-lg">
                        <div className="text-sm text-muted-foreground w-12">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-medium", getScoreColor(attempt.overallScore))}>
                              {attempt.overallScore}分
                            </span>
                            <Badge variant="outline">
                              {getScoreGrade(attempt.overallScore).label}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            准确度: {attempt.accuracyScore} | 
                            流利度: {attempt.fluencyScore} | 
                            发音: {attempt.pronunciationScore}
                          </div>
                        </div>
                        {index === session.attempts.length - 1 && (
                          <Badge variant="secondary">最新</Badge>
                        )}
                        {attempt.overallScore === session.bestScore && (
                          <Badge variant="default">最佳</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 完成建议 */}
                {session.bestScore >= 80 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      恭喜！你已经达到了很好的发音水平。可以尝试更难的内容或继续保持练习。
                    </AlertDescription>
                  </Alert>
                ) : session.attempts.length >= 5 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      你已经练习了多次，建议休息一下或尝试其他练习内容，避免疲劳影响效果。
                    </AlertDescription>
                  </Alert>
                ) : null}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>开始练习后查看进度统计</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}