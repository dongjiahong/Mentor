import { WritingRubric } from '../types/practice';

// ============================================================================
// 应用常量定义
// ============================================================================

// 熟练度等级描述
export const PROFICIENCY_LEVELS = {
  0: '未学习',
  1: '初识',
  2: '认识',
  3: '熟悉',
  4: '掌握',
  5: '精通',
} as const;

// 英语水平描述
export const ENGLISH_LEVEL_DESCRIPTIONS = {
  A1: '入门级',
  A2: '基础级',
  B1: '中级',
  B2: '中高级',
  C1: '高级',
  C2: '精通级',
} as const;

// 学习目标描述
export const LEARNING_GOAL_DESCRIPTIONS = {
  daily_conversation: '日常交流',
  business_english: '商务英语',
  workplace_english: '职场英语',
  written_documents: '书面文档',
  correspondence: '书信沟通',
  academic_english: '学术英语',
  travel_english: '旅游英语',
  exam_preparation: '考试准备',
} as const;

// 学习模块描述
export const LEARNING_MODULE_DESCRIPTIONS = {
  content: {
    title: '内容管理',
    description: '浏览和管理所有学习材料',
    icon: 'Archive',
    color: 'from-blue-500 to-blue-600'
  },
  listening: {
    title: '听力练习',
    description: '提升听力理解和听写能力',
    icon: 'Headphones',
    color: 'from-green-500 to-green-600'
  },
  speaking: {
    title: '口语练习',
    description: '训练发音和口语表达',
    icon: 'Mic',
    color: 'from-orange-500 to-orange-600'
  },
  reading: {
    title: '阅读练习',
    description: '提升阅读理解和词汇量',
    icon: 'BookOpen',
    color: 'from-purple-500 to-purple-600'
  },
  writing: {
    title: '写作练习',
    description: '锻炼写作技巧和表达能力',
    icon: 'PenTool',
    color: 'from-pink-500 to-pink-600'
  }
} as const;

// 写作类型描述
export const WRITING_TYPE_DESCRIPTIONS = {
  'essay': '论述文',
  'letter': '书信',
  'report': '报告',
  'story': '故事',
  'description': '描述文',
  'argument': '论证文'
} as const;

// 写作练习类型描述
export const WRITING_PRACTICE_TYPE_DESCRIPTIONS = {
  sentence_construction: '句子构造',
  paragraph_writing: '段落写作',
  essay_writing: '文章写作',
  translation_writing: '翻译写作',
  creative_writing: '创意写作',
  business_writing: '商务写作',
  email_writing: '邮件写作'
} as const;

// 听力练习类型描述
export const LISTENING_PRACTICE_TYPE_DESCRIPTIONS = {
  comprehension: '听力理解',
  dictation: '听写练习',
  gap_filling: '听力填空',
  multiple_choice: '听力选择',
  dialogue_listening: '对话听力'
} as const;

// 阅读练习类型描述
export const READING_PRACTICE_TYPE_DESCRIPTIONS = {
  comprehension: '阅读理解',
  vocabulary_building: '词汇构建',
  speed_reading: '快速阅读',
  detailed_reading: '精读练习',
  skimming_scanning: '略读扫读'
} as const;

// 默认配置
export const DEFAULT_AI_CONFIG = {
  temperature: 0.7,
  maxTokens: 2000,
} as const;

export const DEFAULT_SPEECH_OPTIONS = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  lang: 'en-US',
} as const;

export const DEFAULT_RECOGNITION_OPTIONS = {
  lang: 'en-US',
  continuous: false,
  interimResults: true,
  maxAlternatives: 1,
} as const;

// 默认写作评分标准
export const DEFAULT_WRITING_RUBRIC: WritingRubric = {
  id: 'default_rubric',
  name: '通用写作评分标准',
  criteria: [
    {
      id: 'content',
      name: '内容',
      description: '思想表达是否清晰，内容是否充实',
      maxPoints: 25,
      weight: 0.3
    },
    {
      id: 'organization',
      name: '结构',
      description: '文章结构是否合理，逻辑是否清晰',
      maxPoints: 20,
      weight: 0.2
    },
    {
      id: 'grammar',
      name: '语法',
      description: '语法使用是否正确',
      maxPoints: 25,
      weight: 0.25
    },
    {
      id: 'vocabulary',
      name: '词汇',
      description: '词汇使用是否恰当、丰富',
      maxPoints: 20,
      weight: 0.15
    },
    {
      id: 'mechanics',
      name: '语言mechanics',
      description: '拼写、标点符号使用等',
      maxPoints: 10,
      weight: 0.1
    }
  ],
  totalPoints: 100
};