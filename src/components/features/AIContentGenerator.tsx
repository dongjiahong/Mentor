import { useState } from 'react';
import { Bot, Sparkles, Loader2, FileText, MessageSquare, Layers, AlertCircle, BookOpen, Headphones, Mic, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { FormField } from '@/components/ui/form-field';
import { SelectWithOptions } from '@/components/ui/select-with-options';
import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { 
  EnglishLevel,
  LearningGoal,
  ContentType,
  LearningContent,
  ENGLISH_LEVEL_DESCRIPTIONS,
  LEARNING_GOAL_DESCRIPTIONS
} from '@/types';

interface ContentGenerationForm {
  level: EnglishLevel;
  goal: LearningGoal;
  type: ContentType;
  topic: string;
  wordCount: number;
}

interface AIContentGeneratorProps {
  onContentGenerated?: (content: LearningContent) => void;
  className?: string;
}

export function AIContentGenerator({ onContentGenerated, className }: AIContentGeneratorProps) {
  const [formData, setFormData] = useState<ContentGenerationForm>({
    level: 'B1',
    goal: 'daily_conversation',
    type: 'article',
    topic: '',
    wordCount: 200
  });

  const [generatedContent, setGeneratedContent] = useState<LearningContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 英语水平选项
  const levelOptions = Object.entries(ENGLISH_LEVEL_DESCRIPTIONS).map(([value, label]) => ({
    value: value as EnglishLevel,
    label: `${value} - ${label}`
  }));

  // 学习目标选项
  const goalOptions = Object.entries(LEARNING_GOAL_DESCRIPTIONS).map(([value, label]) => ({
    value: value as LearningGoal,
    label
  }));

  // 内容类型选项
  const typeOptions = [
    { value: 'article' as ContentType, label: '文章', icon: <FileText className="h-4 w-4" /> },
    { value: 'dialogue' as ContentType, label: '对话', icon: <MessageSquare className="h-4 w-4" /> },
    { value: 'mixed' as ContentType, label: '混合内容', icon: <Layers className="h-4 w-4" /> }
  ];

  const updateFormData = (updates: Partial<ContentGenerationForm>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setError(null);
  };

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      setError('请输入学习主题');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          level: formData.level,
          goal: formData.goal,
          type: formData.type,
          topic: formData.topic,
          wordCount: formData.wordCount,
          saveToDatabase: true
        })
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedContent(result.data);
        onContentGenerated?.(result.data);
        
        // 清除表单以便生成新内容
        setFormData(prev => ({ ...prev, topic: '' }));
      } else {
        setError(result.error || '生成内容失败');
      }
    } catch (error) {
      console.error('生成内容失败:', error);
      setError(error instanceof Error ? error.message : '网络错误，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = formData.topic.trim().length > 0 && !isGenerating;

  return (
    <div className={className}>
      {/* 生成器面板 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-primary" />
            <span>AI 智能内容生成器</span>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* 错误提示 */}
          {error && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 英语水平 */}
            <FormField label="英语水平" required>
              <SelectWithOptions
                options={levelOptions}
                value={formData.level}
                onChange={(value) => updateFormData({ level: value as EnglishLevel })}
                placeholder="选择英语水平"
              />
            </FormField>

            {/* 学习目标 */}
            <FormField label="学习目标" required>
              <SelectWithOptions
                options={goalOptions}
                value={formData.goal}
                onChange={(value) => updateFormData({ goal: value as LearningGoal })}
                placeholder="选择学习目标"
              />
            </FormField>
          </div>

          {/* 内容类型选择 */}
          <FormField label="内容类型" required>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={formData.type === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateFormData({ type: option.value })}
                  className="flex items-center space-x-2 h-12"
                >
                  {option.icon}
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
          </FormField>

          {/* 主题输入 */}
          <FormField label="学习主题" required>
            <Input
              placeholder="例如：环境保护、科技发展、健康生活..."
              value={formData.topic}
              onChange={(e) => updateFormData({ topic: e.target.value })}
              disabled={isGenerating}
            />
          </FormField>

          {/* 字数控制 */}
          <FormField label="目标字数">
            <div className="flex items-center space-x-4">
              <Input
                type="number"
                min="50"
                max="1000"
                value={formData.wordCount}
                onChange={(e) => updateFormData({ wordCount: parseInt(e.target.value) || 200 })}
                disabled={isGenerating}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                建议范围：{formData.type === 'dialogue' ? '150-300' : '200-500'} 字
              </span>
            </div>
          </FormField>

          {/* 生成按钮 */}
          <div className="flex justify-center pt-4">
            <LoadingButton
              onClick={handleGenerate}
              loading={isGenerating}
              disabled={!canGenerate}
              size="lg"
              className="min-w-[200px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI 正在生成内容...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成学习内容
                </>
              )}
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      {/* 生成结果展示 */}
      {generatedContent && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>生成的学习内容</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({generatedContent.wordCount} 词 · {generatedContent.estimatedReadingTime} 分钟)
              </span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* 内容标题 */}
            {generatedContent.title && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">标题</h4>
                <h3 className="text-lg font-semibold text-foreground mb-2">{generatedContent.title}</h3>
              </div>
            )}
            
            {/* 内容主题 */}
            {generatedContent.topic && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">主题</h4>
                <p className="text-sm bg-muted px-3 py-1 rounded">{generatedContent.topic}</p>
              </div>
            )}

            {/* 英文原文 */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">英文原文</h4>
              <div className="bg-background border rounded-lg p-4 max-h-60 overflow-y-auto">
                <p className="whitespace-pre-line leading-relaxed">
                  {generatedContent.originalText}
                </p>
              </div>
            </div>

            {/* 中文翻译 */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">中文翻译</h4>
              <div className="bg-muted/50 border rounded-lg p-4 max-h-60 overflow-y-auto">
                <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                  {generatedContent.translation}
                </p>
              </div>
            </div>

            {/* 练习类型按钮 */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">练习类型</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 h-12"
                  onClick={() => {
                    // TODO: 开启阅读练习
                    console.log('开始阅读练习');
                  }}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>阅读</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 h-12"
                  onClick={() => {
                    // TODO: 开启听力练习
                    console.log('开始听力练习');
                  }}
                >
                  <Headphones className="h-4 w-4" />
                  <span>听力</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 h-12"
                  onClick={() => {
                    // TODO: 开启口语练习
                    console.log('开始口语练习');
                  }}
                >
                  <Mic className="h-4 w-4" />
                  <span>口语</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 h-12"
                  onClick={() => {
                    // TODO: 开启写作练习
                    console.log('开始写作练习');
                  }}
                >
                  <Edit3 className="h-4 w-4" />
                  <span>写作</span>
                </Button>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setGeneratedContent(null)}
              >
                关闭
              </Button>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedContent.originalText);
                  }}
                >
                  复制原文
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify({
                      title: generatedContent.title,
                      originalText: generatedContent.originalText,
                      translation: generatedContent.translation
                    }, null, 2));
                  }}
                >
                  复制全部
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}