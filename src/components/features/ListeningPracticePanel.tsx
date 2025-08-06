import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Headphones,
  ArrowLeft,
  Settings,
  BookOpen,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ListeningPracticeContent, 
  ListeningQuestion, 
  UniversalContent,
  LISTENING_PRACTICE_TYPE_DESCRIPTIONS
} from '@/types';
import { getDefaultSpeechService } from '@/services/speech/SpeechService';

interface ListeningPracticePanelProps {
  content: ListeningPracticeContent | UniversalContent;
  onBack: () => void;
  onComplete: () => void;
  className?: string;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  timeSpent: number;
}

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isLoading: boolean;
  error: string | null;
  progress: number;
}

// 播放速度选项
const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5];

// 将UniversalContent转换为ListeningPracticeContent
function convertToListeningContent(content: UniversalContent): ListeningPracticeContent {
  return {
    id: content.id,
    title: content.title,
    description: content.description,
    level: content.level,
    category: content.category,
    practiceType: 'comprehension',
    audioUrl: content.audioUrl || '/audio/placeholder.mp3',
    transcript: content.originalText,
    duration: content.estimatedDuration * 60, // 转换为秒
    questions: [], // 可以根据内容动态生成问题
    estimatedDuration: content.estimatedDuration,
    playbackSpeed: [0.75, 1.0, 1.25],
    difficulty: 3
  };
}

