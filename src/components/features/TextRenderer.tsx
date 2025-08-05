import { useState, useCallback, useMemo } from 'react';
import { WordPlayButton, SentencePlayButton } from './PlayButton';
import { cn } from '@/lib/utils';

interface TextRendererProps {
  originalText: string;
  translation?: string;
  onWordClick?: (word: string, event: React.MouseEvent) => void;
  onSentencePlay?: (sentence: string) => void;
  className?: string;
}

interface Sentence {
  text: string;
  start: number;
  end: number;
}

export function TextRenderer({
  originalText,
  translation,
  onWordClick,
  onSentencePlay,
  className
}: TextRendererProps) {
  const [highlightedSentence, setHighlightedSentence] = useState<number | null>(null);

  // 将文本分割成句子
  const sentences = useMemo(() => {
    const sentenceRegex = /[.!?]+/g;
    const sentences: Sentence[] = [];
    let lastIndex = 0;
    let match;

    while ((match = sentenceRegex.exec(originalText)) !== null) {
      const endIndex = match.index + match[0].length;
      const sentenceText = originalText.slice(lastIndex, endIndex).trim();
      
      if (sentenceText) {
        sentences.push({
          text: sentenceText,
          start: lastIndex,
          end: endIndex
        });
      }
      
      lastIndex = endIndex;
    }

    // 处理最后一个句子（如果没有标点符号结尾）
    if (lastIndex < originalText.length) {
      const remainingText = originalText.slice(lastIndex).trim();
      if (remainingText) {
        sentences.push({
          text: remainingText,
          start: lastIndex,
          end: originalText.length
        });
      }
    }

    return sentences;
  }, [originalText]);

  // 将翻译文本分割成句子
  const translationSentences = useMemo(() => {
    if (!translation) return [];
    
    const sentenceRegex = /[。！？]+/g;
    const sentences: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = sentenceRegex.exec(translation)) !== null) {
      const endIndex = match.index + match[0].length;
      const sentenceText = translation.slice(lastIndex, endIndex).trim();
      
      if (sentenceText) {
        sentences.push(sentenceText);
      }
      
      lastIndex = endIndex;
    }

    // 处理最后一个句子
    if (lastIndex < translation.length) {
      const remainingText = translation.slice(lastIndex).trim();
      if (remainingText) {
        sentences.push(remainingText);
      }
    }

    return sentences;
  }, [translation]);

  const handleWordClick = useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
    const target = event.target as HTMLSpanElement;
    const word = target.textContent?.trim();
    
    if (word && onWordClick) {
      // 只处理英文单词（包含字母的词）
      if (/[a-zA-Z]/.test(word)) {
        // 清理标点符号
        const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
        if (cleanWord) {
          onWordClick(cleanWord, event);
        }
      }
    }
  }, [onWordClick]);

  const handleSentencePlay = useCallback((sentence: string, index: number) => {
    setHighlightedSentence(index);
    onSentencePlay?.(sentence);
    
    // 3秒后取消高亮
    setTimeout(() => {
      setHighlightedSentence(null);
    }, 3000);
  }, [onSentencePlay]);

  const renderSentence = useCallback((sentence: Sentence, index: number) => {
    const isHighlighted = highlightedSentence === index;
    
    // 将句子分割成单词
    const words = sentence.text.split(/(\s+)/);
    
    return (
      <div
        key={index}
        className={cn(
          "relative group mb-4 p-3 rounded-lg transition-all duration-200",
          isHighlighted && "bg-primary/10 ring-2 ring-primary/20"
        )}
      >
        <div className="flex items-start space-x-2">
          {/* 播放按钮 */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
            <SentencePlayButton
              text={sentence.text}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            />
          </div>
          
          {/* 句子内容 */}
          <div className="flex-1">
            <p className="text-foreground leading-relaxed">
              {words.map((word, wordIndex) => {
                // 如果是空白字符，直接返回
                if (/^\s+$/.test(word)) {
                  return <span key={wordIndex}>{word}</span>;
                }
                
                // 如果包含英文字母，则可点击
                if (/[a-zA-Z]/.test(word)) {
                  return (
                    <span
                      key={wordIndex}
                      onClick={handleWordClick}
                      className="cursor-pointer hover:bg-primary/20 hover:text-primary rounded px-0.5 transition-colors inline-flex items-center gap-1"
                      title="点击查询单词"
                    >
                      {word}
                      <WordPlayButton
                        text={word.replace(/[^\w]/g, '')}
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 opacity-0 hover:opacity-100 transition-opacity"
                      />
                    </span>
                  );
                }
                
                // 其他字符（标点符号等）
                return <span key={wordIndex}>{word}</span>;
              })}
            </p>
            
            {/* 翻译文本 */}
            {translation && translationSentences[index] && (
              <p className="text-muted-foreground text-sm mt-2 italic">
                {translationSentences[index]}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }, [highlightedSentence, translation, translationSentences, handleWordClick, handleSentencePlay]);

  return (
    <div className={cn("prose prose-slate max-w-none", className)}>
      {sentences.length > 0 ? (
        sentences.map(renderSentence)
      ) : (
        <div className="text-center text-muted-foreground py-8">
          暂无内容
        </div>
      )}
    </div>
  );
}