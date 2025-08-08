import { WordbookService } from '@/services/user';
import { ContentManager } from '@/services/content';
import { UniversalContent } from '@/types';

/**
 * 添加测试数据到单词本
 */
export async function addTestWords() {
  const wordbookService = new WordbookService();
  await wordbookService.initialize();

  const testWords = [
    {
      word: 'hello',
      definition: '你好；问候',
      addReason: 'translation_lookup' as const,
      pronunciation: 'həˈloʊ'
    },
    {
      word: 'world',
      definition: '世界；全世界',
      addReason: 'translation_lookup' as const,
      pronunciation: 'wɜːrld'
    },
    {
      word: 'computer',
      definition: '计算机；电脑',
      addReason: 'pronunciation_error' as const,
      pronunciation: 'kəmˈpjuːtər'
    },
    {
      word: 'beautiful',
      definition: '美丽的；漂亮的',
      addReason: 'listening_difficulty' as const,
      pronunciation: 'ˈbjuːtɪfl'
    },
    {
      word: 'important',
      definition: '重要的；重大的',
      addReason: 'translation_lookup' as const,
      pronunciation: 'ɪmˈpɔːrtnt'
    }
  ];

  for (const wordData of testWords) {
    try {
      const addedWord = await wordbookService.smartAddWord(
        wordData.word,
        wordData.definition,
        wordData.addReason,
        wordData.pronunciation
      );
      console.log(`添加单词: ${wordData.word}`, {
        id: addedWord.id,
        nextReviewAt: addedWord.nextReviewAt,
        proficiencyLevel: addedWord.proficiencyLevel
      });
    } catch (error) {
      console.error(`添加单词 ${wordData.word} 失败:`, error);
    }
  }

  // 检查统计信息
  try {
    const stats = await wordbookService.getWordStats();
    console.log('统计信息:', stats);
    
    const reviewQueue = await wordbookService.getTodayReviewQueue();
    console.log('今日复习队列:', reviewQueue.length, '个单词');
    reviewQueue.forEach(word => {
      console.log(`- ${word.word}: nextReviewAt=${word.nextReviewAt}, proficiencyLevel=${word.proficiencyLevel}`);
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
  }

  console.log('测试数据添加完成');
}

/**
 * 清除所有测试数据
 */
export async function clearTestWords() {
  const wordbookService = new WordbookService();
  await wordbookService.initialize();

  // 这里可以添加清除逻辑，但为了安全起见，我们暂时不实现
  console.log('清除测试数据功能暂未实现');
}

/**
 * 5模块学习系统的测试内容数据
 */
export const testUniversalContents: UniversalContent[] = [
  // 英语基础对话 - 日常交流
  {
    id: 'content-001',
    title: '日常问候与自我介绍',
    description: '学习基本的英语问候语和自我介绍方式',
    type: 'mixed',
    level: 'beginner',
    tags: ['日常对话', '问候', '自我介绍', '初学者'],
    modules: ['content', 'listening', 'speaking', 'reading', 'writing'],
    content: {
      text: `A: Hello! Nice to meet you. My name is Sarah.
B: Hi Sarah! I'm David. Nice to meet you too.
A: Where are you from, David?
B: I'm from New York. How about you?
A: I'm from Beijing, China. I'm here to study English.
B: That's great! How long have you been learning English?
A: For about two years. I still need to practice more.
B: Your English is very good! Keep up the good work.`,
      audioUrl: 'https://example.com/audio/daily-greeting.mp3',
      videoUrl: 'https://example.com/video/daily-greeting.mp4',
      imageUrl: 'https://example.com/images/people-greeting.jpg'
    },
    metadata: {
      difficulty: 'easy',
      duration: 120,
      wordCount: 65,
      vocabulary: ['hello', 'nice', 'meet', 'name', 'from', 'study', 'practice', 'good'],
      keyPhrases: ['Nice to meet you', 'How about you', 'Keep up the good work']
    },
    practiceContent: {
      listening: {
        questions: [
          {
            type: 'multiple-choice',
            question: 'What is the woman\'s name?',
            options: ['Sarah', 'Susan', 'Sandra', 'Sally'],
            correctAnswer: 0,
            explanation: 'The woman introduces herself as Sarah.'
          },
          {
            type: 'fill-blank',
            question: 'David is from ___.',
            options: ['New York', 'Beijing', 'London', 'Tokyo'],
            correctAnswer: 0,
            explanation: 'David says "I\'m from New York."'
          }
        ],
        audioSegments: [
          { start: 0, end: 5, transcript: 'Hello! Nice to meet you. My name is Sarah.' },
          { start: 6, end: 12, transcript: 'Hi Sarah! I\'m David. Nice to meet you too.' }
        ]
      },
      speaking: {
        scenarios: [
          {
            type: 'role-play',
            description: '角色扮演：你是Sarah，向David问好并自我介绍',
            prompt: '请说出Sarah的台词',
            expectedResponse: 'Hello! Nice to meet you. My name is Sarah.'
          },
          {
            type: 'pronunciation',
            description: '练习发音：重点练习问候语',
            phrases: [
              'Nice to meet you',
              'Where are you from',
              'Keep up the good work'
            ]
          }
        ]
      },
      reading: {
        exercises: [
          {
            type: 'comprehension',
            question: 'How long has Sarah been learning English?',
            answer: 'For about two years',
            explanation: 'Sarah mentions "For about two years" when asked about her English learning experience.'
          },
          {
            type: 'vocabulary',
            word: 'practice',
            definition: '练习，实践',
            sentence: 'I still need to practice more.',
            explanation: '这里practice作动词使用，表示"练习"的意思。'
          }
        ]
      },
      writing: {
        prompts: [
          {
            type: 'dialogue-completion',
            instruction: '完成这段对话，写出B的回应',
            context: 'A: How long have you been learning Chinese?\nB: ___',
            sampleAnswer: 'I have been learning Chinese for six months.',
            criteria: ['语法正确', '逻辑合理', '符合对话情境']
          },
          {
            type: 'self-introduction',
            instruction: '写一个简短的自我介绍，包含姓名、来自哪里、正在学什么',
            minWords: 30,
            maxWords: 60,
            criteria: ['包含必要信息', '语法正确', '表达自然']
          }
        ]
      }
    }
  },

  // 旅行主题 - 中级内容
  {
    id: 'content-002',
    title: '机场和酒店入住',
    description: '学习旅行中的常用英语表达，包括机场和酒店场景',
    type: 'mixed',
    level: 'intermediate',
    tags: ['旅行', '机场', '酒店', '中级'],
    modules: ['content', 'listening', 'speaking', 'reading', 'writing'],
    content: {
      text: `At the Airport:
Officer: Good morning. May I see your passport and boarding pass?
Traveler: Here you are.
Officer: Thank you. What's the purpose of your visit?
Traveler: I'm here for business. I'll be staying for one week.
Officer: Enjoy your stay!

At the Hotel:
Receptionist: Welcome to the Grand Hotel. How may I assist you?
Guest: I have a reservation under the name Johnson.
Receptionist: Let me check... Yes, Mr. Johnson. A single room for three nights, checking out on Friday.
Guest: That's correct. Could I have a wake-up call at 7 AM tomorrow?
Receptionist: Of course. Here's your room key. The elevator is to your right.`,
      audioUrl: 'https://example.com/audio/travel-scenarios.mp3',
      videoUrl: 'https://example.com/video/travel-scenarios.mp4',
      imageUrl: 'https://example.com/images/airport-hotel.jpg'
    },
    metadata: {
      difficulty: 'medium',
      duration: 180,
      wordCount: 98,
      vocabulary: ['passport', 'boarding pass', 'purpose', 'business', 'reservation', 'check out', 'wake-up call'],
      keyPhrases: ['May I see', 'What\'s the purpose', 'I have a reservation', 'Could I have']
    },
    practiceContent: {
      listening: {
        questions: [
          {
            type: 'multiple-choice',
            question: 'Why is the traveler visiting?',
            options: ['Tourism', 'Business', 'Study', 'Family visit'],
            correctAnswer: 1,
            explanation: 'The traveler says "I\'m here for business."'
          }
        ],
        audioSegments: [
          { start: 0, end: 8, transcript: 'Good morning. May I see your passport and boarding pass?' },
          { start: 20, end: 30, transcript: 'Welcome to the Grand Hotel. How may I assist you?' }
        ]
      },
      speaking: {
        scenarios: [
          {
            type: 'situation',
            description: '你在机场接受入境检查',
            prompt: '回答海关官员关于访问目的的询问',
            expectedResponse: 'I\'m here for tourism/business/study.'
          }
        ]
      },
      reading: {
        exercises: [
          {
            type: 'detail',
            question: 'How long is the guest staying at the hotel?',
            answer: 'Three nights',
            explanation: 'The receptionist confirms "A single room for three nights"'
          }
        ]
      },
      writing: {
        prompts: [
          {
            type: 'email',
            instruction: '写一封酒店预订确认邮件',
            context: '你需要确认预订信息并提出特殊要求',
            minWords: 80,
            maxWords: 120,
            criteria: ['包含预订详情', '语气礼貌', '格式正确']
          }
        ]
      }
    }
  },

  // 商务英语 - 高级内容
  {
    id: 'content-003',
    title: '商务会议讨论',
    description: '学习商务环境中的专业英语表达和会议用语',
    type: 'mixed',
    level: 'advanced',
    tags: ['商务', '会议', '高级', '专业'],
    modules: ['content', 'listening', 'speaking', 'reading', 'writing'],
    content: {
      text: `Meeting Discussion:
Chair: Let's move on to the next item on our agenda. The quarterly sales report.
Manager: Thank you. I'm pleased to announce that we've exceeded our targets by 15% this quarter.
Chair: That's excellent news! What factors contributed to this success?
Manager: Several factors played a role. First, our new marketing campaign was highly effective. Second, we expanded into three new markets. Finally, customer retention improved significantly.
Participant: Could you elaborate on the marketing campaign? What specific strategies were most successful?
Manager: Certainly. We focused on digital marketing, particularly social media engagement and targeted advertising. The ROI on these initiatives was impressive.
Chair: How do you propose we build on this momentum for the next quarter?`,
      audioUrl: 'https://example.com/audio/business-meeting.mp3',
      videoUrl: 'https://example.com/video/business-meeting.mp4',
      imageUrl: 'https://example.com/images/business-meeting.jpg'
    },
    metadata: {
      difficulty: 'hard',
      duration: 240,
      wordCount: 145,
      vocabulary: ['quarterly', 'exceeded', 'targets', 'factors', 'contributed', 'elaborate', 'strategies', 'initiatives', 'momentum'],
      keyPhrases: ['move on to', 'exceeded our targets', 'contributed to', 'build on this momentum']
    },
    practiceContent: {
      listening: {
        questions: [
          {
            type: 'multiple-choice',
            question: 'By how much did they exceed their targets?',
            options: ['10%', '15%', '20%', '25%'],
            correctAnswer: 1,
            explanation: 'The manager states they "exceeded our targets by 15%"'
          }
        ],
        audioSegments: [
          { start: 0, end: 10, transcript: 'Let\'s move on to the next item on our agenda.' },
          { start: 15, end: 25, transcript: 'I\'m pleased to announce that we\'ve exceeded our targets by 15%' }
        ]
      },
      speaking: {
        scenarios: [
          {
            type: 'presentation',
            description: '你需要在会议中报告季度业绩',
            prompt: '简要汇报你的部门本季度的成果',
            expectedResponse: 'I\'m pleased to report that our department achieved/exceeded...'
          }
        ]
      },
      reading: {
        exercises: [
          {
            type: 'inference',
            question: 'What can we infer about the company\'s future plans?',
            answer: 'They plan to continue building on their current success',
            explanation: 'The chairperson asks "How do you propose we build on this momentum"'
          }
        ]
      },
      writing: {
        prompts: [
          {
            type: 'business-report',
            instruction: '写一份简短的季度总结报告',
            context: '包含业绩数据、成功因素和未来建议',
            minWords: 150,
            maxWords: 200,
            criteria: ['数据准确', '逻辑清晰', '专业用词', '建议具体']
          }
        ]
      }
    }
  },

  // 科技主题 - 专业内容
  {
    id: 'content-004',
    title: '人工智能与未来',
    description: '探讨人工智能技术的发展及其对社会的影响',
    type: 'text',
    level: 'advanced',
    tags: ['科技', 'AI', '未来', '学术'],
    modules: ['content', 'listening', 'reading', 'writing'],
    content: {
      text: `Artificial Intelligence: Shaping Our Future

Artificial Intelligence (AI) has evolved from a concept in science fiction to a transformative force in our daily lives. From voice assistants in our homes to sophisticated algorithms that power search engines, AI is reshaping how we interact with technology and each other.

The current wave of AI development is characterized by machine learning and deep learning technologies. These systems can analyze vast amounts of data, identify patterns, and make predictions with remarkable accuracy. In healthcare, AI assists doctors in diagnosing diseases earlier and more precisely. In transportation, autonomous vehicles promise to reduce accidents and improve traffic efficiency.

However, this technological revolution also raises important questions. As AI becomes more capable, concerns about job displacement, privacy, and algorithmic bias have become prominent. Society must navigate these challenges while harnessing AI's potential to solve complex problems like climate change and global inequality.

Looking ahead, the integration of AI into various sectors will likely accelerate. The key lies in developing AI responsibly, ensuring it serves humanity's best interests while mitigating potential risks.`,
      imageUrl: 'https://example.com/images/ai-future.jpg'
    },
    metadata: {
      difficulty: 'hard',
      duration: 300,
      wordCount: 189,
      vocabulary: ['artificial intelligence', 'transformative', 'sophisticated', 'algorithms', 'autonomous', 'displacement', 'algorithmic bias', 'integration', 'mitigating'],
      keyPhrases: ['evolved from', 'characterized by', 'raises important questions', 'looking ahead']
    },
    practiceContent: {
      listening: {
        questions: [
          {
            type: 'summary',
            question: 'What is the main topic of this passage?',
            options: ['The history of computers', 'The impact of AI on society', 'How to build AI systems', 'The future of work'],
            correctAnswer: 1,
            explanation: 'The passage discusses AI\'s evolution and its impact on various aspects of society'
          }
        ],
        audioSegments: []
      },
      reading: {
        exercises: [
          {
            type: 'main-idea',
            question: 'What is the author\'s main argument about AI development?',
            answer: 'AI development should be responsible and serve humanity\'s best interests',
            explanation: 'The conclusion emphasizes "developing AI responsibly, ensuring it serves humanity\'s best interests"'
          },
          {
            type: 'vocabulary',
            word: 'sophisticated',
            definition: '复杂的，精密的',
            sentence: 'sophisticated algorithms that power search engines',
            explanation: '这里sophisticated指算法的复杂程度和精密性'
          }
        ]
      },
      writing: {
        prompts: [
          {
            type: 'essay',
            instruction: '写一篇短文讨论AI对教育的影响',
            context: '分析AI在教育领域的积极和消极影响，并提出你的观点',
            minWords: 200,
            maxWords: 300,
            criteria: ['观点明确', '论证充分', '结构清晰', '语言准确']
          }
        ]
      }
    }
  },

  // 文化交流 - 生活化内容
  {
    id: 'content-005',
    title: '中西文化差异',
    description: '了解中西方文化在社交礼仪和生活方式上的差异',
    type: 'mixed',
    level: 'intermediate',
    tags: ['文化', '社交', '生活', '跨文化'],
    modules: ['content', 'listening', 'speaking', 'reading', 'writing'],
    content: {
      text: `Cultural Differences: East Meets West

Understanding cultural differences is essential for effective cross-cultural communication. When Chinese and Western cultures interact, several interesting contrasts emerge.

In social interactions, Chinese culture often emphasizes collective harmony and indirect communication. People might say "maybe" when they mean "no" to avoid confrontation. Western culture, particularly American, tends to value direct communication and individual expression.

Gift-giving customs also differ significantly. In China, gifts are often refused several times before being accepted, showing politeness and humility. In Western countries, gifts are typically accepted immediately with enthusiastic thanks.

Business card etiquette provides another example. Chinese professionals receive business cards with both hands and study them respectfully. Westerners might glance at the card briefly and put it away quickly.

These differences aren't right or wrong—they reflect different cultural values. By understanding and respecting these variations, we can build stronger international relationships and avoid misunderstandings.`,
      audioUrl: 'https://example.com/audio/cultural-differences.mp3',
      imageUrl: 'https://example.com/images/cultural-exchange.jpg'
    },
    metadata: {
      difficulty: 'medium',
      duration: 200,
      wordCount: 168,
      vocabulary: ['collective', 'harmony', 'indirect', 'confrontation', 'individual', 'customs', 'humility', 'etiquette', 'variations'],
      keyPhrases: ['cross-cultural communication', 'avoid confrontation', 'differ significantly', 'build stronger relationships']
    },
    practiceContent: {
      listening: {
        questions: [
          {
            type: 'comparison',
            question: 'How do Chinese and Western approaches to gift-giving differ?',
            options: ['Chinese accept immediately, Westerners refuse', 'Chinese refuse first, Westerners accept immediately', 'Both cultures have the same approach', 'The passage doesn\'t mention gift-giving'],
            correctAnswer: 1,
            explanation: 'The passage states Chinese often refuse gifts several times before accepting, while Westerners accept immediately'
          }
        ],
        audioSegments: [
          { start: 0, end: 15, transcript: 'Understanding cultural differences is essential for effective cross-cultural communication.' }
        ]
      },
      speaking: {
        scenarios: [
          {
            type: 'cultural-explanation',
            description: '向外国朋友解释中国的某个文化习俗',
            prompt: '解释为什么中国人收到礼物时会先推辞',
            expectedResponse: 'In Chinese culture, refusing a gift initially shows politeness and humility...'
          }
        ]
      },
      reading: {
        exercises: [
          {
            type: 'attitude',
            question: 'What is the author\'s attitude toward cultural differences?',
            answer: 'Respectful and understanding',
            explanation: 'The author emphasizes that differences "aren\'t right or wrong" and advocates for understanding and respect'
          }
        ]
      },
      writing: {
        prompts: [
          {
            type: 'comparison',
            instruction: '比较中西方在某个方面的文化差异',
            context: '选择一个具体方面（如饮食、教育、家庭观念等）进行对比分析',
            minWords: 120,
            maxWords: 180,
            criteria: ['对比明确', '举例具体', '分析深入', '表达客观']
          }
        ]
      }
    }
  }
];

/**
 * 添加测试内容到内容管理器
 */
export async function addTestContents() {
  const contentManager = ContentManager.getInstance();
  
  console.log('开始添加测试内容...');
  
  for (const content of testUniversalContents) {
    try {
      contentManager.addContent(content);
      console.log(`添加内容: ${content.title} (${content.level})`);
    } catch (error) {
      console.error(`添加内容 ${content.title} 失败:`, error);
    }
  }
  
  // 显示统计信息
  const allContents = contentManager.getAllContents();
  console.log(`\n内容统计:`);
  console.log(`总内容数: ${allContents.length}`);
  console.log(`初级内容: ${allContents.filter(c => c.level === 'beginner').length}`);
  console.log(`中级内容: ${allContents.filter(c => c.level === 'intermediate').length}`);
  console.log(`高级内容: ${allContents.filter(c => c.level === 'advanced').length}`);
  
  // 按模块统计
  const moduleStats = allContents.reduce((acc, content) => {
    content.modules.forEach(module => {
      acc[module] = (acc[module] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  console.log('\n模块内容统计:');
  Object.entries(moduleStats).forEach(([module, count]) => {
    console.log(`${module}: ${count} 个内容`);
  });
  
  console.log('\n测试内容添加完成!');
}