import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  Eye,
  EyeOff,
  Target,
  Clock,
  Award,
  Lightbulb,
  CheckCircle,
  BookOpen
} from 'lucide-react';
import { WritingPracticeContent } from '@/types';

interface WritingPromptSectionProps {
  content: WritingPracticeContent;
  onUseTemplate?: (template: string) => void;
}

export function WritingPromptSection({ content, onUseTemplate }: WritingPromptSectionProps) {
  const [showPrompt, setShowPrompt] = useState(true);
  const [showSample, setShowSample] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            写作要求
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrompt(!showPrompt)}
          >
            {showPrompt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="ml-2">{showPrompt ? '隐藏' : '显示'}</span>
          </Button>
        </div>
      </CardHeader>
      {showPrompt && (
        <CardContent className="space-y-4">
          {/* 写作提示 */}
          <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-l-primary">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {content.prompt}
            </p>
          </div>

          {/* 基本要求 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {content.wordLimit && (
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span>字数要求: {content.wordLimit} 词</span>
              </div>
            )}
            {content.timeLimit && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span>时间限制: {content.timeLimit} 分钟</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-600" />
              <span>预计用时: {content.estimatedDuration} 分钟</span>
            </div>
          </div>

          {/* 关键词提示 */}
          {content.keywords && content.keywords.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">建议使用的关键词:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {content.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 写作模板 */}
          {content.templates && content.templates.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">💡 写作模板参考:</div>
              <div className="space-y-2">
                {content.templates.map((template, index) => (
                  <div key={index} className="p-3 bg-muted rounded text-sm">
                    <pre className="whitespace-pre-wrap font-mono text-xs">
                      {template}
                    </pre>
                    {onUseTemplate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-6 text-xs"
                        onClick={() => onUseTemplate(template)}
                      >
                        使用此模板
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 评价标准 */}
          {content.evaluationCriteria && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">评价标准:</span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-800">
                  {(() => {
                    try {
                      const criteria = JSON.parse(content.evaluationCriteria);
                      return (
                        <div className="grid gap-3">
                          {Object.entries(criteria).map(([key, value]: [string, unknown], index: number) => (
                            <div key={`writing-criteria-${key}-${index}`} className="flex flex-col">
                              <div className="font-medium text-blue-900 mb-1">{key}:</div>
                              <div className="text-blue-700 pl-3 border-l-2 border-blue-300">{String(value)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    } catch {
                      return <div className="whitespace-pre-line">{content.evaluationCriteria}</div>;
                    }
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* 写作大纲建议 */}
          {content.sampleOutline && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">写作大纲建议:</span>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-800">
                  {(() => {
                    try {
                      const outlineObj = JSON.parse(content.sampleOutline);
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
                      return (
                        <div className="text-green-700 whitespace-pre-line">
                          {content.sampleOutline}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* 参考答案 */}
          {content.sampleAnswer && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">📝 参考答案:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSample(!showSample)}
                >
                  {showSample ? '隐藏' : '查看'}参考答案
                </Button>
              </div>
              {showSample && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {content.sampleAnswer}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}