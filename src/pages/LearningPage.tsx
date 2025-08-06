import { useCallback } from 'react';
import { ContentDisplay } from '@/components/features';
import { LearningContent } from '@/types';

// 模拟学习内容数据 - 只保留文章内容
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
  const handleWordClick = useCallback((word: string) => {
    console.log('查询单词:', word);
    // 这里应该调用词典服务
  }, []);

  const handleSentencePlay = useCallback((sentence: string) => {
    console.log('播放句子:', sentence);
    // TTS功能现在由PlayButton组件处理
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <ContentDisplay
          content={mockArticleContent}
          onWordClick={handleWordClick}
          onSentencePlay={handleSentencePlay}
        />
      </div>
    </div>
  );
}