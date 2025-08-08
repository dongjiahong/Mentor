import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Volume2, Eye, EyeOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UniversalContent } from '@/types';

interface ReadingTextSectionProps {
  text: string;
  translation?: string;
  showTranslation: boolean;
  highlightedWords: Set<string>;
  selectedWord: string;
  speechSupported: boolean;
  onToggleTranslation: () => void;
  onWordClick: (word: string, event: React.MouseEvent) => void;
  onPlayText: (text: string) => void;
  onClearSelectedWord: () => void;
  className?: string;
}

export function ReadingTextSection({
  text,
  translation,
  showTranslation,
  highlightedWords,
  selectedWord,
  speechSupported,
  onToggleTranslation,
  onWordClick,
  onPlayText,
  onClearSelectedWord,
  className
}: ReadingTextSectionProps) {
  const textRef = useRef<HTMLDivElement>(null);

  // 渲染高亮文本
  const renderHighlightedText = (text: string) => {
    if (!text) return null;

    const words = text.split(/(\s+)/);
    return (
      <>
        {words.map((word, index) => {
          const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
          const isHighlighted = highlightedWords.has(cleanWord);
          const isSelected = selectedWord === cleanWord;

          if (!word.trim()) return <span key={index}>{word}</span>;

          return (
            <span
              key={index}
              onClick={(event) => onWordClick(word, event)}
              className={cn(
                "cursor-pointer hover:bg-primary/10 px-1 rounded transition-colors",
                isHighlighted && "bg-yellow-200",
                isSelected && "bg-primary text-primary-foreground"
              )}
            >
              {word}
            </span>
          );
        })}
      </>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            阅读文本
          </CardTitle>
          <div className="flex items-center gap-2">
            {speechSupported && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPlayText(text)}
              >
                <Volume2 className="h-4 w-4 mr-2" />
                朗读全文
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleTranslation}
            >
              {showTranslation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="ml-2">{showTranslation ? '隐藏' : '显示'}翻译</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={textRef} className="prose max-w-none">
          <div className="text-base leading-relaxed space-y-4">
            {text.split('\n\n').map((paragraph, index) => (
              <div key={index} className="text-justify leading-relaxed">
                {renderHighlightedText(paragraph)}
              </div>
            ))}
          </div>
        </div>
        
        {/* 翻译显示 */}
        {showTranslation && translation && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">中文翻译：</h4>
            <div className="text-sm leading-relaxed space-y-2">
              {translation.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {/* 选中词汇信息 */}
        {selectedWord && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border-l-4 border-l-primary">
            <div className="flex items-center justify-between">
              <span className="font-medium">选中词汇: "{selectedWord}"</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelectedWord}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}