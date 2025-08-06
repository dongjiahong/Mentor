import { 
  UniversalContent, 
  ContentSentence, 
  ContentDialogue,
  WritingPracticeContent,
  ListeningPracticeContent,
  ReadingPracticeContent,
  DEFAULT_WRITING_RUBRIC
} from '@/types';

// 文章类型示例内容
export const articleContents: UniversalContent[] = [
  {
    id: 'article_tech_life',
    title: '科技改变生活',
    description: '探讨现代科技如何改变我们的日常生活方式',
    contentType: 'article',
    level: 'B1',
    category: '科技话题',
    tags: ['科技', '生活', '现代化', '互联网'],
    originalText: `Technology has revolutionized the way we live, work, and communicate in the modern world. From smartphones that connect us instantly to anyone around the globe, to artificial intelligence that helps us make better decisions, technology has become an integral part of our daily lives.

Smart homes equipped with IoT devices allow us to control everything from temperature to security systems with just a voice command. Online shopping has made it possible to purchase almost anything from the comfort of our homes, while streaming services provide endless entertainment options.

However, this digital transformation also brings challenges. Privacy concerns, social media addiction, and the digital divide are issues that society must address as we continue to embrace technological advancement.

The future promises even more exciting developments, including autonomous vehicles, virtual reality experiences, and sustainable energy solutions. As we navigate this technological landscape, it's important to balance innovation with human values and ensure that technology serves to improve our quality of life.`,
    translation: `科技已经彻底改变了我们在现代世界中生活、工作和交流的方式。从能让我们与全球任何人即时连接的智能手机，到帮助我们做出更好决策的人工智能，科技已经成为我们日常生活不可或缺的一部分。

配备物联网设备的智能家居让我们能够仅通过语音指令控制从温度到安全系统的一切。网上购物使我们能够在家中舒适地购买几乎任何东西，而流媒体服务提供了无穷无尽的娱乐选择。

然而，这种数字化转型也带来了挑战。隐私担忧、社交媒体成瘾和数字鸿沟是社会在继续拥抱技术进步时必须解决的问题。

未来承诺着更多令人兴奋的发展，包括自动驾驶汽车、虚拟现实体验和可持续能源解决方案。当我们在这个技术环境中航行时，重要的是要平衡创新与人类价值观，确保技术服务于改善我们的生活质量。`,
    wordCount: 298,
    estimatedDuration: 8,
    sentences: [
      {
        id: 'sent_tech_1',
        text: 'Technology has revolutionized the way we live, work, and communicate in the modern world.',
        translation: '科技已经彻底改变了我们在现代世界中生活、工作和交流的方式。',
        difficulty: 3,
        phonetic: '/tekˈnɑːlədʒi hæz ˌrevəˈluːʃəˌnaɪzd ðə weɪ wi lɪv wɜːrk ænd kəˈmjuːnəˌkeɪt/',
        keywords: ['technology', 'revolutionized', 'communicate'],
        tips: '注意 "revolutionized" 的重音在第三个音节'
      },
      {
        id: 'sent_tech_2',
        text: 'Smart homes equipped with IoT devices allow us to control everything from temperature to security systems.',
        translation: '配备物联网设备的智能家居让我们能够控制从温度到安全系统的一切。',
        difficulty: 4,
        phonetic: '/smɑːrt hoʊmz ɪˈkwɪpt wɪθ aɪ oʊ tiː dɪˈvaɪsəz əˈlaʊ ʌs tu kənˈtroʊl/',
        keywords: ['equipped', 'IoT', 'devices', 'control'],
        tips: 'IoT是Internet of Things的缩写'
      }
    ],
    supportedModules: ['reading', 'listening', 'speaking', 'writing'],
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'article_env_protection',
    title: '环境保护的重要性',
    description: '了解环境保护对于可持续发展的重要意义',
    contentType: 'article',
    level: 'B2',
    category: '环境话题',
    tags: ['环保', '可持续发展', '气候变化', '绿色能源'],
    originalText: `Environmental protection has become one of the most critical issues of our time. Climate change, pollution, and the depletion of natural resources threaten the very foundation of life on Earth. Understanding the importance of environmental conservation is essential for creating a sustainable future.

The consequences of environmental degradation are already visible worldwide. Rising sea levels threaten coastal cities, extreme weather events are becoming more frequent, and biodiversity loss is accelerating. These changes not only affect wildlife but also impact human health, agriculture, and economic stability.

Fortunately, there are many ways individuals and communities can contribute to environmental protection. Reducing energy consumption, choosing sustainable transportation options, supporting renewable energy, and practicing the three R's - reduce, reuse, and recycle - are all effective strategies.

Governments and corporations also play crucial roles in environmental protection. Policy changes, investments in clean technology, and corporate responsibility initiatives can drive significant positive change. The transition to a green economy is not just an environmental necessity but also an economic opportunity.`,
    translation: `环境保护已成为我们这个时代最关键的问题之一。气候变化、污染和自然资源枯竭威胁着地球生命的根基。理解环境保护的重要性对于创造可持续的未来至关重要。

环境恶化的后果已经在全球范围内显现。海平面上升威胁着沿海城市，极端天气事件越来越频繁，生物多样性丧失正在加速。这些变化不仅影响野生动物，还影响人类健康、农业和经济稳定。

幸运的是，个人和社区有许多方式可以为环境保护做出贡献。减少能源消耗、选择可持续的交通选择、支持可再生能源，以及实践三个R - 减少、重复使用和回收 - 都是有效的策略。

政府和企业在环境保护中也发挥着关键作用。政策变化、清洁技术投资和企业责任倡议可以推动重大的积极变化。向绿色经济的转型不仅是环境必需品，也是经济机遇。`,
    wordCount: 267,
    estimatedDuration: 7,
    supportedModules: ['reading', 'listening', 'speaking', 'writing'],
    createdAt: new Date('2024-01-02')
  }
];

