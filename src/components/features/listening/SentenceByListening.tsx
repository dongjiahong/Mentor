import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, EyeOff, Volume2, Check, X, PlayCircle, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListeningSentence } from '@/types';

interface SentenceByListeningProps {
  sentences: ListeningSentence[];
  playingSentenceId: string | null;
  isPlayingFullText: boolean;
  currentFullTextIndex: number;
  isLoading: boolean;
  onPlaySentence: (sentenceId: string) => void;
  onPlayFullText: () => void;
  onUpdateInput: (sentenceId: string, input: string) => void;
  onToggleReveal: (sentenceId: string) => void;
  onStopPlayback: () => void;
  className?: string;
}

export function SentenceByListening({
  sentences,
  playingSentenceId,
  isPlayingFullText,
  currentFullTextIndex,
  isLoading,
  onPlaySentence,
  onPlayFullText,
  onUpdateInput,
  onToggleReveal,
  onStopPlayback,
  className
}: SentenceByListeningProps) {
  const [expandedSentences, setExpandedSentences] = useState<Set<string>>(new Set());

  const toggleExpanded = (sentenceId: string) => {
    const newExpanded = new Set(expandedSentences);
    if (newExpanded.has(sentenceId)) {
      newExpanded.delete(sentenceId);
    } else {
      newExpanded.add(sentenceId);
    }
    setExpandedSentences(newExpanded);
  };

  const getSimilarityColor = (similarity: number | undefined) => {
    if (!similarity) return 'bg-gray-100 text-gray-700';
    if (similarity >= 80) return 'bg-green-100 text-green-700';
    if (similarity >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getSimilarityIcon = (similarity: number | undefined) => {
    if (!similarity) return null;
    if (similarity >= 80) return <Check className="h-3 w-3" />;
    return <X className="h-3 w-3" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">逐句听力练习</h3>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={isPlayingFullText ? onStopPlayback : onPlayFullText}
            disabled={isLoading || sentences.length === 0}
            className="gap-2"
          >
            {isPlayingFullText ? (
              <>
                <StopCircle className="h-4 w-4" />
                停止播放
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                播放全文
              </>
            )}
          </Button>
          <Badge variant="secondary">
            共 {sentences.length} 句
          </Badge>
        </div>
      </div>
      
      {/* 全文播放进度显示 */}
      {isPlayingFullText && (
        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                正在播放全文
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {currentFullTextIndex + 1} / {sentences.length}
                </Badge>
                <div className="w-20 bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${((currentFullTextIndex + 1) / sentences.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {sentences.map((sentence, index) => {
          const isExpanded = expandedSentences.has(sentence.id);
          const isCurrentlyPlaying = playingSentenceId === sentence.id;
          const isCurrentFullTextSentence = isPlayingFullText && currentFullTextIndex === index;
          
          return (
            <Card 
              key={sentence.id} 
              className={cn(
                "transition-all duration-200",
                isCurrentFullTextSentence && "ring-2 ring-primary shadow-lg",
                isCurrentlyPlaying && "ring-2 ring-blue-500 shadow-lg"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* 句子编号 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    {/* 播放按钮和状态指示 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPlaySentence(sentence.id)}
                          disabled={isLoading || isPlayingFullText}
                          className="gap-2"
                        >
                          {isCurrentlyPlaying ? (
                            <Volume2 className="h-4 w-4 animate-pulse" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          {isCurrentlyPlaying ? '播放中' : '播放'}
                        </Button>
                        
                        {sentence.hasBeenPlayed && (
                          <Badge variant="outline" className="text-xs">
                            已播放
                          </Badge>
                        )}
                      </div>

                      {/* 显示/隐藏按钮 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleReveal(sentence.id)}
                        className="gap-2"
                      >
                        {sentence.isRevealed ? (
                          <>
                            <EyeOff className="h-4 w-4" />
                            隐藏
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            显示
                          </>
                        )}
                      </Button>
                    </div>

                    {/* 用户输入框 */}
                    <div className="space-y-2">
                      <Input
                        placeholder="请输入你听到的内容..."
                        value={sentence.userInput || ''}
                        onChange={(e) => onUpdateInput(sentence.id, e.target.value)}
                        className="w-full"
                        disabled={!sentence.hasBeenPlayed}
                      />
                      
                      {sentence.similarity !== undefined && sentence.userInput && (
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={cn("text-xs gap-1", getSimilarityColor(sentence.similarity))}
                          >
                            {getSimilarityIcon(sentence.similarity)}
                            相似度: {sentence.similarity}%
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* 原文显示 */}
                    {sentence.isRevealed && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            原文：
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(sentence.id)}
                            className="text-xs"
                          >
                            {isExpanded ? '收起' : '展开详情'}
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="leading-relaxed">
                            {sentence.text}
                          </p>
                          
                          {sentence.translation && (
                            <div className="pt-2 border-t border-border/50">
                              <div className="text-xs text-muted-foreground mb-1">中文翻译：</div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {sentence.translation}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 展开的详细信息 */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-border space-y-2">
                            {sentence.userInput && sentence.similarity !== undefined && (
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">你的输入：</div>
                                <div className="text-sm p-2 bg-background rounded border">
                                  {sentence.userInput}
                                </div>
                              </div>
                            )}
                            
                            {sentence.startTime !== undefined && sentence.endTime !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                预估播放时长: {Math.round((sentence.endTime - sentence.startTime) / 1000 * 10) / 10}秒
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 遮挡状态显示 */}
                    {!sentence.isRevealed && !sentence.hasBeenPlayed && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-center">
                        <div className="text-gray-500 text-sm">
                          点击"播放"按钮听取这句话
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 练习总结 */}
      {sentences.length > 0 && (
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                练习进度
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>
                  已播放: {sentences.filter(s => s.hasBeenPlayed).length}/{sentences.length}
                </span>
                <span>
                  已输入: {sentences.filter(s => s.userInput && s.userInput.trim().length > 0).length}/{sentences.length}
                </span>
                {sentences.some(s => s.similarity !== undefined) && (
                  <span>
                    平均相似度: {Math.round(
                      sentences
                        .filter(s => s.similarity !== undefined)
                        .reduce((sum, s) => sum + (s.similarity || 0), 0) /
                      sentences.filter(s => s.similarity !== undefined).length
                    )}%
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}