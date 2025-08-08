import { useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UniversalContent, ContentSentence, ContentDialogue } from '@/types';
import { useSpeech } from '@/hooks/useSpeech';
import { useSpeechRecording } from '@/hooks/useSpeechRecording';
import { useSpeakingSession } from '@/hooks/useSpeakingSession';
import { SentencePractice } from './speaking/SentencePractice';
import { DialoguePractice } from './speaking/DialoguePractice';
import { SpeakingResults } from './speaking/SpeakingResults';

interface SpeakingPracticePanelProps {
  content: UniversalContent;
  onBack: () => void;
  onComplete: () => void;
  className?: string;
}

export function SpeakingPracticePanel({
  content,
  onBack,
  onComplete,
  className
}: SpeakingPracticePanelProps) {
  // Hooks
  const speechRecording = useSpeechRecording();
  const speakingSession = useSpeakingSession(content);
  const {
    speak,
    isSupported: speechSupported,
    isSpeaking
  } = useSpeech();

  // 播放范例音频
  const playExample = useCallback((text: string) => {
    if (speechSupported) {
      speak(text, { rate: 0.8, pitch: 1.0 });
    }
  }, [speak, speechSupported]);

  // 处理录音完成
  useEffect(() => {
    if (!speechRecording.isRecording && speechRecording.transcript && speechRecording.currentAttemptStart > 0) {
      speakingSession.recordAttempt(speechRecording.transcript, speechRecording.confidence);
      speechRecording.resetRecording();
    }
  }, [
    speechRecording.isRecording, 
    speechRecording.transcript, 
    speechRecording.currentAttemptStart,
    speechRecording.confidence,
    speakingSession,
    speechRecording
  ]);

  // 渲染练习内容
  const renderPracticeContent = () => {
    if (speakingSession.practiceState.mode === 'sentence') {
      const sentence = speakingSession.currentItem as ContentSentence;
      if (!sentence) return null;

      return (
        <SentencePractice
          sentence={sentence}
          currentIndex={speakingSession.practiceState.currentIndex}
          totalSentences={content.sentences?.length || 0}
          currentScore={speakingSession.currentScore}
          attempts={speakingSession.currentAttempts}
          showFeedback={speakingSession.showFeedback}
          isRecording={speechRecording.isRecording}
          isListening={speechRecording.isListening}
          transcript={speechRecording.transcript}
          error={speechRecording.error}
          isSpeaking={isSpeaking}
          speechSupported={speechSupported}
          onStartRecording={speechRecording.startRecording}
          onStopRecording={speechRecording.stopRecording}
          onPlayExample={playExample}
          onRetry={() => {
            speakingSession.retryItem();
            speechRecording.clearTranscript();
          }}
          onNext={speakingSession.practiceState.currentIndex < speakingSession.totalItems - 1 ? speakingSession.nextItem : undefined}
          onComplete={onComplete}
        />
      );
    } else {
      const conversations = content.conversations || [];
      const userConversations = conversations.filter(conv => conv.speaker === 'user');
      const currentUserConv = speakingSession.currentItem as ContentDialogue;
      
      if (!currentUserConv) return null;

      return (
        <DialoguePractice
          conversations={conversations}
          currentUserConv={currentUserConv}
          currentIndex={speakingSession.practiceState.currentIndex}
          totalUserConversations={userConversations.length}
          currentScore={speakingSession.currentScore}
          showFeedback={speakingSession.showFeedback}
          isRecording={speechRecording.isRecording}
          isListening={speechRecording.isListening}
          transcript={speechRecording.transcript}
          error={speechRecording.error}
          onStartRecording={speechRecording.startRecording}
          onStopRecording={speechRecording.stopRecording}
          onRetry={() => {
            speakingSession.retryItem();
            speechRecording.clearTranscript();
          }}
          onNext={speakingSession.practiceState.currentIndex < speakingSession.totalItems - 1 ? speakingSession.nextItem : undefined}
          onComplete={onComplete}
        />
      );
    }
  };

  return (
    <div className={cn("max-w-4xl mx-auto p-4 space-y-6", className)}>
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      {/* 头部信息和进度 */}
      <SpeakingResults
        title={content.title}
        description={content.description}
        overallScore={speakingSession.overallScore}
        completedItems={speakingSession.practiceState.scores.size}
        totalItems={speakingSession.totalItems}
      />

      {/* 练习内容 */}
      {renderPracticeContent()}

      {/* 导航按钮 */}
      {speakingSession.totalItems > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={speakingSession.previousItem}
            disabled={speakingSession.practiceState.currentIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            上一个
          </Button>
          <Button
            variant="outline"
            onClick={speakingSession.nextItem}
            disabled={speakingSession.practiceState.currentIndex === speakingSession.totalItems - 1}
          >
            下一个
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* 浏览器兼容性提示 */}
      {!speechSupported && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                您的浏览器不完全支持语音功能，建议使用Chrome浏览器以获得最佳体验。
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}