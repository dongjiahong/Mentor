import { useState, useCallback } from 'react';
import { LearningContent } from '@/types';
import { TextRenderer } from './TextRenderer';
import { WordPopover } from './WordPopover';
import { AudioControls } from './AudioControls';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Settings } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ContentDisplayProps {
  content: LearningContent;
  className?: string;
  onWordClick?: (word: string) => void;
  onSentencePlay?: (sentence: string) => void;
}

export function ContentDisplay({ 
  content, 
  className,
  onWordClick,
  onSentencePlay
}: ContentDisplayProps) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [showAudioControls, setShowAudioControls] = useState(false);
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
          
          <Collapsible open={showAudioControls} onOpenChange={setShowAudioControls}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4 mr-1" />
                音频控制
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </div>

      {/* 音频控制面板 */}
      <Collapsible open={showAudioControls} onOpenChange={setShowAudioControls}>
        <CollapsibleContent className="border-b border-border">
          <div className="p-4">
            <AudioControls
              text={content.originalText}
              showProgress={true}
              showVolumeControl={true}
              showSpeedControl={true}
              showVoiceSelection={true}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

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