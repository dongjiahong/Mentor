import { useState } from 'react';
import { Bot, Sparkles, Edit3, Clock, Target, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { FormField } from '@/components/ui/form-field';
import { SelectWithOptions } from '@/components/ui/select-with-options';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { 
  EnglishLevel,
  ENGLISH_LEVEL_DESCRIPTIONS,
  WRITING_TYPE_DESCRIPTIONS
} from '@/types';
import { WritingPromptItem } from '@/services/practice/writing/WritingPromptsService';

interface WritingGenerationForm {
  level: EnglishLevel;
  writingType: 'essay' | 'letter' | 'report' | 'story' | 'description' | 'argument';
  topic: string;
  wordCountRequirement?: string;
  timeLimit?: number;
}

interface AIWritingGeneratorProps {
  onPromptGenerated?: (prompt: WritingPromptItem) => void;
  className?: string;
}

export function AIWritingGenerator({ onPromptGenerated, className }: AIWritingGeneratorProps) {
  const [formData, setFormData] = useState<WritingGenerationForm>({
    level: 'B1',
    writingType: 'essay',
    topic: '',
    wordCountRequirement: '',
    timeLimit: undefined
  });

  const [generatedPrompt, setGeneratedPrompt] = useState<WritingPromptItem | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // 英语水平选项
  const levelOptions = Object.entries(ENGLISH_LEVEL_DESCRIPTIONS).map(([value, label]) => ({
    value: value as EnglishLevel,
    label: `${value} - ${label}`
  }));

  // 写作类型选项
  const writingTypeOptions = Object.entries(WRITING_TYPE_DESCRIPTIONS).map(([value, label]) => ({
    value: value as 'essay' | 'letter' | 'report' | 'story' | 'description' | 'argument',
    label: `${label} (${value})`
  }));

  const updateFormData = (updates: Partial<WritingGenerationForm>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setError(null);
  };

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      setError('请输入写作主题');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-writing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          level: formData.level,
          writingType: formData.writingType,
          topic: formData.topic,
          wordCountRequirement: formData.wordCountRequirement,
          timeLimit: formData.timeLimit,
          saveToDatabase: true
        })
      });

      const result = await response.json();

      if (result.success) {
        setGeneratedPrompt(result.data);
        
        // 直接在这里调用回调，但使用setTimeout避免同步更新
        if (onPromptGenerated) {
          setTimeout(() => onPromptGenerated(result.data), 0);
        }
        
        // 清除表单以便生成新内容
        setFormData(prev => ({ ...prev, topic: '' }));
      } else {
        setError(result.error || '生成写作提示失败');
      }
    } catch (error) {
      console.error('生成写作提示失败:', error);
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
            <span>AI 写作提示生成器</span>
            <Edit3 className="h-4 w-4 text-blue-500" />
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

            {/* 写作类型 */}
            <FormField label="写作类型" required>
              <SelectWithOptions
                options={writingTypeOptions}
                value={formData.writingType}
                onChange={(value) => updateFormData({ 
                  writingType: value as 'essay' | 'letter' | 'report' | 'story' | 'description' | 'argument' 
                })}
                placeholder="选择写作类型"
              />
            </FormField>
          </div>

          {/* 主题输入 */}
          <FormField label="写作主题" required>
            <Input
              placeholder="例如：环境保护、科技发展、个人成长..."
              value={formData.topic}
              onChange={(e) => updateFormData({ topic: e.target.value })}
              disabled={isGenerating}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 字数要求 */}
            <FormField label="字数要求" optional>
              <Input
                placeholder="例如：200-300词"
                value={formData.wordCountRequirement}
                onChange={(e) => updateFormData({ wordCountRequirement: e.target.value })}
                disabled={isGenerating}
              />
            </FormField>

            {/* 时间限制 */}
            <FormField label="时间限制（分钟）" optional>
              <Input
                type="number"
                min="15"
                max="120"
                placeholder="40"
                value={formData.timeLimit || ''}
                onChange={(e) => updateFormData({ 
                  timeLimit: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                disabled={isGenerating}
              />
            </FormField>
          </div>

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
                  AI 正在生成提示...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成写作提示
                </>
              )}
            </LoadingButton>
          </div>
        </CardContent>
      </Card>

      {/* 生成结果展示 */}
      {generatedPrompt && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Edit3 className="h-5 w-5 text-primary" />
              <span>生成的写作提示</span>
              <div className="flex items-center space-x-2 text-sm font-normal text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>{generatedPrompt.word_count_requirement}</span>
                <Clock className="h-4 w-4" />
                <span>{generatedPrompt.time_limit}分钟</span>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* 标题 */}
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {generatedPrompt.title}
              </h3>
            </div>

            {/* 写作提示 */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">写作提示</h4>
              <div className="bg-background border rounded-lg p-4">
                <p className="whitespace-pre-line leading-relaxed">
                  {generatedPrompt.prompt_text}
                </p>
              </div>
            </div>

            {/* 评价标准 */}
            {generatedPrompt.evaluation_criteria && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">评价标准</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-800">
                    {(() => {
                      try {
                        const criteria = JSON.parse(generatedPrompt.evaluation_criteria);
                        return (
                          <div className="grid gap-3">
                            {Object.entries(criteria).map(([key, value]: [string, unknown], index: number) => (
                              <div key={`criteria-${key}-${index}`} className="flex flex-col">
                                <div className="font-medium text-blue-900 mb-1">{key}:</div>
                                <div className="text-blue-700 pl-3 border-l-2 border-blue-300">{String(value)}</div>
                              </div>
                            ))}
                          </div>
                        );
                      } catch {
                        return <div className="whitespace-pre-line">{generatedPrompt.evaluation_criteria}</div>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* 写作大纲 */}
            {generatedPrompt.sample_outline && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">写作大纲建议</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-800">
                    {(() => {
                      try {
                        const outlineObj = JSON.parse(generatedPrompt.sample_outline);
                        return (
                          <div className="space-y-4">
                            {Object.entries(outlineObj).map(([section, content], index) => (
                              <div key={`outline-section-${section}`} className="border-l-3 border-green-400 pl-4 py-2">
                                <div className="font-semibold text-green-900 mb-2 flex items-center">
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-3">
                                    {index + 1}
                                  </span>
                                  {section}
                                </div>
                                <div className="text-green-700 ml-7 text-sm leading-relaxed">
                                  {String(content)}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      } catch (error) {
                        // 兜底显示，虽然现在应该都是对象格式了
                        return (
                          <div className="text-green-700 whitespace-pre-line">
                            {generatedPrompt.sample_outline}
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setGeneratedPrompt(null)}
              >
                关闭
              </Button>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // 跳转到写作练习页面
                    const params = new URLSearchParams({
                      module: 'writing',
                      contentId: generatedPrompt.id.toString()
                    });
                    window.location.href = `/integrated-learning?${params.toString()}`;
                  }}
                >
                  开始写作
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPrompt.prompt_text);
                  }}
                >
                  复制提示
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}