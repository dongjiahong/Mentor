import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  PenTool,
  Save,
  Send,
  RotateCcw,
  Clock,
  Target,
  BookOpen,
  Lightbulb,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  FileText,
  Zap,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  WritingPracticeContent,
  WritingSubmission,
  WritingScore,
  RubricCriterion,
  WRITING_PRACTICE_TYPE_DESCRIPTIONS,
  DEFAULT_WRITING_RUBRIC
} from '@/types';

interface WritingPracticePanelProps {
  content: WritingPracticeContent;
  onBack: () => void;
  onComplete: () => void;
  className?: string;
}

interface WritingState {
  currentContent: string;
  wordCount: number;
  timeSpent: number;
  startTime: number;
  status: 'draft' | 'submitted' | 'graded';
  score?: WritingScore;
  autoSaveTimer?: NodeJS.Timeout;
}

// 简单的AI写作评分算法
const evaluateWriting = (content: string, practiceContent: WritingPracticeContent): WritingScore => {
  const wordCount = content.trim().split(/\s+/).length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgWordsPerSentence = wordCount / sentences.length;
  
  // 基础评分标准
  const rubric = practiceContent.rubric || DEFAULT_WRITING_RUBRIC;
  const criteriaScores = rubric.criteria.map(criterion => {
    let score = 0;
    const maxScore = criterion.maxPoints;

    switch (criterion.id) {
      case 'content':
        // 内容评分：基于字数和是否包含关键词
        if (practiceContent.wordLimit) {
          const lengthRatio = Math.min(wordCount / practiceContent.wordLimit, 1);
          score = maxScore * (0.5 + lengthRatio * 0.5);
        } else {
          score = maxScore * 0.8; // 默认给80%
        }
        
        // 关键词检查
        if (practiceContent.keywords) {
          const keywordCount = practiceContent.keywords.filter(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
          ).length;
          const keywordBonus = (keywordCount / practiceContent.keywords.length) * maxScore * 0.2;
          score = Math.min(maxScore, score + keywordBonus);
        }
        break;

      case 'organization':
        // 结构评分：基于段落数量和句子长度变化
        const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
        if (paragraphs.length >= 3) {
          score = maxScore * 0.9; // 有清晰结构
        } else if (paragraphs.length >= 2) {
          score = maxScore * 0.7;
        } else {
          score = maxScore * 0.5;
        }
        break;

      case 'grammar':
        // 语法评分：简单的启发式规则
        const commonErrors = [
          /\b(dont|wont|cant|shouldnt)\b/gi, // 缺少撇号
          /\b[a-z]/g, // 句首小写
          /[.!?]\s*[a-z]/g, // 句后小写
        ];
        
        let errorCount = 0;
        commonErrors.forEach(pattern => {
          const matches = content.match(pattern);
          if (matches) errorCount += matches.length;
        });
        
        const errorRate = errorCount / sentences.length;
        score = maxScore * Math.max(0.4, 1 - errorRate * 0.5);
        break;

      case 'vocabulary':
        // 词汇评分：基于词汇多样性
        const words = content.toLowerCase().match(/\b\w+\b/g) || [];
        const uniqueWords = new Set(words);
        const vocabularyDiversity = uniqueWords.size / words.length;
        score = maxScore * (0.3 + vocabularyDiversity * 0.7);
        break;

      case 'mechanics':
        // 语法机制评分：标点符号、拼写等
        const punctuationCount = (content.match(/[.!?:;,]/g) || []).length;
        const punctuationRatio = punctuationCount / sentences.length;
        score = maxScore * Math.min(1, punctuationRatio);
        break;

      default:
        score = maxScore * 0.75; // 默认75%
    }

    return {
      criterionId: criterion.id,
      score: Math.round(score),
      maxScore,
      feedback: generateCriterionFeedback(criterion.id, score, maxScore)
    };
  });

  const totalScore = criteriaScores.reduce((sum, cs) => sum + cs.score, 0);
  const maxTotalScore = criteriaScores.reduce((sum, cs) => sum + cs.maxScore, 0);

  return {
    totalScore,
    maxScore: maxTotalScore,
    criteriaScores,
    overallFeedback: generateOverallFeedback(totalScore, maxTotalScore, wordCount, sentences.length),
    suggestions: generateSuggestions(content, practiceContent, criteriaScores),
    gradedAt: new Date()
  };
};

