import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Volume2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Target,
  ArrowLeft,
  RotateCcw,
  Zap,
  Timer,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  UniversalContent,
  ReadingPracticeContent,
  ReadingQuestion,
  VocabularyItem,
  READING_PRACTICE_TYPE_DESCRIPTIONS,
  WordDefinition
} from '@/types';
import { useSpeech } from '@/hooks/useSpeech';
import { useWordbook } from '@/hooks/useWordbook';
import { WordPopover } from '@/components/features/WordPopover';

interface ReadingPracticePanelProps {
  content: ReadingPracticeContent | UniversalContent;
  onBack: () => void;
  onComplete: () => void;
  className?: string;
}

interface ReadingState {
  currentQuestionIndex: number;
  userAnswers: Map<string, {
    answer: string;
    isCorrect?: boolean;
    timeSpent: number;
  }>;
  showTranslation: boolean;
  readingStartTime: number;
  questionStartTime: number;
  highlightedWords: Set<string>;
  readingSpeed: number; // 字/分钟
  comprehensionScore: number;
}

// 将UniversalContent转换为ReadingPracticeContent
function convertToReadingContent(content: UniversalContent): ReadingPracticeContent {
  return {
    id: content.id,
    title: content.title,
    description: content.description,
    level: content.level,
    category: content.category,
    practiceType: 'comprehension',
    text: content.originalText || '',
    wordCount: content.wordCount || 0,
    questions: [], // 可以根据内容动态生成问题
    vocabulary: [], // 可以提取重要词汇
    estimatedDuration: content.estimatedDuration,
    difficulty: 3
  };
}

// 阅读速度评级
const getReadingSpeedLevel = (speed: number) => {
  if (speed >= 250) return { level: '快速', color: 'text-green-600' };
  if (speed >= 200) return { level: '良好', color: 'text-blue-600' };
  if (speed >= 150) return { level: '一般', color: 'text-yellow-600' };
  return { level: '需要提升', color: 'text-red-600' };
};

