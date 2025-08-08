import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ListeningQuestion, UserAnswer } from '@/types';

interface ListeningQuestionsProps {
  questions: ListeningQuestion[];
  currentQuestionIndex: number;
  userAnswers: Map<string, UserAnswer>;
  onAnswerSubmit: (questionId: string, answer: string) => void;
  onQuestionChange: (index: number) => void;
  onSeek: (time: number) => void;
  className?: string;
}

export function ListeningQuestions({
  questions,
  currentQuestionIndex,
  userAnswers,
  onAnswerSubmit,
  onQuestionChange,
  onSeek,
  className
}: ListeningQuestionsProps) {
  // 渲染问题
  const renderQuestion = (question: ListeningQuestion, index: number) => {
    const userAnswer = userAnswers.get(question.id);
    const isAnswered = userAnswer !== undefined;

    return (
      <Card key={question.id} className="border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              问题 {index + 1}
            </CardTitle>
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
          
          {/* 音频时间提示 */}
          {question.startTime !== undefined && question.endTime !== undefined && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>相关音频: {Math.floor(question.startTime / 60)}:{String(Math.floor(question.startTime % 60)).padStart(2, '0')} - {Math.floor(question.endTime / 60)}:{String(Math.floor(question.endTime % 60)).padStart(2, '0')}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSeek(question.startTime!)}
                className="h-6 px-2"
              >
                跳转
              </Button>
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
                  onClick={() => !isAnswered && onAnswerSubmit(question.id, option)}
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

          {question.type === 'fill_blank' && (
            <div className="space-y-2">
              <Input
                placeholder="请输入答案..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value && !isAnswered) {
                    onAnswerSubmit(question.id, e.currentTarget.value);
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
                onClick={() => !isAnswered && onAnswerSubmit(question.id, 'true')}
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
                onClick={() => !isAnswered && onAnswerSubmit(question.id, 'false')}
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
              <Textarea
                placeholder="请输入你的答案..."
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && e.currentTarget.value && !isAnswered) {
                    onAnswerSubmit(question.id, e.currentTarget.value);
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
                        onAnswerSubmit(question.id, textarea.value);
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

  if (!questions || questions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">听力练习题</h3>
        <div className="text-sm text-muted-foreground">
          {userAnswers.size} / {questions.length} 已完成
        </div>
      </div>
      
      {/* 进度条 */}
      <Progress 
        value={(userAnswers.size / questions.length) * 100}
        className="w-full"
      />

      {/* 当前题目 */}
      {questions[currentQuestionIndex] && 
        renderQuestion(questions[currentQuestionIndex], currentQuestionIndex)
      }

      {/* 题目导航 */}
      {questions.length > 1 && (
        <div className="flex justify-center gap-2">
          {questions.map((_, index) => (
            <Button
              key={index}
              variant={index === currentQuestionIndex ? "default" : "outline"}
              size="sm"
              onClick={() => onQuestionChange(index)}
              className={cn(
                "w-10 h-10",
                userAnswers.has(questions[index].id) && 
                "ring-2 ring-green-500"
              )}
            >
              {index + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}