export function ListeningPracticePanel({
  content,
  onBack,
  onComplete,
  className
}: ListeningPracticePanelProps) {
  // 确保content是ListeningPracticeContent类型
  const listeningContent: ListeningPracticeContent = 
    'practiceType' in content ? content : convertToListeningContent(content);

  const speechService = getDefaultSpeechService();
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1,
    isLoading: false,
    error: null,
    progress: 0
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<string, UserAnswer>>(new Map());
  const [showTranscript, setShowTranscript] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // TTS音频控制处理函数
  const handlePlayPause = useCallback(async () => {
    if (audioState.isPlaying) {
      speechService.stopSpeech();
      setAudioState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
    } else {
      try {
        setAudioState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // 设置TTS播放事件监听器
        speechService.setPlaybackEvents({
          onStart: () => {
            const estimatedDuration = speechService.estimateSpeechDuration(
              listeningContent.transcript || listeningContent.title,
              audioState.playbackRate
            ) / 1000;
            setAudioState(prev => ({ 
              ...prev, 
              isPlaying: true, 
              isLoading: false,
              duration: estimatedDuration
            }));
          },
          onEnd: () => {
            setAudioState(prev => ({ ...prev, isPlaying: false, progress: 100, currentTime: audioState.duration }));
          },
          onProgress: (progress) => {
            setAudioState(prev => ({ 
              ...prev, 
              progress,
              currentTime: (progress / 100) * prev.duration
            }));
          },
          onError: (error) => {
            setAudioState(prev => ({ ...prev, error: error.message, isLoading: false, isPlaying: false }));
          }
        });
        
        // 使用学习内容的文本进行TTS播放
        const textToSpeak = listeningContent.transcript || listeningContent.title;
        await speechService.speak(textToSpeak, {
          rate: audioState.playbackRate,
          volume: audioState.volume,
          lang: 'en-US'
        });
      } catch (error) {
        setAudioState(prev => ({ ...prev, error: 'TTS播放失败', isLoading: false, isPlaying: false }));
      }
    }
  }, [audioState.isPlaying, audioState.playbackRate, audioState.volume, listeningContent, speechService]);

  const handleStop = useCallback(() => {
    speechService.stopSpeech();
    setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0, progress: 0 }));
  }, [speechService]);

  const handleSeek = useCallback((time: number) => {
    // TTS不支持跳转，但我们可以更新UI状态
    // 如果需要跳转功能，需要重新开始播放
    if (audioState.isPlaying) {
      speechService.stopSpeech();
      setAudioState(prev => ({ ...prev, currentTime: time, progress: (time / prev.duration) * 100 }));
    } else {
      setAudioState(prev => ({ ...prev, currentTime: time, progress: (time / prev.duration) * 100 }));
    }
  }, [audioState.isPlaying, speechService]);

  const handleVolumeChange = useCallback((volume: number) => {
    const newVolume = volume / 100;
    setAudioState(prev => ({ ...prev, volume: newVolume }));
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setAudioState(prev => ({ ...prev, playbackRate: rate }));
    // 如果正在播放，需要重新开始播放以应用新的速度
    if (audioState.isPlaying) {
      speechService.stopSpeech();
      // 延迟一点时间后重新播放
      setTimeout(() => {
        handlePlayPause();
      }, 100);
    }
  }, [audioState.isPlaying, speechService, handlePlayPause]);

  // TTS 初始化
  useEffect(() => {
    // 设置估计的音频时长
    if (listeningContent.transcript) {
      const estimatedDuration = speechService.estimateSpeechDuration(
        listeningContent.transcript,
        1.0
      ) / 1000;
      setAudioState(prev => ({ ...prev, duration: estimatedDuration }));
    }

    // 清理资源
    return () => {
      speechService.stopSpeech();
    };
  }, [listeningContent.transcript, speechService]);

  // 处理答案提交
  const handleAnswerSubmit = useCallback((questionId: string, answer: string) => {
    const timeSpent = Date.now() - questionStartTime;
    const question = listeningContent.questions?.[currentQuestionIndex];
    
    if (!question) return;

    const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.toLowerCase();
    
    setUserAnswers(prev => new Map(prev.set(questionId, {
      questionId,
      answer,
      isCorrect,
      timeSpent
    })));

    // 自动跳转到下一题
    if (currentQuestionIndex < (listeningContent.questions?.length || 0) - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionStartTime(Date.now());
      }, 1500);
    } else {
      // 所有题目完成，显示结果
      setTimeout(() => {
        setShowResults(true);
      }, 1500);
    }
  }, [currentQuestionIndex, listeningContent.questions, questionStartTime]);

  // 渲染问题
  const renderQuestion = (question: ListeningQuestion, index: number) => {
    const userAnswer = userAnswers.get(question.id);
    const isAnswered = userAnswer !== undefined;

    return (
      <Card key={question.id} className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              问题 {index + 1}
            </CardTitle>
            <Badge variant={isAnswered ? 
              (userAnswer?.isCorrect ? "default" : "destructive") : 
              "secondary"
            }>
              {isAnswered ? (userAnswer?.isCorrect ? "正确" : "错误") : "未答"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base font-medium">{question.question}</p>
          
          {/* 音频时间提示 */}
          {question.startTime !== undefined && question.endTime !== undefined && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>相关音频: {Math.floor(question.startTime / 60)}:{String(Math.floor(question.startTime % 60)).padStart(2, '0')} - {Math.floor(question.endTime / 60)}:{String(Math.floor(question.endTime % 60)).padStart(2, '0')}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSeek(question.startTime!)}
                className="h-6 px-2"
              >
                跳转
              </Button>
            </div>
          )}

          {/* 问题类型特定的输入 */}
          {question.type === 'multiple_choice' && question.options && (
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <Button
                  key={optionIndex}
                  variant={
                    isAnswered
                      ? option === question.correctAnswer
                        ? "default"
                        : option === userAnswer?.answer
                          ? "destructive"
                          : "outline"
                      : "outline"
                  }
                  className="w-full justify-start text-left"
                  onClick={() => !isAnswered && handleAnswerSubmit(question.id, option)}
                  disabled={isAnswered}
                >
                  <span className="mr-2 font-mono">
                    {String.fromCharCode(65 + optionIndex)}.
                  </span>
                  {option}
                  {isAnswered && option === question.correctAnswer && (
                    <CheckCircle className="h-4 w-4 ml-auto" />
                  )}
                  {isAnswered && option === userAnswer?.answer && option !== question.correctAnswer && (
                    <XCircle className="h-4 w-4 ml-auto" />
                  )}
                </Button>
              ))}
            </div>
          )}

          {question.type === 'fill_blank' && (
            <div className="space-y-2">
              <Input
                placeholder="请输入答案..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value && !isAnswered) {
                    handleAnswerSubmit(question.id, e.currentTarget.value);
                  }
                }}
                disabled={isAnswered}
              />
              {!isAnswered && (
                <p className="text-sm text-muted-foreground">
                  输入答案后按回车键确认
                </p>
              )}
            </div>
          )}

          {question.type === 'true_false' && (
            <div className="flex gap-2">
              <Button
                variant={
                  isAnswered
                    ? question.correctAnswer === 'true'
                      ? "default"
                      : userAnswer?.answer === 'true'
                        ? "destructive"
                        : "outline"
                    : "outline"
                }
                onClick={() => !isAnswered && handleAnswerSubmit(question.id, 'true')}
                disabled={isAnswered}
                className="flex-1"
              >
                正确
                {isAnswered && question.correctAnswer === 'true' && (
                  <CheckCircle className="h-4 w-4 ml-2" />
                )}
              </Button>
              <Button
                variant={
                  isAnswered
                    ? question.correctAnswer === 'false'
                      ? "default"
                      : userAnswer?.answer === 'false'
                        ? "destructive"
                        : "outline"
                    : "outline"
                }
                onClick={() => !isAnswered && handleAnswerSubmit(question.id, 'false')}
                disabled={isAnswered}
                className="flex-1"
              >
                错误
                {isAnswered && question.correctAnswer === 'false' && (
                  <CheckCircle className="h-4 w-4 ml-2" />
                )}
              </Button>
            </div>
          )}

          {question.type === 'short_answer' && (
            <div className="space-y-2">
              <Textarea
                placeholder="请输入你的答案..."
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && e.currentTarget.value && !isAnswered) {
                    handleAnswerSubmit(question.id, e.currentTarget.value);
                  }
                }}
                disabled={isAnswered}
              />
              {!isAnswered && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    按 Ctrl + Enter 提交答案
                  </p>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                      if (textarea?.value) {
                        handleAnswerSubmit(question.id, textarea.value);
                      }
                    }}
                  >
                    提交
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 答案解释 */}
          {isAnswered && question.explanation && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>解释：</strong>{question.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // 计算总体得分
  const calculateScore = () => {
    if (!listeningContent.questions || listeningContent.questions.length === 0) return 0;
    
    const correctAnswers = Array.from(userAnswers.values()).filter(answer => answer.isCorrect).length;
    return Math.round((correctAnswers / listeningContent.questions.length) * 100);
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={cn("max-w-4xl mx-auto p-4 space-y-6", className)}>

      {/* 返回按钮 */}
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      {/* 头部信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{listeningContent.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{listeningContent.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {LISTENING_PRACTICE_TYPE_DESCRIPTIONS[listeningContent.practiceType]}
              </Badge>
              <Badge variant="outline">
                {listeningContent.level}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 音频播放器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            音频播放器
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 错误状态 */}
          {audioState.error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg">
              {audioState.error}
            </div>
          )}

          {/* 播放进度 */}
          <div className="space-y-2">
            <Progress 
              value={audioState.progress}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(audioState.currentTime)}</span>
              <span>{formatTime(audioState.duration)}</span>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              使用 TTS 语音播放，不支持跳转功能
            </div>
          </div>

          {/* 播放控件 */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSeek(Math.max(0, audioState.currentTime - 10))}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={handlePlayPause}
              disabled={audioState.isLoading}
              className="h-12 w-12"
            >
              {audioState.isPlaying ? 
                <Pause className="h-5 w-5" /> : 
                <Play className="h-5 w-5" />
              }
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleStop}>
              <Square className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSeek(Math.min(audioState.duration, audioState.currentTime + 10))}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* 播放设置 */}
          <div className="flex items-center justify-between gap-4">
            {/* 音量控制 */}
            <div className="flex items-center gap-2 flex-1">
              {audioState.volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              <Slider
                value={[audioState.volume * 100]}
                onValueChange={([value]) => handleVolumeChange(value)}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>

            {/* 播放速度 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">速度:</span>
              {playbackSpeeds.map(speed => (
                <Button
                  key={speed}
                  variant={audioState.playbackRate === speed ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePlaybackRateChange(speed)}
                >
                  {speed}x
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 听力文稿 */}
      {listeningContent.transcript && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                听力文稿
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTranscript(!showTranscript)}
              >
                {showTranscript ? '隐藏' : '显示'}文稿
              </Button>
            </div>
          </CardHeader>
          {showTranscript && (
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <p className="leading-relaxed whitespace-pre-wrap">
                  {listeningContent.transcript}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* 练习题目 */}
      {listeningContent.questions && listeningContent.questions.length > 0 && !showResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">听力练习题</h3>
            <div className="text-sm text-muted-foreground">
              {userAnswers.size} / {listeningContent.questions.length} 已完成
            </div>
          </div>
          
          {/* 进度条 */}
          <Progress 
            value={(userAnswers.size / listeningContent.questions.length) * 100}
            className="w-full"
          />

          {/* 当前题目 */}
          {listeningContent.questions[currentQuestionIndex] && 
            renderQuestion(listeningContent.questions[currentQuestionIndex], currentQuestionIndex)
          }

          {/* 题目导航 */}
          {listeningContent.questions.length > 1 && (
            <div className="flex justify-center gap-2">
              {listeningContent.questions.map((_, index) => (
                <Button
                  key={index}
                  variant={index === currentQuestionIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCurrentQuestionIndex(index);
                    setQuestionStartTime(Date.now());
                  }}
                  className={cn(
                    "w-10 h-10",
                    userAnswers.has(listeningContent.questions![index].id) && 
                    "ring-2 ring-green-500"
                  )}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 结果页面 */}
      {showResults && listeningContent.questions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">练习完成！</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 得分显示 */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {calculateScore()}%
              </div>
              <p className="text-muted-foreground">
                正确 {Array.from(userAnswers.values()).filter(a => a.isCorrect).length} / {listeningContent.questions.length}
              </p>
            </div>

            {/* 详细结果 */}
            <div className="space-y-3">
              {listeningContent.questions.map((question, index) => {
                const userAnswer = userAnswers.get(question.id);
                return (
                  <div key={question.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">问题 {index + 1}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {question.question}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {userAnswer?.isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {userAnswer ? Math.round(userAnswer.timeSpent / 1000) + 's' : '未答'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setUserAnswers(new Map());
                setQuestionStartTime(Date.now());
              }} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                重新练习
              </Button>
              <Button onClick={onComplete} className="flex-1">
                完成练习
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 无题目时的提示 */}
      {(!listeningContent.questions || listeningContent.questions.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">纯听力练习</h3>
            <p className="text-muted-foreground mb-4">
              专心听音频，提升听力理解能力
            </p>
            <Button onClick={onComplete}>
              完成练习
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}