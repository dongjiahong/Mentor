import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft,
  ChevronLeft, 
  ChevronRight,
  Play,
  Pause,
  Square,
  RotateCcw,
  Settings,
  BookOpen,
  Users,
  List,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import { VoiceInteractionPanel } from './VoiceInteractionPanel';
import { ProgressFeedbackCard } from './ProgressFeedbackCard';
import { useVoiceLearning } from '@/hooks/useVoiceLearning';
import { 
  VoiceLearningMode, 
  VoicePracticeContent, 
  DialoguePracticeScenario,
  AppError 
} from '@/types';
import { cn } from '@/lib/utils';

interface VoiceLearningPanelProps {
  mode: VoiceLearningMode;
  content: VoicePracticeContent | DialoguePracticeScenario;
  onBack: () => void;
  onComplete?: () => void;
  className?: string;
}

const modeConfig = {
  reading: { 
    title: '文本阅读', 
    icon: BookOpen,
    description: '专注阅读理解和语音朗读'
  },
  follow_along: { 
    title: '跟读练习', 
    icon: Play,
    description: '跟随标准发音进行语音练习'
  },
  dialogue_practice: { 
    title: '对话练习', 
    icon: Users,
    description: '模拟真实对话场景练习'
  },
  listening_comprehension: { 
    title: '听力理解', 
    icon: List,
    description: '训练听力技能和理解能力'
  }
};

export function VoiceLearningPanel({
  mode,
  content,
  onBack,
  onComplete,
  className
}: VoiceLearningPanelProps) {
  const [showProgress, setShowProgress] = useState(false);
  const [sessionError, setSessionError] = useState<AppError | null>(null);

  const {
    state,
    progress,
    currentSentence,
    startSession,
    endSession,
    pauseSession,
    resumeSession,
    nextSentence,
    previousSentence,
    goToSentence,
    playCurrentSentence,
    startRecording,
    stopRecording,
    retryCurrentSentence,
    skipCurrentSentence,
    isRecording,
    recognitionResult,
    lastAttempt
  } = useVoiceLearning({
    onSessionStart: (session) => {
      console.log('开始学习会话:', session);
      setSessionError(null);
    },
    onSessionComplete: (session) => {
      console.log('完成学习会话:', session);
      onComplete?.();
    },
    onError: (error) => {
      console.error('学习会话错误:', error);
      setSessionError(error);
    },
    autoAdvance: true,
    minScoreToAdvance: 70
  });

  // 组件初始化时开始会话
  useEffect(() => {
    startSession(mode, content);
    
    // 清理函数
    return () => {
      if (state.isActive) {
        endSession();
      }
    };
  }, [mode, content.id]);

  // 获取模式配置
  const config = modeConfig[mode];
  const IconComponent = config.icon;

  // 处理返回
  const handleBack = () => {
    if (state.isActive) {
      endSession();
    }
    onBack();
  };

  // 暂停/恢复控制
  const handlePauseResume = () => {
    if (state.isActive) {
      pauseSession();
    } else {
      resumeSession();
    }
  };

  // 句子导航
  const canGoPrevious = state.currentSentenceIndex > 0;
  const canGoNext = progress.totalSentences > 0 && 
    state.currentSentenceIndex < progress.totalSentences - 1;

  return (
    <div className={cn("w-full max-w-6xl mx-auto space-y-6", className)}>
      {/* 头部控制栏 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-9 px-3"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回
              </Button>
              
              <div className="flex items-center gap-2">
                <IconComponent className="h-5 w-5 text-primary" />
                <div>
                  <h1 className="font-semibold text-lg">{config.title}</h1>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:inline-flex">
                {content.level} • {('category' in content) ? content.category : '练习'}
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProgress(!showProgress)}
                className="hidden md:inline-flex"
              >
                <Settings className="h-4 w-4 mr-1" />
                {showProgress ? '隐藏进度' : '显示进度'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* 内容信息 */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-medium">{content.title}</h2>
              <p className="text-sm text-muted-foreground">{content.description}</p>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium">
                {progress.completedSentences} / {progress.totalSentences}
              </div>
              <div className="text-xs text-muted-foreground">已完成</div>
            </div>
          </div>

          {/* 整体进度条 */}
          <div className="space-y-2">
            <Progress 
              value={progress.totalSentences > 0 ? 
                (progress.completedSentences / progress.totalSentences) * 100 : 0} 
              className="h-2" 
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>进度: {Math.round((progress.completedSentences / Math.max(progress.totalSentences, 1)) * 100)}%</span>
              <span>平均分: {progress.averageScore}分</span>
            </div>
          </div>

          {/* 句子导航 */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={previousSentence}
              disabled={!canGoPrevious || isRecording}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              上一句
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                句子 {state.currentSentenceIndex + 1}
              </span>
              
              {lastAttempt && (
                <Badge 
                  variant={lastAttempt.similarity >= 80 ? "default" : 
                           lastAttempt.similarity >= 60 ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {lastAttempt.similarity >= 80 ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {lastAttempt.similarity}%
                </Badge>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextSentence}
              disabled={!canGoNext || isRecording}
              className="h-8"
            >
              下一句
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {sessionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {sessionError.message}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSessionError(null)}
              className="ml-2 h-6"
            >
              关闭
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 语音交互面板 */}
        <div className="lg:col-span-2">
          <VoiceInteractionPanel
            currentSentence={currentSentence}
            isRecording={isRecording}
            recognitionResult={recognitionResult}
            lastAttempt={lastAttempt}
            isLoading={state.isLoading}
            onPlay={playCurrentSentence}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            onRetry={retryCurrentSentence}
            onSkip={skipCurrentSentence}
            showTips={mode === 'follow_along'}
            mode={mode}
          />
        </div>

        {/* 进度反馈卡片 */}
        <div className={cn(
          "space-y-4",
          !showProgress && "hidden lg:block"
        )}>
          <ProgressFeedbackCard
            progress={progress}
            mode={mode}
            recentAttempts={state.currentSession?.attempts || []}
            showDetailedStats={true}
            onReset={() => {
              endSession();
              startSession(mode, content);
            }}
          />

          {/* 会话控制 */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>会话状态</span>
                  <Badge variant={state.isActive ? "default" : "secondary"}>
                    {state.isActive ? "进行中" : "已暂停"}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePauseResume}
                    className="flex-1 h-8"
                  >
                    {state.isActive ? (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        暂停
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        继续
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      endSession();
                      startSession(mode, content);
                    }}
                    className="flex-1 h-8"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    重开
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 移动端进度面板切换 */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          onClick={() => setShowProgress(!showProgress)}
          className="w-full"
        >
          {showProgress ? '隐藏详细进度' : '显示详细进度'}
        </Button>
        
        {showProgress && (
          <div className="mt-4">
            <ProgressFeedbackCard
              progress={progress}
              mode={mode}
              recentAttempts={state.currentSession?.attempts || []}
              showDetailedStats={true}
              onReset={() => {
                endSession();
                startSession(mode, content);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}