// 生成单项反馈
const generateCriterionFeedback = (criterionId: string, score: number, maxScore: number): string => {
  const percentage = (score / maxScore) * 100;
  
  const feedbacks = {
    content: {
      excellent: '内容丰富，观点明确，很好地回应了写作要求。',
      good: '内容基本完整，观点较为明确。',
      fair: '内容有所欠缺，建议补充更多细节和例子。',
      poor: '内容过于简单，需要更多支撑观点的内容。'
    },
    organization: {
      excellent: '文章结构清晰，逻辑流畅，段落安排合理。',
      good: '结构较为清晰，逻辑基本流畅。',
      fair: '结构需要改进，建议使用更清晰的段落划分。',
      poor: '结构混乱，需要重新组织文章逻辑。'
    },
    grammar: {
      excellent: '语法使用准确，句式多样。',
      good: '语法基本正确，偶有小错误。',
      fair: '存在一些语法错误，建议仔细检查。',
      poor: '语法错误较多，需要加强语法练习。'
    },
    vocabulary: {
      excellent: '词汇使用恰当且富有变化。',
      good: '词汇使用基本恰当。',
      fair: '词汇使用一般，可以尝试使用更多样的词汇。',
      poor: '词汇使用单调，需要扩大词汇量。'
    },
    mechanics: {
      excellent: '标点符号使用正确，拼写准确。',
      good: '标点和拼写基本正确。',
      fair: '标点或拼写有些小问题。',
      poor: '标点符号和拼写需要改进。'
    }
  };

  const criterion = feedbacks[criterionId as keyof typeof feedbacks];
  if (!criterion) return '评分完成。';

  if (percentage >= 90) return criterion.excellent;
  if (percentage >= 75) return criterion.good;
  if (percentage >= 60) return criterion.fair;
  return criterion.poor;
};

// 生成总体反馈
const generateOverallFeedback = (totalScore: number, maxScore: number, wordCount: number, sentenceCount: number): string => {
  const percentage = (totalScore / maxScore) * 100;
  
  let feedback = '';
  if (percentage >= 90) {
    feedback = '优秀！这是一篇高质量的作文，各方面表现都很出色。';
  } else if (percentage >= 80) {
    feedback = '很好！作文质量不错，在个别方面还有提升空间。';
  } else if (percentage >= 70) {
    feedback = '良好！作文基本达到要求，建议在薄弱环节多加练习。';
  } else if (percentage >= 60) {
    feedback = '及格！作文有一定基础，但需要在多个方面进行改进。';
  } else {
    feedback = '需要改进。建议多读范文，加强基础写作技能练习。';
  }

  feedback += ` 全文共 ${wordCount} 词，${sentenceCount} 句。`;
  
  return feedback;
};

// 生成改进建议
const generateSuggestions = (
  content: string, 
  practiceContent: WritingPracticeContent, 
  criteriaScores: any[]
): string[] => {
  const suggestions: string[] = [];
  
  // 基于评分结果给出建议
  criteriaScores.forEach(cs => {
    const percentage = (cs.score / cs.maxScore) * 100;
    if (percentage < 70) {
      switch (cs.criterionId) {
        case 'content':
          suggestions.push('尝试添加更多具体的例子和细节来支撑你的观点');
          break;
        case 'organization':
          suggestions.push('使用连接词（如however, therefore, in addition）来改善段落间的逻辑连接');
          break;
        case 'grammar':
          suggestions.push('写作完成后仔细检查语法，特别注意动词时态的一致性');
          break;
        case 'vocabulary':
          suggestions.push('尝试使用更丰富多样的词汇，避免重复使用相同的词语');
          break;
        case 'mechanics':
          suggestions.push('仔细检查标点符号和拼写，确保符合英语写作规范');
          break;
      }
    }
  });

  // 字数相关建议
  const wordCount = content.trim().split(/\s+/).length;
  if (practiceContent.wordLimit && wordCount < practiceContent.wordLimit * 0.8) {
    suggestions.push(`当前字数较少（${wordCount}词），建议扩展内容达到要求的${practiceContent.wordLimit}词`);
  }

  // 如果没有建议，给出通用建议
  if (suggestions.length === 0) {
    suggestions.push('继续保持良好的写作习惯，多读优秀范文来提升写作水平');
  }

  return suggestions.slice(0, 3); // 最多显示3条建议
};

