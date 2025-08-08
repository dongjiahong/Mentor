import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import { ContentDialogue, PronunciationScore } from '@/types';
import { SpeechRecorder } from './SpeechRecorder';
import { PronunciationFeedback } from './PronunciationFeedback';

interface DialoguePracticeProps {
  conversations: ContentDialogue[];
  currentUserConv: ContentDialogue;
  currentIndex: number;
  totalUserConversations: number;
  currentScore?: PronunciationScore;
  showFeedback: boolean;
  isRecording: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRetry: () => void;
  onNext?: () => void;
  onComplete?: () => void;
}

export function DialoguePractice({
  conversations,
  currentUserConv,
  currentIndex,
  totalUserConversations,
  currentScore,
  showFeedback,
  isRecording,
  isListening,
  transcript,
  error,
  onStartRecording,
  onStopRecording,
  onRetry,
  onNext,
  onComplete
}: DialoguePracticeProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            对话练习
          </CardTitle>
          <Badge variant="outline">
            {currentIndex + 1} / {totalUserConversations}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 对话上下文 */}
        <div className="space-y-3">
          {conversations.map((conv) => {
            if (conv.id === currentUserConv.id) {
              return (
                <div key={conv.id} className="p-4 bg-primary/5 border-2 border-dashed border-primary/20 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">您的回答：</div>
                  <p className="font-medium text-primary">
                    {conv.expectedResponse || '请根据上下文回答'}
                  </p>
                  {conv.translation && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {conv.translation}
                    </p>
                  )}
                </div>
              );
            } else if (Math.abs(conversations.indexOf(conv) - conversations.indexOf(currentUserConv)) <= 1) {
              return (
                <div key={conv.id} className="p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">
                    {conv.speakerName || (conv.speaker === 'system' ? '系统' : '用户')}：
                  </div>
                  <p>{conv.text}</p>
                  {conv.translation && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {conv.translation}
                    </p>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* 提示信息 */}
        {currentUserConv.hints && currentUserConv.hints.length > 0 && (
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium mb-2">💡 提示：</p>
            <ul className="text-sm space-y-1">
              {currentUserConv.hints.map((hint, index) => (
                <li key={index}>• {hint}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 语音录制 */}
        <SpeechRecorder
          isRecording={isRecording}
          isListening={isListening}
          transcript={transcript}
          error={error}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
        />

        {/* 反馈结果 */}
        {showFeedback && currentScore && (
          <PronunciationFeedback
            score={currentScore}
            onRetry={onRetry}
            onNext={onNext}
            onComplete={onComplete}
            showNext={currentIndex < totalUserConversations - 1}
            nextLabel="下一个对话"
          />
        )}
      </CardContent>
    </Card>
  );
}