// 对话类型示例内容
export const dialogueContents: UniversalContent[] = [
  {
    id: 'dialogue_coffee_shop',
    title: '咖啡店点餐对话',
    description: '在咖啡店与服务员的完整点餐对话',
    contentType: 'dialogue',
    level: 'A2',
    category: '生活场景',
    tags: ['点餐', '咖啡', '服务', '日常对话'],
    estimatedDuration: 5,
    conversations: [
      {
        id: 'conv_coffee_1',
        speaker: 'system',
        speakerName: '服务员',
        text: 'Good morning! Welcome to Coffee Corner. What can I get for you today?',
        translation: '早上好！欢迎来到咖啡角。今天我能为您做些什么？',
        hints: ['问候顾客', '询问需求']
      },
      {
        id: 'conv_coffee_2',
        speaker: 'user',
        speakerName: '顾客',
        text: 'Hi! I\'d like a medium latte, please. And do you have any pastries?',
        translation: '您好！我想要一杯中杯拿铁，谢谢。请问你们有糕点吗？',
        expectedResponse: 'I\'d like a medium latte, please. Do you have any pastries?',
        hints: ['点饮品', '询问食物']
      },
      {
        id: 'conv_coffee_3',
        speaker: 'system',
        speakerName: '服务员',
        text: 'Absolutely! We have croissants, muffins, and Danish pastries. They\'re all freshly baked this morning.',
        translation: '当然有！我们有羊角面包、玛芬和丹麦酥。都是今天早上新鲜烘烤的。'
      },
      {
        id: 'conv_coffee_4',
        speaker: 'user',
        speakerName: '顾客',
        text: 'Great! I\'ll take a chocolate croissant as well.',
        translation: '太好了！我还要一个巧克力羊角面包。',
        expectedResponse: 'I\'ll take a chocolate croissant as well.',
        hints: ['选择食物']
      }
    ],
    supportedModules: ['listening', 'speaking'],
    createdAt: new Date('2024-01-03')
  }
];

