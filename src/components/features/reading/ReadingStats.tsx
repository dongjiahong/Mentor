import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Timer, Target, Zap } from 'lucide-react';
import { ReadingPracticeContent } from '@/types';

interface ReadingStatsProps {
  content: ReadingPracticeContent;
  speedLevel: { level: string; color: string };
  className?: string;
}

export function ReadingStats({
  content,
  speedLevel,
  className
}: ReadingStatsProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-2 ${className}`}>
      <Card>
        <CardContent className="p-2 text-center">
          <BookOpen className="h-4 w-4 mx-auto mb-1 text-blue-600" />
          <div className="text-lg font-bold">{content.wordCount}</div>
          <div className="text-xs text-muted-foreground">单词数</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-2 text-center">
          <Timer className="h-4 w-4 mx-auto mb-1 text-green-600" />
          <div className="text-lg font-bold">{content.estimatedDuration}</div>
          <div className="text-xs text-muted-foreground">预估分钟</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-2 text-center">
          <Target className="h-4 w-4 mx-auto mb-1 text-purple-600" />
          <div className="text-lg font-bold">{content.difficulty}/5</div>
          <div className="text-xs text-muted-foreground">难度等级</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-2 text-center">
          <Zap className="h-4 w-4 mx-auto mb-1 text-orange-600" />
          <div className="text-lg font-bold">{speedLevel.level}</div>
          <div className="text-xs text-muted-foreground">阅读速度</div>
        </CardContent>
      </Card>
    </div>
  );
}