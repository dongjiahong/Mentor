import { ContentDisplay } from './ContentDisplay';
import { LearningContent } from '@/types';

// 演示用的学习内容
const demoContent: LearningContent = {
  id: 1,
  contentType: 'article',
  originalText: `The Power of Reading

Reading is one of the most powerful tools for personal growth and learning. When we read, we open our minds to new ideas, perspectives, and knowledge that can transform our understanding of the world.

Books have the unique ability to transport us to different places and times. Through reading, we can experience adventures, learn from history, and explore complex emotions and relationships.

Moreover, reading improves our vocabulary, enhances our critical thinking skills, and helps us become better communicators. It's a skill that benefits us throughout our entire lives.`,
  translation: `阅读的力量

阅读是个人成长和学习最强大的工具之一。当我们阅读时，我们向新的想法、观点和知识敞开心扉，这些可以改变我们对世界的理解。

书籍具有将我们带到不同地方和时代的独特能力。通过阅读，我们可以体验冒险，从历史中学习，探索复杂的情感和关系。

此外，阅读提高我们的词汇量，增强我们的批判性思维技能，并帮助我们成为更好的沟通者。这是一项让我们终生受益的技能。`,
  difficultyLevel: 'B2',
  topic: '教育文章',
  createdAt: new Date()
};

export function ContentDisplayDemo() {
  const handleWordClick = (word: string) => {
    console.log('查询单词:', word);
  };

  const handleSentencePlay = (sentence: string) => {
    console.log('播放句子:', sentence);
    // 使用浏览器内置TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleFullTextPlay = () => {
    console.log('播放全文:', demoContent.originalText);
    // 使用浏览器内置TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(demoContent.originalText);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">内容展示组件演示</h1>
      <ContentDisplay
        content={demoContent}
        onWordClick={handleWordClick}
        onSentencePlay={handleSentencePlay}
        onFullTextPlay={handleFullTextPlay}
      />
      
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h2 className="text-lg font-semibold mb-2">功能说明</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• 点击英文单词可以查询释义（会显示弹窗）</li>
          <li>• 鼠标悬停在句子上会显示播放按钮</li>
          <li>• 点击播放按钮可以播放单个句子</li>
          <li>• 点击"播放全文"可以播放整篇文章</li>
          <li>• 点击"显示翻译"可以切换中文翻译的显示</li>
          <li>• 支持响应式设计，在移动端也能良好显示</li>
        </ul>
      </div>
    </div>
  );
}