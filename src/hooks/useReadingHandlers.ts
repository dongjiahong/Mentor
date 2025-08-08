import { useCallback } from 'react';
import { UseReadingSessionReturn } from './useReadingSession';

interface UseReadingHandlersProps {
  readingSession: UseReadingSessionReturn;
  showWordPopover: (word: string, position: { x: number; y: number }) => void;
  closeWordPopover: () => void;
  speechSupported: boolean;
  speak: (text: string, options?: any) => void;
}

export function useReadingHandlers({
  readingSession,
  showWordPopover,
  closeWordPopover,
  speechSupported,
  speak
}: UseReadingHandlersProps) {
  const { handleWordClick, setSelectedWord, playText } = readingSession;

  const handleWordClickWrapper = useCallback((word: string, event: React.MouseEvent) => {
    const result = handleWordClick(word, event);
    showWordPopover(result.cleanWord, result.position);
  }, [handleWordClick, showWordPopover]);

  const handleCloseWordPopover = useCallback(() => {
    closeWordPopover();
    setSelectedWord('');
  }, [closeWordPopover, setSelectedWord]);

  const handlePlayText = useCallback((text: string) => {
    playText(text, speechSupported, speak);
  }, [playText, speechSupported, speak]);

  return {
    handleWordClickWrapper,
    handleCloseWordPopover,
    handlePlayText
  };
}