import { 
  VoicePracticeContent, 
  DialoguePracticeScenario, 
  VoicePracticeSentence, 
  DialogueItem,
  EnglishLevel,
  LearningContentItem
} from '@/types';

/**
 * 将数据库中的学习内容转换为语音练习内容格式
 */
export function convertToVoicePracticeContent(dbContent: LearningContentItem): VoicePracticeContent | null {
  if (dbContent.content_type === 'dialogue') {
    return null; // 对话类型用另一个转换函数
  }

  // 将文本分割成句子
  const sentences = convertTextToSentences(dbContent.original_text, dbContent.translation);

  return {
    id: `db_${dbContent.id}`,
    title: dbContent.topic || `学习内容 ${dbContent.id}`,
    description: `${dbContent.content_type === 'article' ? '文章' : '混合'}内容 - ${dbContent.difficulty_level}级别`,
    level: mapDifficultyToLevel(dbContent.difficulty_level),
    category: dbContent.topic || '通用',
    practiceType: 'sentence_repeat',
    sentences,
    estimatedDuration: dbContent.estimated_reading_time || estimateReadingTime(dbContent.original_text)
  };
}

/**
 * 将数据库中的学习内容转换为对话练习场景格式
 */
export function convertToDialoguePracticeScenario(dbContent: LearningContentItem): DialoguePracticeScenario | null {
  if (dbContent.content_type !== 'dialogue') {
    return null; // 非对话类型用另一个转换函数
  }

  const conversations = convertDialogueText(dbContent.original_text, dbContent.translation);

  return {
    id: `db_dialogue_${dbContent.id}`,
    title: dbContent.topic || `对话练习 ${dbContent.id}`,
    description: `对话练习 - ${dbContent.difficulty_level}级别`,
    level: mapDifficultyToLevel(dbContent.difficulty_level),
    category: dbContent.topic || '日常对话',
    conversations
  };
}

/**
 * 将文本转换为句子数组
 */
function convertTextToSentences(originalText: string, translation: string): VoicePracticeSentence[] {
  // 使用和 listeningHelpers.ts 相同的句子分割逻辑
  const englishSentences = splitTextIntoSentences(originalText);
  const chineseSentences = splitTextIntoSentences(translation);

  // 创建句子数组，尽量一一对应
  const sentences: VoicePracticeSentence[] = [];
  const maxLength = Math.max(englishSentences.length, chineseSentences.length);

  for (let i = 0; i < maxLength; i++) {
    const englishText = englishSentences[i] || '';
    const chineseText = chineseSentences[i] || '';
    
    if (englishText) {
      sentences.push({
        id: `sentence_${i + 1}`,
        text: englishText,
        translation: chineseText,
        difficulty: estimateSentenceDifficulty(englishText),
        tips: generateTips(englishText)
      });
    }
  }

  return sentences;
}

/**
 * 分割文本为句子（保留标点符号）
 */
function splitTextIntoSentences(text: string): string[] {
  if (!text) return [];
  
  // 先按换行符分割，处理对话格式
  const lines = text.split(/\n+/).filter(line => line.trim().length > 0);
  
  const sentences: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // 如果是对话格式（A: 或 B: 开头），直接作为一句
    if (/^[A-Z]:\s/.test(trimmedLine)) {
      sentences.push(trimmedLine);
      continue;
    }
    
    // 按句号、问号、感叹号分割（同时处理中英文标点），保留标点符号
    // 使用负向前瞻来避免分割 a.m. 和 p.m.，中文不需要空格
    const lineSentences = trimmedLine.split(/(?<=[.!?。！？])(?!\s*m\.)\s*/).filter(s => s.trim().length > 0);
    
    // 如果没有标点符号分割，整行作为一句
    if (lineSentences.length === 1 && !trimmedLine.match(/[.!?。！？]$/)) {
      sentences.push(trimmedLine);
    } else {
      sentences.push(...lineSentences.map(s => s.trim()));
    }
  }
  
  return sentences.filter(sentence => sentence.length > 0);
}

