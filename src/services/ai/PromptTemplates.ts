import {
  EnglishLevel,
  LearningGoal,
  ContentType,
  ExamType,
  ContentGenerationParams,
  ExamGenerationParams,
  PronunciationEvaluationParams
} from '@/types';

/**
 * Prompt模板管理器
 * 负责生成各种AI任务的提示词模板
 */
export class PromptTemplates {

  // 英语水平描述映射
  private static readonly LEVEL_DESCRIPTIONS: Record<EnglishLevel, string> = {
    A1: '初学者水平，使用最基础的词汇和简单句型',
    A2: '基础水平，使用常见词汇和基本语法结构',
    B1: '中级水平，使用中等难度词汇和复合句',
    B2: '中高级水平，使用较复杂的词汇和语法结构',
    C1: '高级水平，使用高级词汇和复杂语法',
    C2: '精通水平，使用母语级别的词汇和表达'
  };

  // 学习目标描述映射
  private static readonly GOAL_DESCRIPTIONS: Record<LearningGoal, string> = {
    daily_conversation: '日常生活对话',
    business_english: '商务和职场英语',
    academic_english: '学术和正式英语',
    travel_english: '旅游和出行英语',
    exam_preparation: '考试准备英语'
  };

  // 内容类型指令映射
  private static readonly CONTENT_TYPE_INSTRUCTIONS: Record<ContentType, string> = {
    dialogue: '生成一段自然的英语对话，包含2-4个说话者，对话应该生动有趣，体现真实的交流场景',
    article: '生成一篇结构清晰的英语文章，包含引言、主体和结论，内容应该信息丰富且逻辑清晰'
  };

  // 考试类型指令映射
  private static readonly EXAM_TYPE_INSTRUCTIONS: Record<ExamType, string> = {
    vocabulary: '词汇理解和运用题目，测试单词含义、用法和语境理解',
    pronunciation: '发音和语音识别题目，测试语音准确性和口语表达',
    comprehension: '阅读理解和语言理解题目，测试文本理解和语言运用能力'
  };

  /**
   * 生成内容创建的系统提示词
   */
  static getContentSystemPrompt(): string {
    return `你是一个专业的英语学习内容生成助手。你的任务是根据用户的英语水平和学习目标，生成高质量的英语学习内容。

请遵循以下原则：
1. 内容必须准确、自然、符合英语母语者的表达习惯
2. 根据指定的英语水平调整词汇和语法复杂度
3. 确保内容实用且贴近真实生活场景
4. 提供准确的中文翻译，翻译应该自然流畅
5. 严格按照要求的JSON格式返回结果
6. 内容应该具有教育价值，帮助学习者提升英语能力
7. 避免使用过于复杂或生僻的词汇，除非符合指定水平要求

返回格式要求：
- 必须是有效的JSON格式
- 不要包含markdown代码块标记
- 确保所有字段都正确填写`;
  }

  /**
   * 生成内容创建的用户提示词
   */
  static buildContentPrompt(params: ContentGenerationParams): string {
    const { level, goal, type, topic, wordCount } = params;

    const levelDesc = this.LEVEL_DESCRIPTIONS[level];
    const goalDesc = this.GOAL_DESCRIPTIONS[goal];
    const typeInstruction = this.CONTENT_TYPE_INSTRUCTIONS[type];

    // 根据内容类型确定默认字数
    const defaultWordCount = type === 'dialogue' ? '150-300个单词' : '200-400个单词';
    const targetWordCount = wordCount ? `约${wordCount}个单词` : defaultWordCount;

    // 构建主题相关的指令
    const topicInstruction = topic ? `\n5. 主题围绕：${topic}，确保内容与主题高度相关` : '';

    return `请为${levelDesc}的英语学习者生成${goalDesc}主题的${type === 'dialogue' ? '对话' : '文章'}内容。

要求：
1. 为内容创造一个简洁有吸引力的英文标题（不超过10个单词）
2. ${typeInstruction}
3. 内容长度：${targetWordCount}
4. 难度适合${level}水平学习者，词汇和语法结构要符合该水平要求
5. 语言自然流畅，符合英语母语者的表达习惯${topicInstruction}
7. 包含实用的词汇和表达，有助于学习者在实际场景中运用
8. 中文翻译要准确自然，帮助学习者理解内容含义
9. 内容应支持多种练习形式：阅读、听力、口语练习

请按以下JSON格式返回：
{
  "title": "内容标题（简洁有吸引力的英文标题）",
  "originalText": "英文原文",
  "translation": "中文翻译",
  "topic": "内容主题",
  "wordCount": 实际单词数,
  "estimatedReadingTime": 预估阅读时间（分钟）,
  "contentType": "${type}",
  "difficultyLevel": "${level}"
}`;
  }

