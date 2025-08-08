import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, RotateCcw, ArrowRight } from 'lucide-react';
import { PronunciationScore } from '@/types';

interface PronunciationFeedbackProps {
  score: PronunciationScore;
  onRetry: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  showNext: boolean;
  nextLabel?: string;
}

export function PronunciationFeedback({
  score,
  onRetry,
  onNext,
  onComplete,
  showNext,
  nextLabel = "下一个"
}: PronunciationFeedbackProps) {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          发音评估
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 分数显示 */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">
              {score.overallScore}
            </div>
            <div className="text-sm text-muted-foreground">总分</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {score.accuracyScore}
            </div>
            <div className="text-sm text-muted-foreground">准确度</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {score.fluencyScore}
            </div>
            <div className="text-sm text-muted-foreground">流利度</div>
          </div>
        </div>

        {/* 反馈文本 */}
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm">{score.feedback}</p>
        </div>

        {/* 发音错误 */}
        {score.mistakes && score.mistakes.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">需要注意的发音：</p>
            {score.mistakes.map((mistake, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                <span className="text-sm">
                  <strong>{mistake.word}</strong> → {mistake.actual}
                </span>
                <span className="text-xs text-muted-foreground">
                  {mistake.suggestion}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRetry} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            重试
          </Button>
          {showNext ? (
            onNext ? (
              <Button onClick={onNext} className="flex-1">
                {nextLabel}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={onComplete} className="flex-1">
                完成练习
              </Button>
            )
          ) : (
            <Button onClick={onComplete} className="flex-1">
              完成练习
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}