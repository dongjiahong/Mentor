import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReadingPracticeContent } from '@/types';

interface ReadingHeaderProps {
  content: ReadingPracticeContent;
  readingTime: number;
  readingSpeed: number;
  speedLevel: { level: string; color: string };
  formatTime: (seconds: number) => string;
  onBack: () => void;
  className?: string;
}

export function ReadingHeader({
  content,
  readingTime,
  readingSpeed,
  speedLevel,
  formatTime,
  onBack,
  className
}: ReadingHeaderProps) {
  return (
    <>
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      {/* 头部信息 */}
      <Card className={className}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{content.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{content.description}</p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="text-lg font-semibold">{formatTime(readingTime)}</div>
                <div className="text-sm text-muted-foreground">阅读时间</div>
              </div>
              {readingSpeed > 0 && (
                <div>
                  <div className={cn("text-lg font-semibold", speedLevel.color)}>
                    {Math.round(readingSpeed)}
                  </div>
                  <div className="text-sm text-muted-foreground">字/分钟</div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    </>
  );
}