export function WritingPracticePanel({
  content,
  onBack,
  onComplete,
  className
}: WritingPracticePanelProps) {
  const [writingState, setWritingState] = useState<WritingState>({
    currentContent: '',
    wordCount: 0,
    timeSpent: 0,
    startTime: Date.now(),
    status: 'draft'
  });

  const [showPrompt, setShowPrompt] = useState(true);
  const [showSample, setShowSample] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 更新字数和时间
  useEffect(() => {
    const timer = setInterval(() => {
      setWritingState(prev => ({
        ...prev,
        timeSpent: Math.floor((Date.now() - prev.startTime) / 1000)
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 自动保存
  useEffect(() => {
    if (writingState.autoSaveTimer) {
      clearTimeout(writingState.autoSaveTimer);
    }

    const timer = setTimeout(() => {
      // 这里可以实现自动保存逻辑
      console.log('自动保存草稿');
    }, 5000);

    setWritingState(prev => ({
      ...prev,
      autoSaveTimer: timer
    }));

    return () => {
      if (writingState.autoSaveTimer) {
        clearTimeout(writingState.autoSaveTimer);
      }
    };
  }, [writingState.currentContent]);

  // 处理内容变化
  const handleContentChange = useCallback((value: string) => {
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
    setWritingState(prev => ({
      ...prev,
      currentContent: value,
      wordCount
    }));
  }, []);

  // 提交作文
  const handleSubmit = useCallback(() => {
    if (!writingState.currentContent.trim()) return;

    const score = evaluateWriting(writingState.currentContent, content);
    
    setWritingState(prev => ({
      ...prev,
      status: 'graded',
      score
    }));
  }, [writingState.currentContent, content]);

  // 重新开始
  const handleRestart = useCallback(() => {
    setWritingState({
      currentContent: '',
      wordCount: 0,
      timeSpent: 0,
      startTime: Date.now(),
      status: 'draft'
    });
    setShowPrompt(true);
  }, []);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // 获取字数状态颜色
  const getWordCountColor = () => {
    if (!content.wordLimit) return 'text-muted-foreground';
    
    const ratio = writingState.wordCount / content.wordLimit;
    if (ratio < 0.7) return 'text-red-600';
    if (ratio > 1.2) return 'text-orange-600';
    if (ratio >= 0.9 && ratio <= 1.1) return 'text-green-600';
    return 'text-blue-600';
  };

  return (
    <div className={cn("max-w-5xl mx-auto p-4 space-y-6", className)}>
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      {/* 头部信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{content.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{content.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">
                  {WRITING_PRACTICE_TYPE_DESCRIPTIONS[content.practiceType]}
                </Badge>
                <Badge variant="outline">{content.level}</Badge>
                <Badge variant="outline">难度 {content.difficulty}/5</Badge>
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-mono">{formatTime(writingState.timeSpent)}</span>
              </div>
              {content.timeLimit && (
                <div className="text-sm text-muted-foreground">
                  时间限制: {content.timeLimit} 分钟
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 写作要求和提示 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              写作要求
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrompt(!showPrompt)}
            >
              {showPrompt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="ml-2">{showPrompt ? '隐藏' : '显示'}</span>
            </Button>
          </div>
        </CardHeader>
        {showPrompt && (
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-l-primary">
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {content.prompt}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {content.wordLimit && (
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span>字数要求: {content.wordLimit} 词</span>
                </div>
              )}
              {content.timeLimit && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span>时间限制: {content.timeLimit} 分钟</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-600" />
                <span>预计用时: {content.estimatedDuration} 分钟</span>
              </div>
            </div>

            {/* 关键词提示 */}
            {content.keywords && content.keywords.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">建议使用的关键词:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {content.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* 写作模板 */}
            {content.templates && content.templates.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">💡 写作模板参考:</div>
                <div className="space-y-2">
                  {content.templates.map((template, index) => (
                    <div key={index} className="p-3 bg-muted rounded text-sm">
                      <pre className="whitespace-pre-wrap font-mono text-xs">
                        {template}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs"
                        onClick={() => {
                          handleContentChange(template);
                          textareaRef.current?.focus();
                        }}
                      >
                        使用此模板
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 评价标准 */}
            {content.evaluationCriteria && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">评价标准:</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-800">
                    {(() => {
                      try {
                        const criteria = JSON.parse(content.evaluationCriteria);
                        return (
                          <div className="grid gap-3">
                            {Object.entries(criteria).map(([key, value]: [string, unknown], index: number) => (
                              <div key={`writing-criteria-${key}-${index}`} className="flex flex-col">
                                <div className="font-medium text-blue-900 mb-1">{key}:</div>
                                <div className="text-blue-700 pl-3 border-l-2 border-blue-300">{String(value)}</div>
                              </div>
                            ))}
                          </div>
                        );
                      } catch {
                        return <div className="whitespace-pre-line">{content.evaluationCriteria}</div>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* 写作大纲建议 */}
            {content.sampleOutline && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">写作大纲建议:</span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-800">
                    {(() => {
                      try {
                        const outlineObj = JSON.parse(content.sampleOutline);
                        return (
                          <div className="space-y-4">
                            {Object.entries(outlineObj).map(([section, content], index) => (
                              <div key={`outline-section-${section}`} className="border-l-3 border-green-400 pl-4 py-2">
                                <div className="font-semibold text-green-900 mb-2 flex items-center">
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-3">
                                    {index + 1}
                                  </span>
                                  {section}
                                </div>
                                <div className="text-green-700 ml-7 text-sm leading-relaxed">
                                  {String(content)}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      } catch (error) {
                        // 兜底显示，虽然现在应该都是对象格式了
                        return (
                          <div className="text-green-700 whitespace-pre-line">
                            {content.sampleOutline}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* 参考答案 */}
            {content.sampleAnswer && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">📝 参考答案:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSample(!showSample)}
                  >
                    {showSample ? '隐藏' : '查看'}参考答案
                  </Button>
                </div>
                {showSample && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {content.sampleAnswer}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* 写作区域 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              写作区域
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className={cn("text-sm font-mono", getWordCountColor())}>
                {writingState.wordCount}
                {content.wordLimit && ` / ${content.wordLimit}`} 词
              </div>
              <Badge variant="outline">
                {writingState.status === 'draft' ? '草稿' : 
                 writingState.status === 'submitted' ? '已提交' : '已评分'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {writingState.status === 'draft' ? (
            <div className="space-y-4">
              <Textarea
                ref={textareaRef}
                placeholder="请在这里开始你的写作..."
                value={writingState.currentContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="min-h-[400px] text-base leading-relaxed"
                disabled={writingState.status !== 'draft'}
              />
              
              {/* 进度指示器 */}
              {content.wordLimit && (
                <div className="space-y-2">
                  <Progress 
                    value={Math.min(100, (writingState.wordCount / content.wordLimit) * 100)}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>字数进度</span>
                    <span>
                      {((writingState.wordCount / content.wordLimit) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // 实现保存草稿功能
                    console.log('保存草稿');
                  }}
                  disabled={!writingState.currentContent.trim()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  保存草稿
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!writingState.currentContent.trim()}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  提交作文
                </Button>
              </div>

              {/* 写作提示 */}
              <div className="text-xs text-muted-foreground">
                💡 提示: 作文将自动保存草稿。建议写作完成后仔细检查语法和拼写。
              </div>
            </div>
          ) : (
            /* 已提交的作文显示（只读） */
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">提交的作文:</div>
                <div className="whitespace-pre-wrap text-base leading-relaxed">
                  {writingState.currentContent}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>字数: {writingState.wordCount}</span>
                <span>用时: {formatTime(writingState.timeSpent)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 评分结果 */}
      {writingState.status === 'graded' && writingState.score && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              写作评估结果
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 总分显示 */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {writingState.score.totalScore} / {writingState.score.maxScore}
              </div>
              <div className="text-lg text-muted-foreground mb-4">
                {Math.round((writingState.score.totalScore / writingState.score.maxScore) * 100)}%
              </div>
              <p className="text-base leading-relaxed">
                {writingState.score.overallFeedback}
              </p>
            </div>

            <Separator />

            {/* 分项评分 */}
            <div>
              <h4 className="font-medium mb-4">详细评分:</h4>
              <div className="space-y-3">
                {writingState.score.criteriaScores.map((cs, index) => {
                  const criterion = (content.rubric || DEFAULT_WRITING_RUBRIC)
                    .criteria.find(c => c.id === cs.criterionId);
                  
                  return (
                    <div key={cs.criterionId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          {criterion?.name || cs.criterionId}
                        </span>
                        <span className="font-bold">
                          {cs.score} / {cs.maxScore}
                        </span>
                      </div>
                      <Progress 
                        value={(cs.score / cs.maxScore) * 100}
                        className="mb-2"
                      />
                      <p className="text-sm text-muted-foreground">
                        {cs.feedback}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* 改进建议 */}
            <div>
              <h4 className="font-medium mb-3">改进建议:</h4>
              <div className="space-y-2">
                {writingState.score.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRestart} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                重新写作
              </Button>
              <Button onClick={onComplete} className="flex-1">
                完成练习
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}