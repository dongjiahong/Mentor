import { useState, useCallback } from 'react';
import { BookOpen, Play, Mic, Volume2 } from 'lucide-react';
import { ContentDisplay } from '@/components/features';
import { Button } from '@/components/ui/button';
import { LearningContent, ContentType } from '@/types';

// 模拟学习内容数据
const mockDialogueContent: LearningContent = {
  id: 1,
  contentType: 'dialogue',
  originalText: `A: Good morning! How are you today?
B: Good morning! I'm doing well, thank you. How about you?
A: I'm great, thanks for asking. Are you ready for the meeting?
B: Yes, I've prepared all the documents we need. Did you review the proposal?
A: I did. I think it looks good, but we might need to adjust the timeline.
B: That makes sense. We can discuss it during the meeting.`,
  translation: `A: 早上好！你今天怎么样？
B: 早上好！我很好，谢谢。你呢？
A: 我很好，谢谢你的关心。你准备好开会了吗？
B: 是的，我已经准备好了我们需要的所有文件。你看过提案了吗？
A: 看过了。我觉得看起来不错，但我们可能需要调整时间表。
B: 有道理。我们可以在会议期间讨论。`,
  difficultyLevel: 'B1',
  topic: '商务对话',
  createdAt: new Date()
};

const mockArticleContent: LearningContent = {
  id: 2,
  contentType: 'article',
  originalText: `The Benefits of Reading Books

Reading books is one of the most rewarding activities you can engage in. It not only provides entertainment but also offers numerous benefits for your mind and personal growth.

First, reading improves your vocabulary and language skills. When you encounter new words in context, you naturally learn their meanings and how to use them properly. This expanded vocabulary helps you communicate more effectively in both speaking and writing.

Second, reading enhances your critical thinking abilities. As you follow complex plots and analyze characters' motivations, you develop better analytical skills that can be applied to real-life situations.

Finally, reading reduces stress and improves mental health. Getting lost in a good book can help you forget about daily worries and provide a healthy escape from reality.`,
  translation: `阅读书籍的好处

阅读书籍是你可以参与的最有意义的活动之一。它不仅提供娱乐，还为你的思维和个人成长提供了许多好处。

首先，阅读提高你的词汇量和语言技能。当你在语境中遇到新单词时，你会自然地学会它们的含义以及如何正确使用它们。这种扩展的词汇量有助于你在口语和写作中更有效地交流。

其次，阅读增强你的批判性思维能力。当你跟随复杂的情节并分析角色的动机时，你会培养出更好的分析技能，这些技能可以应用到现实生活中。

最后，阅读减少压力并改善心理健康。沉浸在一本好书中可以帮助你忘记日常烦恼，并提供一个健康的现实逃避。`,
  difficultyLevel: 'B2',
  topic: '教育文章',
  createdAt: new Date()
};

export function LearningPage() {
  const [currentContent, setCurrentContent] = useState<LearningContent | null>(null);

  const handleStartLearning = useCallback((type: ContentType) => {
    const content = type === 'dialogue' ? mockDialogueContent : mockArticleContent;
    setCurrentContent(content);
  }, []);

  const handleWordClick = useCallback((word: string) => {
    console.log('查询单词:', word);
    // 这里应该调用词典服务
  }, []);

  const handleSentencePlay = useCallback((sentence: string) => {
    console.log('播放句子:', sentence);
    // TTS功能现在由PlayButton组件处理
  }, []);

  const handleBackToSelection = useCallback(() => {
    setCurrentContent(null);
  }, []);

  if (currentContent) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToSelection}
            className="mb-4"
          >
            ← 返回选择
          </Button>
          <ContentDisplay
            content={currentContent}
            onWordClick={handleWordClick}
            onSentencePlay={handleSentencePlay}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">开始学习</h1>
        <p className="text-muted-foreground">
          选择学习内容类型，开始您的英语学习之旅
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* 对话学习 */}
        <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-card-foreground">对话练习</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            通过AI生成的对话内容练习日常交流，提升口语表达能力
          </p>
          <Button
            onClick={() => handleStartLearning('dialogue')}
            className="w-full"
          >
            开始对话练习
          </Button>
        </div>

        {/* 文章阅读 */}
        <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-card-foreground">文章阅读</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            阅读适合您水平的文章，扩展词汇量和理解能力
          </p>
          <Button
            onClick={() => handleStartLearning('article')}
            className="w-full"
          >
            开始阅读练习
          </Button>
        </div>
      </div>

      {/* 功能介绍 */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">学习功能</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <Volume2 className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">TTS语音播放</span>
          </div>
          <div className="flex items-center space-x-3">
            <Mic className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">发音练习评估</span>
          </div>
          <div className="flex items-center space-x-3">
            <Play className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">智能单词本</span>
          </div>
        </div>
      </div>
    </div>
  );
}