// 混合多媒体内容示例
export const mixedContents: UniversalContent[] = [
  {
    id: 'mixed_business_presentation',
    title: '商务演示技巧',
    description: '学习如何进行有效的商务演示',
    contentType: 'mixed',
    level: 'B2',
    category: '商务英语',
    tags: ['演示', '商务', '沟通技巧', '职场'],
    originalText: `Effective business presentations are crucial for career success. Whether you're pitching an idea, reporting results, or training colleagues, your presentation skills can make or break your message.

Start with a clear structure: introduction, main points, and conclusion. Use visual aids wisely - they should support your message, not distract from it. Practice your delivery, maintain eye contact, and be prepared for questions.

Remember, confidence comes from preparation. Know your material inside out, anticipate questions, and have backup plans. Your audience will appreciate a well-prepared, engaging presentation.`,
    translation: `有效的商务演示对职业成功至关重要。无论您是在推销想法、汇报结果还是培训同事，您的演示技巧都可能成就或破坏您的信息。

从清晰的结构开始：介绍、要点和结论。明智地使用视觉辅助工具 - 它们应该支持您的信息，而不是分散注意力。练习您的表达，保持眼神接触，并为问题做好准备。

记住，自信来自准备。彻底了解您的材料，预期问题，并制定备用计划。您的听众会欣赏准备充分、引人入胜的演示。`,
    audioUrl: '/audio/business-presentation.mp3',
    videoUrl: '/video/presentation-tips.mp4',
    imageUrl: '/images/presentation-slide.jpg',
    wordCount: 156,
    estimatedDuration: 10,
    supportedModules: ['reading', 'listening', 'speaking', 'writing'],
    createdAt: new Date('2024-01-04')
  }
];

// 写作练习内容示例
export const writingContents: WritingPracticeContent[] = [
  {
    id: 'writing_email_formal',
    title: '正式邮件写作',
    description: '学习如何撰写正式的商务邮件',
    level: 'B1',
    category: '商务写作',
    practiceType: 'business_writing',
    prompt: '你需要向客户写一封邮件，告知产品交付将延迟一周。请写一封正式的道歉邮件，说明延迟原因并提供解决方案。',
    sampleAnswer: `Dear Mr. Johnson,

I hope this email finds you well. I am writing to inform you of a delay in the delivery of your recent order (Order #12345).

Due to unexpected supply chain disruptions, we will need to extend the delivery date by one week. Your order, originally scheduled for March 15th, will now be delivered on March 22nd.

We sincerely apologize for this inconvenience and understand the impact this may have on your plans. As compensation, we would like to offer you a 10% discount on your next purchase and free express shipping for this order.

Please let me know if you have any questions or concerns. We greatly appreciate your understanding and patience.

Best regards,
Sarah Chen
Customer Service Manager`,
    wordLimit: 200,
    timeLimit: 30,
    rubric: DEFAULT_WRITING_RUBRIC,
    templates: [
      'Dear [Name],\n\nI hope this email finds you well...',
      'Subject: Regarding Your Recent Order\n\nDear [Customer],\n\n...'
    ],
    keywords: ['formal tone', 'apology', 'explanation', 'solution', 'compensation'],
    estimatedDuration: 25,
    difficulty: 3
  },
  {
    id: 'writing_essay_opinion',
    title: '观点论文写作',
    description: '练习表达个人观点的议论文写作',
    level: 'B2',
    category: '学术写作',
    practiceType: 'essay_writing',
    prompt: '有些人认为社交媒体对青少年的影响主要是负面的，而另一些人认为它有助于年轻人建立联系和学习。你的观点是什么？请写一篇200-250字的文章阐述你的观点。',
    wordLimit: 250,
    timeLimit: 45,
    rubric: DEFAULT_WRITING_RUBRIC,
    keywords: ['social media', 'teenagers', 'impact', 'opinion', 'argument'],
    estimatedDuration: 40,
    difficulty: 4
  }
];

