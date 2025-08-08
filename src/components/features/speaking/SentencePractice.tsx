import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Volume2, AlertTriangle } from 'lucide-react';
import { ContentSentence, VoiceAttempt, PronunciationScore } from '@/types';
import { SpeechRecorder } from './SpeechRecorder';
import { PronunciationFeedback } from './PronunciationFeedback';

interface SentencePracticeProps {
  sentence: ContentSentence;
  currentIndex: number;
  totalSentences: number;
  currentScore?: PronunciationScore;
  attempts: VoiceAttempt[];
  showFeedback: boolean;
  isRecording: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSpeaking: boolean;
  speechSupported: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayExample: (text: string) => void;
  onRetry: () => void;
  onNext?: () => void;
  onComplete?: () => void;
}

export function SentencePractice({
  sentence,
  currentIndex,
  totalSentences,
  currentScore,
  attempts,
  showFeedback,
  isRecording,
  isListening,
  transcript,
  error,
  isSpeaking,
  speechSupported,
  onStartRecording,
  onStopRecording,
  onPlayExample,
  onRetry,
  onNext,
  onComplete
}: SentencePracticeProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            句子跟读练习
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {currentIndex + 1} / {totalSentences}
            </Badge>
            {currentScore && (
              <Badge variant={currentScore.overallScore >= 80 ? "default" : "secondary"}>
                {currentScore.overallScore}分
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 目标文本 */}
        <div className="text-center">
          <div className="p-6 bg-primary/5 rounded-lg border-2 border-dashed border-primary/20">
            <p className="text-xl font-medium text-primary mb-2">
              {sentence.text}
            </p>
            {sentence.translation && (
              <p className="text-sm text-muted-foreground">
                {sentence.translation}
              </p>
            )}
          </div>
          {sentence.phonetic && (
            <p className="text-sm text-muted-foreground mt-2">
              音标: {sentence.phonetic}
            </p>
          )}
        </div>

        {/* 音频和提示 */}
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => onPlayExample(sentence.text)}
            disabled={isSpeaking || !speechSupported}
          >
            <Volume2 className="h-4 w-4 mr-2" />
            听范例
          </Button>
          {sentence.tips && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              {sentence.tips}
            </div>
          )}
        </div>

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
            showNext={currentIndex < totalSentences - 1}
            nextLabel="下一句"
          />
        )}

        {/* 历史尝试 */}
        {attempts.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">练习历史 ({attempts.length} 次尝试)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attempts.slice(-3).map((attempt, index) => (
                  <div key={attempt.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                    <span>尝试 {attempts.length - 2 + index}</span>
                    <span className="font-medium">
                      {attempt.pronunciationScore?.overallScore || 0}分
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}