  /**
   * 生成考试题目的系统提示词
   */
  static getExamSystemPrompt(): string {
    return `你是一个专业的英语考试题目生成助手。你的任务是根据用户的英语水平生成高质量的考试题目。

请遵循以下原则：
1. 题目必须有明确的正确答案，答案要准确无误
2. 难度适合指定的英语水平，不要过难或过简单
3. 题目内容实用且贴近真实语言使用场景
4. 选择题的干扰项要合理且有一定迷惑性，但不能误导学习者
5. 题目表述要清晰明确，避免歧义
6. 严格按照要求的JSON格式返回结果
7. 题目应该具有教育价值，帮助学习者检验和提升英语能力

返回格式要求：
- 必须是有效的JSON格式
- 不要包含markdown代码块标记
- 确保所有字段都正确填写`;
  }

  /**
   * 生成考试题目的用户提示词
   */
  static buildExamPrompt(params: ExamGenerationParams): string {
    const { level, examType, words, questionCount } = params;

    const examTypeDesc = this.EXAM_TYPE_INSTRUCTIONS[examType];
    const levelDesc = this.LEVEL_DESCRIPTIONS[level];

    // 构建单词相关的上下文
    let wordsContext = '';
    if (words && words.length > 0) {
      const wordList = words.slice(0, 20).map(w => w.word).join(', ');
      wordsContext = `\n重点关注以下单词：${wordList}
这些单词应该在题目中得到重点考查，可以作为题目的核心词汇或考查重点。`;
    }

    // 根据考试类型提供具体的题目类型建议
    const typeSpecificInstructions = this.getExamTypeSpecificInstructions(examType);

    return `请为${levelDesc}的英语学习者生成${questionCount}道${examTypeDesc}。

要求：
1. 题目难度适合${level}水平，词汇和语法要符合该水平要求
2. 题目类型多样化，包括：${typeSpecificInstructions}
3. 每道题目都要有明确的正确答案，答案要准确可靠
4. 题目内容实用且贴近真实语言使用场景
5. 选择题的干扰项要合理，有一定迷惑性但不误导${wordsContext}

请按以下JSON格式返回：
{
  "questions": [
    {
      "id": "题目ID（使用唯一标识符）",
      "type": "题目类型（multiple_choice/fill_blank/pronunciation/translation）",
      "question": "题目内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "correctAnswer": "正确答案",
      "difficulty": "${level}",
      "word": "关联单词（如果有）"
    }
  ]
}

注意：
- options字段仅在type为multiple_choice时需要提供
- 其他类型的题目不需要options字段
- 每个题目的id要保证唯一性`;
  }

  /**
   * 获取考试类型特定的指令
   */
  private static getExamTypeSpecificInstructions(examType: ExamType): string {
    switch (examType) {
      case 'vocabulary':
        return '选择题（词汇含义）、填空题（词汇运用）、翻译题（词汇理解）';
      case 'pronunciation':
        return '发音题（音标识别）、重音题（重音位置）、语调题（语调模式）';
      case 'comprehension':
        return '选择题（阅读理解）、填空题（语法填空）、翻译题（句子理解）';
      default:
        return '选择题、填空题、翻译题等多种题型';
    }
  }

