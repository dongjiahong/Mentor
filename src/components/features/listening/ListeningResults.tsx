import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle,
  XCircle,
  RotateCcw,
  Headphones
} from 'lucide-react';
import { ListeningQuestion, UserAnswer } from '@/types';

interface ListeningResultsProps {
  questions?: ListeningQuestion[];
  userAnswers: Map<string, UserAnswer>;
  onRetry: () => void;
  onComplete: () => void;
  className?: string;
}

export function ListeningResults({
  questions,
  userAnswers,
  onRetry,
  onComplete,
  className
}: ListeningResultsProps) {
  // 计算总体得分
  const calculateScore = () => {
    if (!questions || questions.length === 0) return 0;
    
    const correctAnswers = Array.from(userAnswers.values()).filter(answer => answer.isCorrect).length;
    return Math.round((correctAnswers / questions.length) * 100);
  };

  // 如果没有题目，显示纯听力练习完成页面
  if (!questions || questions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">纯听力练习</h3>
          <p className="text-muted-foreground mb-4">
            专心听音频，提升听力理解能力
          </p>
          <Button onClick={onComplete}>
            完成练习
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-center">练习完成！</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 得分显示 */}
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">
            {calculateScore()}%
          </div>
          <p className="text-muted-foreground">
            正确 {Array.from(userAnswers.values()).filter(a => a.isCorrect).length} / {questions.length}
          </p>
        </div>

        {/* 详细结果 */}
        <div className="space-y-3">
          {questions.map((question, index) => {
            const userAnswer = userAnswers.get(question.id);
            return (
              <div key={question.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">问题 {index + 1}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {question.question}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {userAnswer?.isCorrect ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {userAnswer ? Math.round(userAnswer.timeSpent / 1000) + 's' : '未答'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRetry} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            重新练习
          </Button>
          <Button onClick={onComplete} className="flex-1">
            完成练习
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}