import { 
  VoicePracticeContent, 
  DialoguePracticeScenario, 
  VoicePracticeSentence,
  DialogueItem 
} from '@/types';

// 跟读练习内容数据
export const followAlongPractices: VoicePracticeContent[] = [
  {
    id: 'follow_1',
    title: '日常问候',
    description: '学习基础的英语问候用语，掌握日常交流的开场白',
    level: 'A1',
    category: '日常交流',
    practiceType: 'sentence_repeat',
    estimatedDuration: 5,
    sentences: [
      {
        id: 'sent_1_1',
        text: 'Good morning!',
        translation: '早上好！',
        difficulty: 1,
        phonetic: '/ɡʊd ˈmɔːrnɪŋ/',
        tips: '注意 "morning" 中的 r 音要卷舌'
      },
      {
        id: 'sent_1_2', 
        text: 'How are you today?',
        translation: '你今天怎么样？',
        difficulty: 2,
        phonetic: '/haʊ ɑːr juː təˈdeɪ/',
        tips: '注意 "are" 和 "you" 的连读'
      },
      {
        id: 'sent_1_3',
        text: 'Nice to meet you.',
        translation: '很高兴见到你。',
        difficulty: 2,
        phonetic: '/naɪs tuː miːt juː/',
        tips: '"Nice to" 可以连读为 "Niceto"'
      },
      {
        id: 'sent_1_4',
        text: 'Have a wonderful day!',
        translation: '祝你有美好的一天！',
        difficulty: 3,
        phonetic: '/hæv ə ˈwʌndərfəl deɪ/',
        tips: '注意 "wonderful" 的重音在第一个音节'
      }
    ]
  },
  {
    id: 'follow_2',
    title: '商务介绍',
    description: '学习商务场合的自我介绍和基本交流用语',
    level: 'B1',
    category: '商务英语',
    practiceType: 'sentence_repeat',
    estimatedDuration: 8,
    sentences: [
      {
        id: 'sent_2_1',
        text: 'Let me introduce myself.',
        translation: '让我自我介绍一下。',
        difficulty: 2,
        phonetic: '/let miː ˌɪntrəˈduːs maɪˈself/',
        tips: '注意 "introduce" 的重音在第三个音节'
      },
      {
        id: 'sent_2_2',
        text: 'I work as a software engineer.',
        translation: '我是一名软件工程师。',
        difficulty: 3,
        phonetic: '/aɪ wɜːrk æz ə ˈsɔːftwer ˌendʒɪˈnɪr/',
        tips: '"software" 中的 "t" 通常不发音'
      },
      {
        id: 'sent_2_3',
        text: 'I\'m pleased to be here.',
        translation: '很高兴能在这里。',
        difficulty: 2,
        phonetic: '/aɪm pliːzd tuː biː hɪr/',
        tips: '"pleased to be" 可以快速连读'
      }
    ]
  },
  {
    id: 'follow_3',
    title: '餐厅用餐',
    description: '掌握在餐厅点餐和用餐时的常用英语表达',
    level: 'A2', 
    category: '生活场景',
    practiceType: 'sentence_repeat',
    estimatedDuration: 6,
    sentences: [
      {
        id: 'sent_3_1',
        text: 'Could I see the menu, please?',
        translation: '我可以看看菜单吗？',
        difficulty: 2,
        phonetic: '/kʊd aɪ siː ðə ˈmenjuː pliːz/',
        tips: '注意礼貌用语的语调要上扬'
      },
      {
        id: 'sent_3_2',
        text: 'I\'d like to order the chicken.',
        translation: '我想点鸡肉。',
        difficulty: 2,
        phonetic: '/aɪd laɪk tuː ˈɔːrdər ðə ˈtʃɪkɪn/',
        tips: '"I\'d like" 是 "I would like" 的缩写'
      },
      {
        id: 'sent_3_3',
        text: 'The food is delicious.',
        translation: '食物很美味。',
        difficulty: 2,
        phonetic: '/ðə fuːd ɪz dɪˈlɪʃəs/',
        tips: '"delicious" 的重音在第二个音节'
      }
    ]
  }
];

