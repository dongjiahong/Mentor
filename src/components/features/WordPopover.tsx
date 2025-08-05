import { useState, useEffect, useRef } from 'react';
import { X, Volume2, BookOpen, Loader2, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDictionaryQuery } from '@/hooks';
import { WordDefinition } from '@/types';

interface WordPopoverProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAddToWordbook?: (word: string, definition: WordDefinition) => void;
  className?: string;
}

export function WordPopover({ word, position, onClose, onAddToWordbook, className }: WordPopoverProps) {
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [isAddingToWordbook, setIsAddingToWordbook] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const { 
    lookupWord, 
    getWordPronunciation, 
    queryState, 
    clearQueryState,
    isAvailable,
    serviceError 
  } = useDictionaryQuery();

  // 查询单词定义
  useEffect(() => {
    const fetchDefinition = async () => {
      if (!isAvailable) {
        return;
      }

      try {
        clearQueryState();
        const result = await lookupWord(word);
        setDefinition(result);
      } catch (error) {
        console.error('查询单词失败:', error);
        // 错误已经在queryState中处理
      }
    };

    fetchDefinition();
  }, [word, lookupWord, clearQueryState, isAvailable]);

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 计算弹窗位置
  const popoverStyle = {
    position: 'fixed' as const,
    left: Math.max(10, Math.min(position.x - 150, window.innerWidth - 310)),
    top: Math.max(10, position.y - 10),
    zIndex: 50
  };

  const handlePlayPronunciation = async () => {
    try {
      // 首先尝试获取词典服务的发音URL
      if (isAvailable) {
        const pronunciationUrl = await getWordPronunciation(word);
        if (pronunciationUrl) {
          const audio = new Audio(pronunciationUrl);
          audio.play().catch(() => {
            // 如果播放失败，回退到TTS
            playWithTTS();
          });
          return;
        }
      }
      
      // 回退到浏览器TTS
      playWithTTS();
    } catch (error) {
      console.error('播放发音失败:', error);
      playWithTTS();
    }
  };

  const playWithTTS = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleAddToWordbook = async () => {
    if (!definition || !onAddToWordbook) return;

    setIsAddingToWordbook(true);
    try {
      await onAddToWordbook(word, definition);
      onClose();
    } catch (error) {
      console.error('添加到单词本失败:', error);
    } finally {
      setIsAddingToWordbook(false);
    }
  };

  return (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className={cn(
        "w-80 bg-popover border border-border rounded-lg shadow-lg p-4",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="font-medium text-popover-foreground">单词查询</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 内容区域 */}
      {!isAvailable && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">词典服务未配置</p>
          <p className="text-xs text-muted-foreground">
            请在设置中配置词典服务以查询单词释义
          </p>
        </div>
      )}

      {isAvailable && queryState.status === 'loading' && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">查询中...</span>
        </div>
      )}

      {isAvailable && queryState.status === 'error' && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive mb-2">
            {queryState.error?.message || '查询失败'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => lookupWord(word)}
            className="mt-2"
          >
            重试
          </Button>
        </div>
      )}

      {serviceError && (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive mb-2">
            词典服务错误：{serviceError.message}
          </p>
        </div>
      )}

      {definition && (
        <div className="space-y-4">
          {/* 单词和音标 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-popover-foreground">
                {definition.word}
              </h3>
              {definition.phonetic && (
                <p className="text-sm text-muted-foreground">
                  {definition.phonetic}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPronunciation}
              className="text-primary hover:text-primary/80"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>

          {/* 词义列表 */}
          <div className="space-y-3">
            {definition.definitions.map((def, index) => (
              <div key={index} className="border-l-2 border-primary/20 pl-3">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {def.partOfSpeech}
                  </span>
                </div>
                <p className="text-sm text-popover-foreground mb-1">
                  {def.meaning}
                </p>
                {def.example && (
                  <p className="text-xs text-muted-foreground italic">
                    例句：{def.example}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 更多例句 */}
          {definition.examples && definition.examples.length > 0 && (
            <div className="pt-3 border-t border-border">
              <h4 className="text-sm font-medium text-popover-foreground mb-2">
                更多例句
              </h4>
              <div className="space-y-1">
                {definition.examples.slice(0, 2).map((example, index) => (
                  <p key={index} className="text-xs text-muted-foreground">
                    • {example}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-2 pt-3 border-t border-border">
            {onAddToWordbook && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={handleAddToWordbook}
                disabled={isAddingToWordbook}
              >
                {isAddingToWordbook ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    添加中...
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" />
                    添加到单词本
                  </>
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn("text-xs", onAddToWordbook ? "flex-1" : "w-full")}
              onClick={onClose}
            >
              关闭
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}