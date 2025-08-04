import { useState, useCallback } from 'react';
import { LearningContent } from '@/types';
import { TextRenderer } from './TextRenderer';
import { WordPopover } from './WordPopover';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentDisplayProps {
  content: LearningContent;
  className?: string;
  onWordClick?: (word: string) => void;
  onSentencePlay?: (sentence: string) => void;
  onFullTextPlay?: () => void;
}

export function ContentDisplay({ 
  content, 
  className,
  onWordClick,
  onSentencePlay,
  onFullTextPlay
}: ContentDisplayProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    position: { x: number; y: number };
  } | null>(null);

  const handleWordClick = useCallback((word: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setSelectedWord({
      word,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    });
    onWordClick?.(word);
  }, [onWordClick]);

  const handleClosePopover = useCallback(() => {
    setSelectedWord(null);
  }, []);

  const toggleTranslation = useCallback(() => {
    setShowTranslation(prev => !prev);
  }, []);

  return (
    <div className={cn("bg-card border border-border rounded-lg", className)}>
      {/* 头部控制栏 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-muted-foreground">
            {content.contentType === 'dialogue' ? '对话练习' : '文章阅读'}
          </span>
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
            {content.difficultyLevel}
          </span>
          {content.topic && (
            <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
              {content.topic}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTranslation}
            className="text-muted-foreground hover:text-foreground"
          >
            {showTranslation ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                隐藏翻译
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                显示翻译
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onFullTextPlay}
            className="text-muted-foreground hover:text-foreground"
          >
            <Volume2 className="h-4 w-4 mr-1" />
            播放全文
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        <TextRenderer
          originalText={content.originalText}
          translation={showTranslation ? content.translation : undefined}
          onWordClick={handleWordClick}
          onSentencePlay={onSentencePlay}
        />
      </div>

      {/* 单词查询弹窗 */}
      {selectedWord && (
        <WordPopover
          word={selectedWord.word}
          position={selectedWord.position}
          onClose={handleClosePopover}
        />
      )}
    </div>
  );
}