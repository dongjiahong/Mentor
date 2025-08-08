import { 
  UniversalContent,
  ReadingPracticeContent,
  WordDefinition
} from '@/types';
import { convertToReadingContent } from '@/utils/readingUtils';
import { useSpeech } from '@/hooks/useSpeech';
import { useReadingSession } from '@/hooks/useReadingSession';
import { useWordPopover } from '@/hooks/useWordPopover';
import { useReadingHandlers } from '@/hooks/useReadingHandlers';
import { ReadingContainer } from './reading/ReadingContainer';
import { ReadingHeader } from './reading/ReadingHeader';
import { ReadingTextSection } from './reading/ReadingTextSection';
import { ReadingQuestions } from './reading/ReadingQuestions';
import { VocabularyHighlight } from './reading/VocabularyHighlight';
import { ReadingResults } from './reading/ReadingResults';
import { ReadingStats } from './reading/ReadingStats';

interface ReadingPracticePanelProps {
  content: ReadingPracticeContent | UniversalContent;
  onBack: () => void;
  onComplete: () => void;
  className?: string;
}

export function ReadingPracticePanel({
  content,
  onBack,
  onComplete,
  className
}: ReadingPracticePanelProps) {
  const readingContent: ReadingPracticeContent = 
    'practiceType' in content ? content : convertToReadingContent(content);

  const { speak, isSupported: speechSupported } = useSpeech();
  const { wordPopover, showWordPopover, closeWordPopover, addToWordbook } = useWordPopover();
  const readingSession = useReadingSession(readingContent);
  const { handleWordClickWrapper, handleCloseWordPopover, handlePlayText } = useReadingHandlers({
    readingSession,
    showWordPopover,
    closeWordPopover,
    speechSupported,
    speak
  });

  const speedLevel = readingSession.getReadingSpeedLevel();

  return (
    <ReadingContainer className={className}>
      <ReadingHeader
        content={readingContent}
        readingTime={readingSession.readingState.readingTime}
        readingSpeed={readingSession.readingState.readingSpeed}
        speedLevel={speedLevel}
        formatTime={readingSession.formatTime}
        onBack={onBack}
      />

      <ReadingStats content={readingContent} speedLevel={speedLevel} />

      <ReadingTextSection
        text={readingContent.text}
        translation={content.translation}
        showTranslation={readingSession.readingState.showTranslation}
        highlightedWords={readingSession.readingState.highlightedWords}
        selectedWord={readingSession.selectedWord}
        speechSupported={speechSupported}
        onToggleTranslation={readingSession.toggleTranslation}
        onWordClick={handleWordClickWrapper}
        onPlayText={handlePlayText}
        onClearSelectedWord={readingSession.clearSelectedWord}
      />

      {!readingSession.readingState.showResults && (
        <ReadingQuestions
          questions={readingContent.questions || []}
          currentQuestionIndex={readingSession.readingState.currentQuestionIndex}
          userAnswers={readingSession.readingState.userAnswers}
          onAnswerSubmit={readingSession.handleAnswerSubmit}
          onQuestionChange={readingSession.goToQuestion}
        />
      )}

      <ReadingResults
        showResults={readingSession.readingState.showResults}
        comprehensionScore={readingSession.readingState.comprehensionScore}
        readingTime={readingSession.readingState.readingTime}
        readingSpeed={readingSession.readingState.readingSpeed}
        questions={readingContent.questions || []}
        userAnswers={readingSession.readingState.userAnswers}
        formatTime={readingSession.formatTime}
        getReadingSpeedLevel={readingSession.getReadingSpeedLevel}
        onRestart={readingSession.restartReading}
        onComplete={onComplete}
      />
      <VocabularyHighlight
        wordPopover={wordPopover}
        onClose={handleCloseWordPopover}
        onAddToWordbook={addToWordbook}
      />
    </ReadingContainer>
  );
}