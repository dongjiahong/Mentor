import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PenTool, Save, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WritingPracticeContent } from '@/types';
import { WritingState } from '@/hooks/useWritingSession';
import { 
  getWordCountColor, 
  getWritingProgress, 
  getStatusText, 
  formatTime 
} from '@/lib/writingUtils';

interface WritingEditorProps {
  content: WritingPracticeContent;
  writingState: WritingState;
  onContentChange: (content: string) => void;
  onSaveDraft: () => void;
  onSubmit: () => void;
}

export function WritingEditor({
  content,
  writingState,
  onContentChange,
  onSaveDraft,
  onSubmit
}: WritingEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCountColor = getWordCountColor(writingState.wordCount, content.wordLimit);
  const progress = getWritingProgress(writingState.wordCount, content.wordLimit);
  const statusText = getStatusText(writingState.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            写作区域
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className={cn("text-sm font-mono", wordCountColor)}>
              {writingState.wordCount}
              {content.wordLimit && ` / ${content.wordLimit}`} 词
            </div>
            <Badge variant="outline">
              {statusText}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {writingState.status === 'draft' ? (
          <div className="space-y-4">
            {/* 写作区域 */}
            <Textarea
              ref={textareaRef}
              placeholder="请在这里开始你的写作..."
              value={writingState.currentContent}
              onChange={(e) => onContentChange(e.target.value)}
              className="min-h-[400px] text-base leading-relaxed"
              disabled={writingState.status !== 'draft'}
            />
            
            {/* 进度指示器 */}
            {content.wordLimit && (
              <div className="space-y-2">
                <Progress 
                  value={progress}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>字数进度</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onSaveDraft}
                disabled={!writingState.currentContent.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                保存草稿
              </Button>
              <Button
                onClick={onSubmit}
                disabled={!writingState.currentContent.trim()}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                提交作文
              </Button>
            </div>

            {/* 写作提示 */}
            <div className="text-xs text-muted-foreground">
              💡 提示: 作文将自动保存草稿。建议写作完成后仔细检查语法和拼写。
            </div>
          </div>
        ) : (
          /* 已提交的作文显示（只读） */
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">提交的作文:</div>
              <div className="whitespace-pre-wrap text-base leading-relaxed">
                {writingState.currentContent}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>字数: {writingState.wordCount}</span>
              <span>用时: {formatTime(writingState.timeSpent)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}