/**
 * 将对话文本转换为对话项数组
 */
function convertDialogueText(originalText: string, translation: string): DialogueItem[] {
  const conversations: DialogueItem[] = [];
  
  // 按行分割原文和译文
  const englishLines = originalText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const chineseLines = translation.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  englishLines.forEach((line, index) => {
    // 检查是否是对话格式 (A: 或 B: 开头)
    const match = line.match(/^([AB]):\s*(.+)$/);
    if (match) {
      const speaker = match[1];
      const text = match[2];
      const chineseText = chineseLines[index] ? chineseLines[index].replace(/^[AB]:\s*/, '') : '';

      conversations.push({
        id: `dialogue_${index + 1}`,
        speaker: speaker === 'A' ? 'system' : 'user',
        text,
        translation: chineseText,
        expectedResponse: speaker === 'A' ? undefined : text,
        hints: generateDialogueHints(text)
      });
    } else {
      // 如果不是标准对话格式，交替分配给system和user
      conversations.push({
        id: `dialogue_${index + 1}`,
        speaker: index % 2 === 0 ? 'system' : 'user',
        text: line,
        translation: chineseLines[index] || '',
        expectedResponse: index % 2 === 1 ? line : undefined
      });
    }
  });

  return conversations;
}

/**
 * 将难度级别字符串映射为EnglishLevel类型
 */
function mapDifficultyToLevel(difficultyLevel: string): EnglishLevel {
  const levelMap: Record<string, EnglishLevel> = {
    'A1': 'A1',
    'A2': 'A2',
    'B1': 'B1',
    'B2': 'B2',
    'C1': 'C1',
    'C2': 'C2'
  };

  return levelMap[difficultyLevel.toUpperCase()] || 'B1';
}

/**
 * 估算句子难度 (1-5)
 */
function estimateSentenceDifficulty(text: string): number {
  const wordCount = text.split(' ').length;
  const avgWordLength = text.replace(/[^a-zA-Z]/g, '').length / wordCount;
  
  // 根据单词数量和平均单词长度估算难度
  if (wordCount <= 8 && avgWordLength <= 4) return 1;
  if (wordCount <= 12 && avgWordLength <= 5) return 2;
  if (wordCount <= 16 && avgWordLength <= 6) return 3;
  if (wordCount <= 20 && avgWordLength <= 7) return 4;
  return 5;
}

/**
 * 估算阅读时间（分钟）
 */
function estimateReadingTime(text: string): number {
  const wordCount = text.split(' ').length;
  const wordsPerMinute = 200; // 平均阅读速度
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * 为句子生成学习提示
 */
function generateTips(text: string): string {
  // 检查是否包含常见的需要注意的词汇
  const complexWords = [
    'revolutionized', 'essential', 'sustainable', 'renewable', 'technology',
    'communication', 'information', 'professional', 'development', 'environment'
  ];

  const foundComplexWord = complexWords.find(word => 
    text.toLowerCase().includes(word.toLowerCase())
  );

  if (foundComplexWord) {
    return `注意 "${foundComplexWord}" 的发音和含义`;
  }

  // 根据句子长度给出一般性提示
  if (text.split(' ').length > 15) {
    return '这是一个较长的句子，注意断句和语调';
  }

  return '注意语音语调的自然流畅';
}

/**
 * 为对话生成提示
 */
function generateDialogueHints(text: string): string[] {
  const hints: string[] = [];
  
  // 根据对话内容给出相关提示
  if (text.toLowerCase().includes('good morning')) {
    hints.push('注意问候语的语音语调');
  }
  
  if (text.includes('?')) {
    hints.push('这是一个问句，注意升调');
  }
  
  if (text.toLowerCase().includes('please')) {
    hints.push('礼貌用语，语气要温和');
  }

  return hints.length > 0 ? hints : ['注意自然的对话语调'];
}