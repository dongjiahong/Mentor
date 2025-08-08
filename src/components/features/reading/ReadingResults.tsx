import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReadingQuestion } from '@/types';

interface ReadingResultsProps {
  showResults: boolean;
  comprehensionScore: number;
  readingTime: number;
  readingSpeed: number;
  questions: ReadingQuestion[];
  userAnswers: Map<string, {
    answer: string;
    isCorrect?: boolean;
    timeSpent: number;
  }>;
  formatTime: (seconds: number) => string;
  getReadingSpeedLevel: () => { level: string; color: string };
  onRestart: () => void;
  onComplete: () => void;
  className?: string;
}

export function ReadingResults({
  showResults,
  comprehensionScore,
  readingTime,
  readingSpeed,
  questions,
  userAnswers,
  formatTime,
  getReadingSpeedLevel,
  onRestart,
  onComplete,
  className
}: ReadingResultsProps) {
  if (!showResults) {
    return null;
  }

  // 如果有问题，显示完整结果
  if (questions && questions.length > 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-center">阅读练习完成！</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 综合得分 */}
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-2">
              {comprehensionScore}%
            </div>
            <p className="text-muted-foreground">
              理解正确率 {Array.from(userAnswers.values()).filter(a => a.isCorrect).length} / {questions.length}
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
              <div className={cn("text-lg font-bold", getReadingSpeedLevel().color)}>
                {Math.round(readingSpeed)}
              </div>
              <div className="text-xs text-muted-foreground">字/分钟</div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onRestart} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              重新阅读
            </Button>
            <Button onClick={onComplete} className="flex-1">
              完成练习
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 纯阅读模式的完成页面
  return (
    <Card className={className}>
      <CardContent className="text-center py-8">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">纯阅读练习</h3>
        <p className="text-muted-foreground mb-4">
          专心阅读文本，提升阅读理解能力和词汇量
        </p>
        <div className="text-sm text-muted-foreground mb-4">
          阅读时间: {formatTime(readingTime)} | 
          阅读速度: {Math.round(readingSpeed)} 字/分钟
        </div>
        <Button onClick={onComplete}>
          完成阅读
        </Button>
      </CardContent>
    </Card>
  );
}