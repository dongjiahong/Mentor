import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Target, RotateCcw, Lightbulb } from 'lucide-react';
import { WritingScore, WritingPracticeContent, DEFAULT_WRITING_RUBRIC } from '@/types';

interface WritingScoreSectionProps {
  score: WritingScore;
  content: WritingPracticeContent;
  onRestart: () => void;
  onComplete: () => void;
}

export function WritingScoreSection({
  score,
  content,
  onRestart,
  onComplete
}: WritingScoreSectionProps) {
  const percentage = Math.round((score.totalScore / score.maxScore) * 100);

  return (
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
            {score.totalScore} / {score.maxScore}
          </div>
          <div className="text-lg text-muted-foreground mb-4">
            {percentage}%
          </div>
          <p className="text-base leading-relaxed">
            {score.overallFeedback}
          </p>
        </div>

        <Separator />

        {/* 分项评分 */}
        <div>
          <h4 className="font-medium mb-4">详细评分:</h4>
          <div className="space-y-3">
            {score.criteriaScores.map((cs, index) => {
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
            {score.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRestart} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            重新写作
          </Button>
          <Button onClick={onComplete} className="flex-1">
            完成练习
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}