// 对话练习场景数据
export const dialoguePracticeScenarios: DialoguePracticeScenario[] = [
  {
    id: 'dialogue_1',
    title: '咖啡店点餐',
    description: '在咖啡店与服务员对话，练习点餐和结账',
    level: 'A2',
    category: '生活场景',
    conversations: [
      {
        id: 'conv_1_1',
        speaker: 'system',
        text: 'Good morning! What can I get for you today?',
        translation: '早上好！今天您想要什么？'
      },
      {
        id: 'conv_1_2',
        speaker: 'user',
        text: '',
        expectedResponse: 'I\'d like a coffee, please.',
        hints: ['我想要...', '咖啡', '请说 "I\'d like a coffee, please."']
      },
      {
        id: 'conv_1_3',
        speaker: 'system',
        text: 'What size would you like? Small, medium, or large?',
        translation: '您要什么尺寸？小杯、中杯还是大杯？'
      },
      {
        id: 'conv_1_4',
        speaker: 'user',
        text: '',
        expectedResponse: 'Medium, please.',
        hints: ['中杯', '请说 "Medium, please."']
      },
      {
        id: 'conv_1_5',
        speaker: 'system',
        text: 'That\'ll be $4.50. Cash or card?',
        translation: '总共4.5美元。现金还是刷卡？'
      },
      {
        id: 'conv_1_6',
        speaker: 'user',
        text: '',
        expectedResponse: 'Card, please.',
        hints: ['刷卡', '请说 "Card, please."']
      }
    ]
  },
  {
    id: 'dialogue_2',
    title: '酒店前台办理入住',
    description: '在酒店前台办理入住手续的对话练习',
    level: 'B1',
    category: '旅游场景',
    conversations: [
      {
        id: 'conv_2_1',
        speaker: 'system',
        text: 'Good evening! Do you have a reservation?',
        translation: '晚上好！您有预订吗？'
      },
      {
        id: 'conv_2_2',
        speaker: 'user',
        text: '',
        expectedResponse: 'Yes, I have a reservation under Smith.',
        hints: ['是的，我有预订', '姓Smith', '请说 "Yes, I have a reservation under Smith."']
      },
      {
        id: 'conv_2_3',
        speaker: 'system',
        text: 'Let me check... Yes, here it is. A double room for three nights, correct?',
        translation: '让我查一下...是的，在这里。双人间住三晚，对吗？'
      },
      {
        id: 'conv_2_4',
        speaker: 'user',
        text: '',
        expectedResponse: 'That\'s correct.',
        hints: ['没错', '请说 "That\'s correct."']
      },
      {
        id: 'conv_2_5',
        speaker: 'system',
        text: 'Great! Could I see your ID and credit card, please?',
        translation: '太好了！我可以看看您的身份证件和信用卡吗？'
      },
      {
        id: 'conv_2_6',
        speaker: 'user',
        text: '',
        expectedResponse: 'Here you are.',
        hints: ['给您', '请说 "Here you are."']
      }
    ]
  },
  {
    id: 'dialogue_3',
    title: '工作面试对话',
    description: '模拟工作面试场景，练习自我介绍和回答问题',
    level: 'B2',
    category: '商务英语',
    conversations: [
      {
        id: 'conv_3_1',
        speaker: 'system',
        text: 'Thank you for coming in today. Could you start by telling me about yourself?',
        translation: '感谢您今天的到来。您能先介绍一下自己吗？'
      },
      {
        id: 'conv_3_2',
        speaker: 'user',
        text: '',
        expectedResponse: 'I\'m a software developer with 5 years of experience.',
        hints: ['我是...', '软件开发人员', '5年经验', '请介绍您的职业背景']
      },
      {
        id: 'conv_3_3',
        speaker: 'system',
        text: 'That\'s great! What interests you most about this position?',
        translation: '很好！您对这个职位最感兴趣的是什么？'
      },
      {
        id: 'conv_3_4',
        speaker: 'user',
        text: '',
        expectedResponse: 'I\'m excited about the opportunity to work with new technologies.',
        hints: ['我很兴奋...', '新技术', '工作机会', '请表达您的兴趣']
      }
    ]
  }
];

