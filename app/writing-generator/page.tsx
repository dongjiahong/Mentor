'use client'

import { useState } from 'react'
import { Bot, History } from 'lucide-react'
import { AIWritingGenerator } from '@/components/features/AIWritingGenerator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WritingPromptItem } from '@/services/practice'

export default function WritingGeneratorPage() {
  const [recentPrompts, setRecentPrompts] = useState<WritingPromptItem[]>([])

  const handlePromptGenerated = (prompt: WritingPromptItem) => {
    setRecentPrompts(prev => [prompt, ...prev.slice(0, 4)]) // 保持最近5个
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-3">
        <Bot className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI 写作题目生成器</h1>
          <p className="text-muted-foreground">
            使用 AI 技术根据您的英语水平和写作需求生成个性化写作题目
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主要生成器区域 */}
        <div className="lg:col-span-2">
          <AIWritingGenerator onPromptGenerated={handlePromptGenerated} />
        </div>

        {/* 侧边栏 - 最近生成的题目 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-base">
                <History className="h-4 w-4" />
                <span>最近生成</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPrompts.length > 0 ? (
                <div className="space-y-3">
                  {recentPrompts.map((prompt, index) => (
                    <div
                      key={prompt.id || index}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {prompt.writing_type || prompt.writingType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {prompt.level || prompt.difficulty_level}
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-sm mb-1 line-clamp-1">
                        {prompt.topic}
                      </h4>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {(prompt.prompt_text || prompt.prompt || '').substring(0, 80)}...
                      </p>
                      
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>{prompt.word_count_requirement || prompt.wordCountRequirement || '自由发挥'}</span>
                        <span>{prompt.time_limit || prompt.timeLimit || 30} 分钟</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">还没有生成题目</p>
                  <p className="text-xs">开始使用 AI 生成器创建写作题目吧！</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}