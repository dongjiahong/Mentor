'use client'

import { useState } from 'react'
import { Bot, History, RefreshCw } from 'lucide-react'
import { AIContentGenerator } from '@/components/features/AIContentGenerator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LearningContent } from '@/types'

export default function AIGeneratorPage() {
  const [recentContent, setRecentContent] = useState<LearningContent[]>([])

  const handleContentGenerated = (content: LearningContent) => {
    setRecentContent(prev => [content, ...prev.slice(0, 4)]) // 保持最近5个
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-3">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI 智能内容生成</h1>
          <p className="text-muted-foreground">
            使用 AI 技术根据您的英语水平和学习目标生成个性化学习内容
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要生成器区域 */}
        <div className="lg:col-span-2">
          <AIContentGenerator onContentGenerated={handleContentGenerated} />
        </div>

        {/* 侧边栏 - 最近生成的内容 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <History className="h-4 w-4" />
                <span>最近生成</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentContent.length > 0 ? (
                <div className="space-y-3">
                  {recentContent.map((content, index) => (
                    <div
                      key={content.id || index}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                          {content.contentType === 'article' ? '文章' : 
                           content.contentType === 'dialogue' ? '对话' : '混合'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {content.difficultyLevel}
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-sm mb-1 line-clamp-1">
                        {content.topic || '无主题'}
                      </h4>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {content.originalText.substring(0, 80)}...
                      </p>
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{content.wordCount} 词</span>
                        <span>{content.estimatedReadingTime} 分钟</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">还没有生成内容</p>
                  <p className="text-xs">开始使用 AI 生成器创建学习材料吧！</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 使用提示 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">💡 使用提示</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div>
                <strong>1. 选择合适的水平:</strong> 选择符合您实际英语水平的等级，AI 会据此调整词汇和语法难度。
              </div>
              <div>
                <strong>2. 明确学习目标:</strong> 不同目标会影响内容的风格和词汇选择。
              </div>
              <div>
                <strong>3. 具体的主题:</strong> 提供具体而清晰的主题，如&ldquo;可持续能源的发展&rdquo;比&ldquo;能源&rdquo;更好。
              </div>
              <div>
                <strong>4. 合理的字数:</strong> 建议字数范围内的内容质量更高。
              </div>
            </CardContent>
          </Card>

          {/* 快捷操作 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">🚀 快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/settings'}
              >
                <Bot className="h-4 w-4 mr-2" />
                配置 AI 参数
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/learning-content'}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                查看所有内容
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}