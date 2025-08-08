import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WritingPracticeContent, WRITING_PRACTICE_TYPE_DESCRIPTIONS } from '@/types';
import { useWritingSession } from '@/hooks/useWritingSession';
import { WritingPromptSection } from './writing/WritingPromptSection';
import { WritingEditor } from './writing/WritingEditor';
import { WritingScoreSection } from './writing/WritingScoreSection';
import { formatTime } from '@/lib/writingUtils';

interface WritingPracticePanelProps {
  content: WritingPracticeContent;
  onBack: () => void;
  onComplete: () => void;
  className?: string;
}


export function WritingPracticePanel({
  content,
  onBack,
  onComplete,
  className
}: WritingPracticePanelProps) {
  const {
    writingState,
    updateContent,
    submitWriting,
    restartWriting,
    saveDraft
  } = useWritingSession(content);

  // 处理模板使用
  const handleUseTemplate = (template: string) => {
    updateContent(template);
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

      {/* 写作要求组件 */}
      <WritingPromptSection 
        content={content} 
        onUseTemplate={handleUseTemplate}
      />

      {/* 写作编辑器组件 */}
      <WritingEditor
        content={content}
        writingState={writingState}
        onContentChange={updateContent}
        onSaveDraft={saveDraft}
        onSubmit={submitWriting}
      />

      {/* 评分结果组件 */}
      {writingState.status === 'graded' && writingState.score && (
        <WritingScoreSection
          score={writingState.score}
          content={content}
          onRestart={restartWriting}
          onComplete={onComplete}
        />
      )}
    </div>
  );
}