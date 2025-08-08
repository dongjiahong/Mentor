import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SpeakingResultsProps {
  title: string;
  description?: string;
  overallScore: number;
  completedItems: number;
  totalItems: number;
}

export function SpeakingResults({
  title,
  description,
  overallScore,
  completedItems,
  totalItems
}: SpeakingResultsProps) {
  return (
    <>
      {/* 头部信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {overallScore}
              </div>
              <div className="text-sm text-muted-foreground">平均得分</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>练习进度</span>
          <span>{completedItems} / {totalItems}</span>
        </div>
        <Progress 
          value={totalItems > 0 ? (completedItems / totalItems) * 100 : 0}
          className="w-full"
        />
      </div>
    </>
  );
}