export function ReadingPracticePanel({
  content,
  onBack,
  onComplete,
  className
}: ReadingPracticePanelProps) {
  // 确保content是ReadingPracticeContent类型
  const readingContent: ReadingPracticeContent = 
    'practiceType' in content ? content : convertToReadingContent(content);

  const [readingState, setReadingState] = useState<ReadingState>({
    currentQuestionIndex: 0,
    userAnswers: new Map(),
    showTranslation: false,
    readingStartTime: Date.now(),
    questionStartTime: Date.now(),
    highlightedWords: new Set(),
    readingSpeed: 0,
    comprehensionScore: 0
  });

  const [selectedWord, setSelectedWord] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [wordPopover, setWordPopover] = useState<{ word: string; position: { x: number; y: number } } | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const { speak, isSupported: speechSupported } = useSpeech();
  const { addWord } = useWordbook();

  // 计算阅读时间
  useEffect(() => {
    const interval = setInterval(() => {
      setReadingTime(Math.floor((Date.now() - readingState.readingStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [readingState.readingStartTime]);

  // 计算阅读速度（使用useCallback避免重复计算）
  const currentSpeed = readingTime > 0 && readingContent.wordCount > 0 
    ? (readingContent.wordCount / readingTime) * 60 
    : 0;

  // 只在速度变化时更新状态
  useEffect(() => {
    if (Math.abs(currentSpeed - readingState.readingSpeed) > 1) { // 避免微小变化造成频繁更新
      setReadingState(prev => ({ ...prev, readingSpeed: currentSpeed }));
    }
  }, [currentSpeed, readingState.readingSpeed]);

  // 播放文本语音
  const playText = useCallback((text: string) => {
    if (speechSupported) {
      speak(text, { rate: 0.9, pitch: 1.0 });
    }
  }, [speak, speechSupported]);

  // 处理单词点击
  const handleWordClick = useCallback((word: string, event: React.MouseEvent) => {
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    
    // 批量更新状态，避免多次渲染
    setSelectedWord(cleanWord);
    
    // 显示查词弹窗
    setWordPopover({
      word: cleanWord,
      position: { x: event.clientX, y: event.clientY }
    });
    
    setReadingState(prev => {
      // 避免不必要的状态更新
      if (prev.highlightedWords.has(cleanWord)) {
        return prev;
      }
      return {
        ...prev,
        highlightedWords: new Set(prev.highlightedWords).add(cleanWord)
      };
    });
  }, []);

  // 处理答案提交
  const handleAnswerSubmit = useCallback((questionId: string, answer: string) => {
    const question = readingContent.questions?.[readingState.currentQuestionIndex];
    if (!question) return;

    const timeSpent = Date.now() - readingState.questionStartTime;
    const isCorrect = question.correctAnswer.toLowerCase().trim() === answer.toLowerCase().trim();

    setReadingState(prev => ({
      ...prev,
      userAnswers: new Map(prev.userAnswers.set(questionId, {
        answer,
        isCorrect,
        timeSpent
      }))
    }));

    // 自动进入下一题或显示结果
    setTimeout(() => {
      if (readingState.currentQuestionIndex < (readingContent.questions?.length || 0) - 1) {
        setReadingState(prev => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex + 1,
          questionStartTime: Date.now()
        }));
      } else {
        calculateFinalScore();
        setShowResults(true);
      }
    }, 1500);
  }, [readingContent.questions, readingState.currentQuestionIndex, readingState.questionStartTime]);

  // 计算最终得分
  const calculateFinalScore = useCallback(() => {
    if (!readingContent.questions || readingContent.questions.length === 0) {
      setReadingState(prev => ({ ...prev, comprehensionScore: 80 })); // 纯阅读给个基础分
      return;
    }

    const totalQuestions = readingContent.questions.length;
    const correctAnswers = Array.from(readingState.userAnswers.values())
      .filter(answer => answer.isCorrect).length;
    
    const baseScore = (correctAnswers / totalQuestions) * 100;
    
    // 根据阅读速度调整分数
    let speedBonus = 0;
    if (readingState.readingSpeed >= 200) speedBonus = 10;
    else if (readingState.readingSpeed >= 150) speedBonus = 5;

    const finalScore = Math.min(100, Math.round(baseScore + speedBonus));
    setReadingState(prev => ({ ...prev, comprehensionScore: finalScore }));
  }, [readingContent.questions, readingState.userAnswers, readingState.readingSpeed]);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // 渲染高亮文本（返回span而不是div，避免HTML嵌套错误）
  const renderHighlightedText = (text: string) => {
    if (!text) return null;

    const words = text.split(/(\s+)/);
    return (
      <>
        {words.map((word, index) => {
          const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
          const isHighlighted = readingState.highlightedWords.has(cleanWord);
          const isSelected = selectedWord === cleanWord;

          if (!word.trim()) return <span key={index}>{word}</span>;

          return (
            <span
              key={index}
              onClick={(event) => handleWordClick(word, event)}
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

  // 渲染问题
  const renderQuestion = (question: ReadingQuestion, index: number) => {
    const userAnswer = readingState.userAnswers.get(question.id);
    const isAnswered = userAnswer !== undefined;

    return (
      <Card key={question.id} className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">问题 {index + 1}</CardTitle>
            <Badge variant={isAnswered ? 
              (userAnswer?.isCorrect ? "default" : "destructive") : 
              "secondary"
            }>
              {isAnswered ? (userAnswer?.isCorrect ? "正确" : "错误") : "未答"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base font-medium">{question.question}</p>
          
          {/* 相关段落提示 */}
          {question.paragraph && (
            <div className="text-sm text-muted-foreground">
              💡 提示：请参考第 {question.paragraph} 段
            </div>
          )}

          {/* 问题类型特定的输入 */}
          {question.type === 'multiple_choice' && question.options && (
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <Button
                  key={optionIndex}
                  variant={
                    isAnswered
                      ? option === question.correctAnswer
                        ? "default"
                        : option === userAnswer?.answer
                          ? "destructive"
                          : "outline"
                      : "outline"
                  }
                  className="w-full justify-start text-left"
                  onClick={() => !isAnswered && handleAnswerSubmit(question.id, option)}
                  disabled={isAnswered}
                >
                  <span className="mr-2 font-mono">
                    {String.fromCharCode(65 + optionIndex)}.
                  </span>
                  {option}
                  {isAnswered && option === question.correctAnswer && (
                    <CheckCircle className="h-4 w-4 ml-auto" />
                  )}
                  {isAnswered && option === userAnswer?.answer && option !== question.correctAnswer && (
                    <XCircle className="h-4 w-4 ml-auto" />
                  )}
                </Button>
              ))}
            </div>
          )}

          {question.type === 'true_false' && (
            <div className="flex gap-2">
              <Button
                variant={
                  isAnswered
                    ? question.correctAnswer === 'true'
                      ? "default"
                      : userAnswer?.answer === 'true'
                        ? "destructive"
                        : "outline"
                    : "outline"
                }
                onClick={() => !isAnswered && handleAnswerSubmit(question.id, 'true')}
                disabled={isAnswered}
                className="flex-1"
              >
                正确
                {isAnswered && question.correctAnswer === 'true' && (
                  <CheckCircle className="h-4 w-4 ml-2" />
                )}
              </Button>
              <Button
                variant={
                  isAnswered
                    ? question.correctAnswer === 'false'
                      ? "default"
                      : userAnswer?.answer === 'false'
                        ? "destructive"
                        : "outline"
                    : "outline"
                }
                onClick={() => !isAnswered && handleAnswerSubmit(question.id, 'false')}
                disabled={isAnswered}
                className="flex-1"
              >
                错误
                {isAnswered && question.correctAnswer === 'false' && (
                  <CheckCircle className="h-4 w-4 ml-2" />
                )}
              </Button>
            </div>
          )}

          {question.type === 'short_answer' && (
            <div className="space-y-2">
              <Input
                placeholder="请输入你的答案..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value && !isAnswered) {
                    handleAnswerSubmit(question.id, e.currentTarget.value);
                  }
                }}
                disabled={isAnswered}
              />
              {!isAnswered && (
                <p className="text-sm text-muted-foreground">
                  输入答案后按回车键确认
                </p>
              )}
            </div>
          )}

          {question.type === 'essay' && (
            <div className="space-y-2">
              <Textarea
                placeholder="请写出你的详细答案..."
                rows={4}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && e.currentTarget.value && !isAnswered) {
                    handleAnswerSubmit(question.id, e.currentTarget.value);
                  }
                }}
                disabled={isAnswered}
              />
              {!isAnswered && (
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    按 Ctrl + Enter 提交答案
                  </p>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                      if (textarea?.value) {
                        handleAnswerSubmit(question.id, textarea.value);
                      }
                    }}
                  >
                    提交
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 答案解释 */}
          {isAnswered && question.explanation && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>解释：</strong>{question.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
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
              <CardTitle className="text-xl">{readingContent.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{readingContent.description}</p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="text-lg font-semibold">{formatTime(readingTime)}</div>
                <div className="text-sm text-muted-foreground">阅读时间</div>
              </div>
              {readingState.readingSpeed > 0 && (
                <div>
                  <div className={cn("text-lg font-semibold", getReadingSpeedLevel(readingState.readingSpeed).color)}>
                    {Math.round(readingState.readingSpeed)}
                  </div>
                  <div className="text-sm text-muted-foreground">字/分钟</div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 阅读统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card>
          <CardContent className="p-2 text-center">
            <BookOpen className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-bold">{readingContent.wordCount}</div>
            <div className="text-xs text-muted-foreground">单词数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <Timer className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <div className="text-lg font-bold">{readingContent.estimatedDuration}</div>
            <div className="text-xs text-muted-foreground">预估分钟</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <Target className="h-4 w-4 mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-bold">{readingContent.difficulty}/5</div>
            <div className="text-xs text-muted-foreground">难度等级</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <Zap className="h-4 w-4 mx-auto mb-1 text-orange-600" />
            <div className="text-lg font-bold">{getReadingSpeedLevel(readingState.readingSpeed).level}</div>
            <div className="text-xs text-muted-foreground">阅读速度</div>
          </CardContent>
        </Card>
      </div>

      {/* 阅读文本 */}
      <Card>
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
                  onClick={() => playText(readingContent.text)}
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  朗读全文
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReadingState(prev => ({ ...prev, showTranslation: !prev.showTranslation }))}
              >
                {readingState.showTranslation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="ml-2">{readingState.showTranslation ? '隐藏' : '显示'}翻译</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={textRef} className="prose max-w-none">
            <div className="text-base leading-relaxed space-y-4">
              {readingContent.text.split('\n\n').map((paragraph, index) => (
                <div key={index} className="text-justify leading-relaxed">
                  {renderHighlightedText(paragraph)}
                </div>
              ))}
            </div>
          </div>
          
          {/* 翻译显示 */}
          {readingState.showTranslation && content.translation && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">中文翻译：</h4>
              <div className="text-sm leading-relaxed space-y-2">
                {content.translation.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          )}

          {/* 选中词汇信息 */}
          {selectedWord && !wordPopover && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg border-l-4 border-l-primary">
              <div className="flex items-center justify-between">
                <span className="font-medium">选中词汇: "{selectedWord}"</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedWord('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>


      {/* 阅读理解题目 */}
      {readingContent.questions && readingContent.questions.length > 0 && !showResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">阅读理解题</h3>
            <div className="text-sm text-muted-foreground">
              {readingState.userAnswers.size} / {readingContent.questions.length} 已完成
            </div>
          </div>
          
          <Progress 
            value={(readingState.userAnswers.size / readingContent.questions.length) * 100}
            className="w-full"
          />

          {/* 当前题目 */}
          {readingContent.questions[readingState.currentQuestionIndex] && 
            renderQuestion(readingContent.questions[readingState.currentQuestionIndex], readingState.currentQuestionIndex)
          }

          {/* 题目导航 */}
          {readingContent.questions.length > 1 && (
            <div className="flex justify-center gap-2">
              {readingContent.questions.map((_, index) => (
                <Button
                  key={index}
                  variant={index === readingState.currentQuestionIndex ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setReadingState(prev => ({
                      ...prev,
                      currentQuestionIndex: index,
                      questionStartTime: Date.now()
                    }));
                  }}
                  className={cn(
                    "w-10 h-10",
                    readingState.userAnswers.has(readingContent.questions![index].id) && 
                    "ring-2 ring-green-500"
                  )}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 结果页面 */}
      {showResults && readingContent.questions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">阅读练习完成！</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 综合得分 */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {readingState.comprehensionScore}%
              </div>
              <p className="text-muted-foreground">
                理解正确率 {Array.from(readingState.userAnswers.values()).filter(a => a.isCorrect).length} / {readingContent.questions.length}
              </p>
            </div>

            {/* 阅读统计 */}
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {formatTime(readingTime)}
                </div>
                <div className="text-xs text-muted-foreground">总阅读时间</div>
              </div>
              <div>
                <div className={cn("text-lg font-bold", getReadingSpeedLevel(readingState.readingSpeed).color)}>
                  {Math.round(readingState.readingSpeed)}
                </div>
                <div className="text-xs text-muted-foreground">字/分钟</div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setShowResults(false);
                setReadingState(prev => ({
                  ...prev,
                  currentQuestionIndex: 0,
                  userAnswers: new Map(),
                  questionStartTime: Date.now(),
                  readingStartTime: Date.now(),
                  comprehensionScore: 0
                }));
                setReadingTime(0);
              }} className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" />
                重新阅读
              </Button>
              <Button onClick={onComplete} className="flex-1">
                完成练习
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 无题目时的完成按钮 */}
      {(!readingContent.questions || readingContent.questions.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">纯阅读练习</h3>
            <p className="text-muted-foreground mb-4">
              专心阅读文本，提升阅读理解能力和词汇量
            </p>
            <div className="text-sm text-muted-foreground mb-4">
              阅读时间: {formatTime(readingTime)} | 
              阅读速度: {Math.round(readingState.readingSpeed)} 字/分钟
            </div>
            <Button onClick={onComplete}>
              完成阅读
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* 查词弹窗 */}
      {wordPopover && (
        <WordPopover
          word={wordPopover.word}
          position={wordPopover.position}
          onClose={() => {
            setWordPopover(null);
            setSelectedWord('');
          }}
          onAddToWordbook={async (word: string, definition: WordDefinition) => {
            try {
              // 将 WordDefinition 转换为字符串格式
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
          }}
        />
      )}
    </div>
  );
}