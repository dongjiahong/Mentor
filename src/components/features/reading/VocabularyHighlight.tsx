import { WordPopover } from '@/components/features/WordPopover';
import { WordDefinition } from '@/types';

interface VocabularyHighlightProps {
  wordPopover: { word: string; position: { x: number; y: number } } | null;
  onClose: () => void;
  onAddToWordbook: (word: string, definition: WordDefinition) => Promise<void>;
}

export function VocabularyHighlight({
  wordPopover,
  onClose,
  onAddToWordbook
}: VocabularyHighlightProps) {
  if (!wordPopover) {
    return null;
  }

  return (
    <WordPopover
      word={wordPopover.word}
      position={wordPopover.position}
      onClose={onClose}
      onAddToWordbook={onAddToWordbook}
    />
  );
}