// 听力练习内容示例
export const listeningContents: ListeningPracticeContent[] = [
  {
    id: 'listening_weather_report',
    title: '天气预报听力',
    description: '听天气预报并回答相关问题',
    level: 'A2',
    category: '日常生活',
    practiceType: 'comprehension',
    audioUrl: '/audio/weather-report.mp3',
    transcript: `Good evening, and welcome to the 7 o'clock weather forecast. Tomorrow will be partly cloudy with temperatures reaching 22 degrees Celsius in the afternoon. There's a 30% chance of light rain in the evening, so you might want to carry an umbrella. Winds will be gentle from the southwest at about 15 kilometers per hour. The weekend looks promising with sunny skies and temperatures climbing to 25 degrees on Saturday and 27 on Sunday. Perfect weather for outdoor activities!`,
    duration: 45,
    questions: [
      {
        id: 'q_weather_1',
        type: 'multiple_choice',
        question: 'What will the temperature be tomorrow afternoon?',
        options: ['20°C', '22°C', '25°C', '27°C'],
        correctAnswer: '22°C',
        explanation: '预报说下午温度会达到22摄氏度'
      },
      {
        id: 'q_weather_2',
        type: 'true_false',
        question: 'There will definitely be rain tomorrow evening.',
        correctAnswer: 'false',
        explanation: '预报说有30%的可能性会有小雨，不是一定会下雨'
      }
    ],
    estimatedDuration: 8,
    playbackSpeed: [0.75, 1.0, 1.25],
    difficulty: 2
  }
];

// 阅读练习内容示例
export const readingContents: ReadingPracticeContent[] = [
  {
    id: 'reading_healthy_lifestyle',
    title: '健康生活方式',
    description: '关于保持健康生活方式的文章阅读理解',
    level: 'B1',
    category: '健康话题',
    practiceType: 'comprehension',
    text: `Maintaining a healthy lifestyle is more important than ever in today's fast-paced world. Regular exercise, balanced nutrition, and adequate sleep form the foundation of good health.

Exercise doesn't have to mean spending hours at the gym. Simple activities like walking, cycling, or swimming for 30 minutes a day can significantly improve your physical and mental well-being. The key is consistency - it's better to exercise a little every day than to have intense workout sessions once in a while.

Nutrition plays an equally important role. A balanced diet should include plenty of fruits, vegetables, whole grains, and lean proteins. Limiting processed foods and sugary drinks can help maintain a healthy weight and reduce the risk of chronic diseases.

Finally, don't underestimate the power of sleep. Most adults need 7-9 hours of quality sleep each night. Good sleep helps your body repair itself and improves concentration, mood, and immune function.`,
    wordCount: 187,
    questions: [
      {
        id: 'q_health_1',
        type: 'multiple_choice',
        question: 'According to the text, how much exercise is recommended per day?',
        options: ['15 minutes', '30 minutes', '45 minutes', '60 minutes'],
        correctAnswer: '30 minutes',
        explanation: '文章中提到每天30分钟的简单活动就能显著改善健康'
      },
      {
        id: 'q_health_2',
        type: 'short_answer',
        question: 'What are the three foundations of good health mentioned in the text?',
        correctAnswer: 'Regular exercise, balanced nutrition, and adequate sleep',
        explanation: '文章开头提到这三个健康的基础'
      }
    ],
    vocabulary: [
      {
        word: 'adequate',
        definition: 'enough in quantity or quality',
        pronunciation: '/ˈædɪkwət/',
        partOfSpeech: 'adjective',
        example: 'Make sure you get adequate sleep every night.',
        difficulty: 3
      },
      {
        word: 'chronic',
        definition: 'lasting a long time or recurring frequently',
        pronunciation: '/ˈkrɑːnɪk/',
        partOfSpeech: 'adjective',
        example: 'Poor diet can lead to chronic diseases.',
        difficulty: 4
      }
    ],
    estimatedDuration: 12,
    difficulty: 3
  }
];

// 所有示例内容的组合
export const allSampleContents: UniversalContent[] = [
  ...articleContents,
  ...dialogueContents,
  ...mixedContents
];

// 初始化示例数据的函数
export function initializeSampleData() {
  return {
    universalContents: allSampleContents,
    writingContents,
    listeningContents,
    readingContents
  };
}