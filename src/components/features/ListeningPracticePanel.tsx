import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ListeningPracticeContent, 
  UniversalContent,
  LISTENING_PRACTICE_TYPE_DESCRIPTIONS
} from '@/types';
import { useListeningSession } from '@/hooks/useListeningSession';
import { SentenceByListening } from './listening/SentenceByListening';

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
    handlers
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
                逐句听力练习
              </Badge>
              <Badge variant="outline">
                {listeningContent.level}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 逐句练习 */}
      {sessionState.sentences.length > 0 && (
        <SentenceByListening
          sentences={sessionState.sentences}
          playingSentenceId={sessionState.playingSentenceId}
          isPlayingFullText={sessionState.isPlayingFullText}
          currentFullTextIndex={sessionState.currentFullTextIndex}
          isLoading={audioState.isLoading}
          onPlaySentence={handlers.playSentence}
          onPlayFullText={handlers.playFullText}
          onUpdateInput={handlers.updateSentenceInput}
          onToggleReveal={handlers.toggleSentenceReveal}
          onStopPlayback={handlers.stopAllPlayback}
        />
      )}

      {/* 练习完成按钮 */}
      <div className="flex justify-center gap-4 pt-6">
        <Button variant="outline" onClick={handlers.handleRetry}>
          重新练习
        </Button>
        <Button onClick={onComplete}>
          完成练习
        </Button>
      </div>
    </div>
  );
}