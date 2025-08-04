/**
 * AI服务演示脚本
 * 展示AI服务的基本功能
 */

import { AIService } from './AIService';
import { AIConfig } from '@/types';

// 使用.env.local中的配置
const demoConfig: AIConfig = {
  id: 1,
  apiUrl: 'https://api-inference.modelscope.cn/v1/',
  apiKey: 'ms-b73a047d-0609-4ab7-8040-3e6ebd633839',
  modelName: 'Qwen/Qwen3-235B-A22B-Instruct-2507',
  temperature: 0.7,
  maxTokens: 1000,
  createdAt: new Date(),
  updatedAt: new Date()
};

async function demoAIService() {
  console.log('🤖 AI服务演示开始...\n');

  const aiService = new AIService(demoConfig);

  try {
    // 1. 配置验证
    console.log('1️⃣ 验证AI配置...');
    const isValid = await aiService.validateConfig(demoConfig);
    console.log(`配置验证结果: ${isValid ? '✅ 有效' : '❌ 无效'}\n`);

    if (!isValid) {
      console.log('❌ 配置无效，停止演示');
      return;
    }

    // 2. 生成学习内容
    console.log('2️⃣ 生成学习内容...');
    const content = await aiService.generateContent({
      level: 'A2',
      goal: 'daily_conversation',
      type: 'dialogue',
      topic: '在咖啡店点餐',
      wordCount: 150
    });

    console.log('📝 生成的对话内容:');
    console.log('原文:', content.originalText.substring(0, 200) + '...');
    console.log('翻译:', content.translation.substring(0, 200) + '...');
    console.log('主题:', content.topic);
    console.log('单词数:', content.wordCount);
    console.log('预估阅读时间:', content.estimatedReadingTime, '分钟\n');

    // 3. 生成考试题目
    console.log('3️⃣ 生成考试题目...');
    const questions = await aiService.generateExamQuestions({
      level: 'A2',
      examType: 'vocabulary',
      questionCount: 3
    });

    console.log('📋 生成的考试题目:');
    questions.forEach((q, index) => {
      console.log(`题目 ${index + 1}:`);
      console.log(`  问题: ${q.question}`);
      console.log(`  正确答案: ${q.correctAnswer}`);
      if (q.options) {
        console.log(`  选项: ${q.options.join(', ')}`);
      }
      console.log();
    });

    // 4. 发音评估
    console.log('4️⃣ 发音评估...');
    const score = await aiService.evaluatePronunciation({
      originalText: 'Good morning, how are you today?',
      spokenText: 'Good morning, how are you today?'
    });

    console.log('🎯 发音评估结果:');
    console.log(`总体分数: ${score.overallScore}/100`);
    console.log(`准确度: ${score.accuracyScore}/100`);
    console.log(`流利度: ${score.fluencyScore}/100`);
    console.log(`发音质量: ${score.pronunciationScore}/100`);
    console.log(`反馈: ${score.feedback.substring(0, 100)}...`);

    if (score.mistakes && score.mistakes.length > 0) {
      console.log('发音错误:');
      score.mistakes.forEach((mistake, index) => {
        console.log(`  ${index + 1}. ${mistake.word}: ${mistake.suggestion}`);
      });
    }

    console.log('\n✅ AI服务演示完成！');

  } catch (error) {
    console.error('❌ 演示过程中发生错误:', error);
  }
}

// 如果直接运行此文件，则执行演示
if (require.main === module) {
  demoAIService().catch(console.error);
}

export { demoAIService };