// 单词发音练习数据
export const wordPronunciationPractices: VoicePracticeContent[] = [
  {
    id: 'word_1',
    title: '常见难发音单词',
    description: '练习英语中常见的难发音单词',
    level: 'A2',
    category: '发音练习',
    practiceType: 'word_pronunciation',
    estimatedDuration: 4,
    sentences: [
      {
        id: 'word_1_1',
        text: 'pronunciation',
        translation: '发音',
        difficulty: 4,
        phonetic: '/prəˌnʌnsiˈeɪʃən/',
        tips: '注意重音在第四个音节 "a"'
      },
      {
        id: 'word_1_2',
        text: 'comfortable',
        translation: '舒适的',
        difficulty: 3,
        phonetic: '/ˈkʌmftərbəl/',
        tips: '中间的 "or" 通常弱读'
      },
      {
        id: 'word_1_3',
        text: 'Wednesday',
        translation: '星期三',
        difficulty: 3,
        phonetic: '/ˈwenzdeɪ/',
        tips: '第一个 "d" 通常不发音'
      },
      {
        id: 'word_1_4',
        text: 'colleague',
        translation: '同事',
        difficulty: 3,
        phonetic: '/ˈkɑːliːɡ/',
        tips: '注意结尾是 "eague" 但发音是 "eag"'
      }
    ]
  }
];

// 听力理解练习数据  
export const listeningComprehensionPractices: VoicePracticeContent[] = [
  {
    id: 'listen_1',
    title: '短对话理解',
    description: '听短对话，然后复述或回答问题',
    level: 'B1',
    category: '听力理解',
    practiceType: 'free_speech',
    estimatedDuration: 10,
    sentences: [
      {
        id: 'listen_1_1',
        text: 'A: What time does the meeting start? B: It starts at 2 PM in the conference room.',
        translation: 'A: 会议几点开始？ B: 下午2点在会议室开始。',
        difficulty: 2,
        tips: '听完后请用英语回答：会议什么时候在哪里举行？'
      },
      {
        id: 'listen_1_2',
        text: 'A: Did you finish the report? B: Yes, I sent it to you this morning.',
        translation: 'A: 你完成报告了吗？ B: 是的，我今天早上发给你了。',
        difficulty: 2,
        tips: '听完后请用英语回答：报告什么时候发送的？'
      }
    ]
  }
];

// 根据模式获取练习数据的工具函数
export function getPracticeDataByMode(mode: string): VoicePracticeContent[] {
  switch (mode) {
    case 'follow_along':
      return followAlongPractices;
    case 'word_pronunciation':
      return wordPronunciationPractices;
    case 'listening_comprehension':
      return listeningComprehensionPractices;
    default:
      return followAlongPractices;
  }
}

// 根据难度级别获取练习数据
export function getPracticeDataByLevel(level: string): VoicePracticeContent[] {
  const allPractices = [
    ...followAlongPractices, 
    ...wordPronunciationPractices,
    ...listeningComprehensionPractices
  ];
  return allPractices.filter(practice => practice.level === level);
}

// 根据分类获取练习数据
export function getPracticeDataByCategory(category: string): VoicePracticeContent[] {
  const allPractices = [
    ...followAlongPractices,
    ...wordPronunciationPractices,
    ...listeningComprehensionPractices
  ];
  return allPractices.filter(practice => practice.category === category);
}