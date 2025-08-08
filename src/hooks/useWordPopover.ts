import { useState, useCallback } from 'react';
import { useWordbook } from '@/hooks/useWordbook';
import { WordDefinition } from '@/types';

interface WordPopoverState {
  word: string;
  position: { x: number; y: number };
}

export function useWordPopover() {
  const [wordPopover, setWordPopover] = useState<WordPopoverState | null>(null);
  const { addWord } = useWordbook();

  const showWordPopover = useCallback((word: string, position: { x: number; y: number }) => {
    setWordPopover({ word, position });
  }, []);

  const closeWordPopover = useCallback(() => {
    setWordPopover(null);
  }, []);

  const addToWordbook = useCallback(async (word: string, definition: WordDefinition) => {
    try {
      const definitionText = definition.definitions
        .map(def => `${def.partOfSpeech}: ${def.meaning}`)
        .join('; ');
      
      await addWord(
        word, 
        definitionText, 
        'translation_lookup', 
        definition.phonetic || undefined
      );
      
      console.log('成功添加单词到单词本:', word);
    } catch (error) {
      console.error('添加单词到单词本失败:', error);
    }
  }, [addWord]);

  return {
    wordPopover,
    showWordPopover,
    closeWordPopover,
    addToWordbook
  };
}