import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ListeningPracticeContent, 
  UniversalContent,
  LISTENING_PRACTICE_TYPE_DESCRIPTIONS
} from '@/types';
import { useListeningSession } from '@/hooks/useListeningSession';
import { AudioPlayer } from './listening/AudioPlayer';
import { ListeningQuestions } from './listening/ListeningQuestions';
import { ListeningResults } from './listening/ListeningResults';

interface ListeningPracticePanelProps {
  content: ListeningPracticeContent | UniversalContent;
  onBack: () => void;
  onComplete: () => void;
  className?: string;
}

export function ListeningPracticePanel({
  content,
  onBack,
  onComplete,
  className
}: ListeningPracticePanelProps) {
  const {
    listeningContent,
    audioState,
    sessionState,
    audioHandlers,
    sessionHandlers
  } = useListeningSession(content);

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
      <AudioPlayer
        audioState={audioState}
        onPlayPause={audioHandlers.handlePlayPause}
        onStop={audioHandlers.handleStop}
        onSeek={audioHandlers.handleSeek}
        onVolumeChange={audioHandlers.handleVolumeChange}
        onPlaybackRateChange={audioHandlers.handlePlaybackRateChange}
      />

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
                onClick={sessionHandlers.toggleTranscript}
              >
                {sessionState.showTranscript ? '隐藏' : '显示'}文稿
              </Button>
            </div>
          </CardHeader>
          {sessionState.showTranscript && (
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
      {listeningContent.questions && listeningContent.questions.length > 0 && !sessionState.showResults && (
        <ListeningQuestions
          questions={listeningContent.questions}
          currentQuestionIndex={sessionState.currentQuestionIndex}
          userAnswers={sessionState.userAnswers}
          onAnswerSubmit={sessionHandlers.handleAnswerSubmit}
          onQuestionChange={sessionHandlers.handleQuestionChange}
          onSeek={audioHandlers.handleSeek}
        />
      )}

      {/* 结果页面或无题目提示 */}
      {(sessionState.showResults || !listeningContent.questions || listeningContent.questions.length === 0) && (
        <ListeningResults
          questions={listeningContent.questions}
          userAnswers={sessionState.userAnswers}
          onRetry={sessionHandlers.handleRetry}
          onComplete={onComplete}
        />
      )}
    </div>
  );
}