  /**
   * 生成发音评估的系统提示词
   */
  static getPronunciationSystemPrompt(): string {
    return `你是一个专业的英语发音评估助手。你的任务是比较原文和语音识别结果，评估发音的准确性。

请遵循以下原则：
1. 客观公正地评估发音质量，不要过于严格或宽松
2. 提供具体的改进建议，指出具体的发音问题
3. 识别常见的发音错误，如元音、辅音、重音等问题
4. 给出鼓励性的反馈，帮助学习者建立信心
5. 严格按照要求的JSON格式返回结果
6. 评分要合理，反映真实的发音水平

评分标准：
- 90-100分：发音非常准确，接近母语水平
- 80-89分：发音良好，有轻微错误但不影响理解
- 70-79分：发音基本正确，有一些明显错误
- 60-69分：发音有较多错误，但基本可以理解
- 50-59分：发音错误较多，理解有困难
- 0-49分：发音错误严重，难以理解

返回格式要求：
- 必须是有效的JSON格式
- 不要包含markdown代码块标记
- 确保所有字段都正确填写`;
  }

  /**
   * 生成发音评估的用户提示词
   */
  static buildPronunciationPrompt(params: PronunciationEvaluationParams): string {
    const { originalText, spokenText, word } = params;

    const wordContext = word ? `\n重点单词：${word}（请特别关注这个单词的发音准确性）` : '';

    return `请评估以下英语发音的准确性：

原文：${originalText}
识别结果：${spokenText}${wordContext}

请从以下维度进行评估：
1. 整体准确性（0-100分）：整体发音与原文的匹配程度
2. 发音准确度（0-100分）：单词发音的准确性
3. 流利度（0-100分）：语音的流畅性和自然度
4. 语音清晰度（0-100分）：语音的清晰程度和可理解性

请按以下JSON格式返回：
{
  "overallScore": 总体分数,
  "accuracyScore": 准确度分数,
  "fluencyScore": 流利度分数,
  "pronunciationScore": 发音分数,
  "feedback": "具体的改进建议和鼓励性反馈",
  "mistakes": [
    {
      "word": "错误单词",
      "expected": "期望发音",
      "actual": "实际发音",
      "suggestion": "改进建议"
    }
  ]
}

注意：
- 如果识别结果与原文完全一致，给予高分
- 如果有轻微差异，考虑可能是语音识别的问题，适当给分
- 重点关注发音错误而不是语音识别技术问题
- 提供具体、可操作的改进建议`;
  }

  /**
   * 根据用户水平调整内容复杂度的建议
   */
  static getComplexityGuidelines(level: EnglishLevel): string {
    const guidelines = {
      A1: `
词汇：使用最常见的1000个英语单词
语法：现在时、过去时、简单句型
句长：5-10个单词
话题：日常生活、家庭、工作等基础话题`,

      A2: `
词汇：使用常见的2000个英语单词
语法：完成时、将来时、简单复合句
句长：8-15个单词
话题：旅游、购物、健康等实用话题`,

      B1: `
词汇：使用中等难度的3000-4000个单词
语法：复合句、条件句、被动语态
句长：12-20个单词
话题：教育、工作、文化等中级话题`,

      B2: `
词汇：使用较复杂的5000-6000个单词
语法：复杂句型、虚拟语气、高级时态
句长：15-25个单词
话题：社会问题、科技、环境等高级话题`,

      C1: `
词汇：使用高级词汇7000-8000个单词
语法：复杂语法结构、修辞手法
句长：20-30个单词
话题：学术、专业、抽象概念等高级话题`,

      C2: `
词汇：使用母语级别词汇，包括习语和俚语
语法：所有语法结构，包括复杂的修辞技巧
句长：不限制，自然表达
话题：任何复杂话题，包括专业和学术内容`
    };

    return guidelines[level];
  }

  /**
   * 生成话题相关的词汇建议
   */
  static getTopicVocabulary(topic: string, _level: EnglishLevel): string[] {
    // 这里可以根据话题和水平返回相关词汇
    // 简化实现，实际项目中可以扩展为更复杂的词汇库
    const topicKeywords: Record<string, string[]> = {
      'travel': ['journey', 'destination', 'accommodation', 'sightseeing', 'culture'],
      'business': ['meeting', 'presentation', 'negotiation', 'contract', 'profit'],
      'education': ['learning', 'knowledge', 'skill', 'development', 'achievement'],
      'technology': ['innovation', 'digital', 'software', 'artificial intelligence', 'automation'],
      'health': ['wellness', 'exercise', 'nutrition', 'medical', 'treatment'],
      'environment': ['sustainability', 'climate', 'pollution', 'conservation', 'renewable']
    };

    return topicKeywords[topic.toLowerCase()] || [];
  }
}