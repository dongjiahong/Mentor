import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Eye, 
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Bot,
  BookOpen,
  Quote,
  Lightbulb,
  TreePine,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Word, WordAddReason } from '@/types';
import { useSpeech } from '@/hooks';

interface ReviewWordCardProps {
  word: Word;
  onReviewResult: (wordId: number, result: 'unknown' | 'familiar' | 'known') => void;
  onPlay?: (text: string) => void;
  isReviewed?: boolean;
}

// AI翻译内容接口
interface AITranslationContent {
  partOfSpeech: string;
  chineseDefinition: string;
  englishDefinition: string;
  example: string;
  exampleTranslation: string;
  memoryAid: {
    method: 'visual' | 'etymology';
    content: string;
  };
}

// 解析AI翻译内容
const parseAITranslation = (definition: string): AITranslationContent | null => {
  try {
    const parsed = JSON.parse(definition);
    if (parsed.partOfSpeech && parsed.chineseDefinition && parsed.englishDefinition && 
        parsed.memoryAid && parsed.memoryAid.method && parsed.memoryAid.content) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

// 添加原因的显示配置
const ADD_REASON_CONFIG: Record<WordAddReason, { 
  label: string; 
  icon: React.ReactNode; 
  color: string;
}> = {
  'translation_lookup': {
    label: '翻译查询',
    icon: <Eye className="h-3 w-3" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  'pronunciation_error': {
    label: '发音错误',
    icon: <RotateCcw className="h-3 w-3" />,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  'listening_difficulty': {
    label: '听力困难',
    icon: <Clock className="h-3 w-3" />,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  }
};

export function ReviewWordCard({ 
  word, 
  onReviewResult,
  onPlay,
  isReviewed = false
}: ReviewWordCardProps) {
  const [showDefinition, setShowDefinition] = useState(false);
  
  const { speak } = useSpeech();

  // 解析AI翻译内容
  const aiTranslation = parseAITranslation(word.definition);
  const isAITranslated = aiTranslation !== null;

  // 当单词变化时重置状态
  useEffect(() => {
    setShowDefinition(false);
  }, [word.id]);

  // 获取添加原因配置，提供默认值
  const reasonConfig = ADD_REASON_CONFIG[word.addReason] || {
    label: '其他',
    icon: <Eye className="h-3 w-3" />,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  };

  // 处理播放单词发音
  const handlePlay = async () => {
    if (onPlay) {
      onPlay(word.word);
    } else {
      await speak(word.word, { lang: 'en-US' });
    }
  };

  // 处理查看释义
  const handleShowDefinition = () => {
    setShowDefinition(true);
    // 只是显示释义，不直接处理复习结果
  };

  // 处理复习结果
  const handleReviewResult = (result: 'unknown' | 'familiar' | 'known') => {
    onReviewResult(word.id, result);
  };

  // 计算是否过期
  const isOverdue = word.nextReviewAt ? new Date(word.nextReviewAt) < new Date() : true;
  const overdueDays = word.nextReviewAt 
    ? Math.max(0, Math.floor((new Date().getTime() - new Date(word.nextReviewAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <Card className={`transition-all duration-300 ${
      isReviewed ? 'opacity-50 scale-95' : 'hover:shadow-lg'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-bold text-foreground">
                {word.word}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlay}
                className="h-7 w-7 p-0 hover:bg-primary/10"
              >
                <Play className="h-4 w-4" />
              </Button>
              {word.pronunciation && (
                <span className="text-sm text-muted-foreground">
                  [{word.pronunciation}]
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className={`text-xs ${reasonConfig.color}`}
              >
                {reasonConfig.icon}
                <span className="ml-1">{reasonConfig.label}</span>
              </Badge>

              {isAITranslated && (
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                  <Bot className="h-3 w-3 mr-1" />
                  AI翻译
                </Badge>
              )}
              
              {isOverdue && overdueDays > 0 && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  <Clock className="h-3 w-3 mr-1" />
                  过期 {overdueDays} 天
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* 释义区域 */}
          <div className="min-h-[60px]">
            {showDefinition ? (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-2">释义</p>
                <div className="max-h-40 overflow-y-auto scrollbar-thin">
                  {isAITranslated && aiTranslation ? (
                    <div className="space-y-3 pr-2">
                      {/* 词性 */}
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs font-medium">
                          {aiTranslation.partOfSpeech}
                        </Badge>
                      </div>
                      
                      {/* 中英文释义 */}
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <BookOpen className="h-3 w-3 mt-0.5 text-blue-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-foreground font-medium">
                              {aiTranslation.chineseDefinition}
                            </p>
                            <p className="text-xs text-muted-foreground italic">
                              {aiTranslation.englishDefinition}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* 例句 */}
                      {aiTranslation.example && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-2 space-y-1">
                          <div className="flex items-start space-x-2">
                            <Quote className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                            <div className="space-y-1">
                              <p className="text-xs text-foreground italic">
                                "{aiTranslation.example}"
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {aiTranslation.exampleTranslation}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 记忆辅助 */}
                      {aiTranslation.memoryAid && (
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-md p-3 border border-purple-200 dark:border-purple-700">
                          <div className="flex items-start space-x-2">
                            {aiTranslation.memoryAid.method === 'visual' ? (
                              <Lightbulb className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                            ) : (
                              <TreePine className="h-4 w-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    aiTranslation.memoryAid.method === 'visual' 
                                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  <Zap className="h-3 w-3 mr-1" />
                                  {aiTranslation.memoryAid.method === 'visual' ? '形象记忆' : '拆词记忆'}
                                </Badge>
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">
                                {aiTranslation.memoryAid.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed pr-2">
                      {word.definition}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-3 border-2 border-dashed border-muted-foreground/20">
                <p className="text-sm text-muted-foreground text-center">
                  释义已隐藏，请先回忆单词含义
                </p>
              </div>
            )}
          </div>
          
          {/* 操作按钮 */}
          {!isReviewed && (
            <div className="flex flex-col space-y-2">
              {!showDefinition && (
                <Button
                  variant="outline"
                  onClick={handleShowDefinition}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  查看释义
                </Button>
              )}
              
              {showDefinition ? (
                // 显示释义后的三个选项
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleReviewResult('unknown')}
                    className="w-full text-xs"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    不会
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleReviewResult('familiar')}
                    className="w-full text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    看了才记起
                  </Button>
                  
                  <Button
                    variant="default"
                    onClick={() => handleReviewResult('known')}
                    className="w-full bg-green-600 hover:bg-green-700 text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    记忆
                  </Button>
                </div>
              ) : (
                // 未显示释义时的两个选项
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleReviewResult('unknown')}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    不会
                  </Button>
                  
                  <Button
                    variant="default"
                    onClick={() => handleReviewResult('known')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    记忆
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* 复习统计 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>复习次数: {word.reviewCount}</span>
            <span>熟练度: {word.proficiencyLevel}/5</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}