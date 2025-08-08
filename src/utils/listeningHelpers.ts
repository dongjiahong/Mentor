import { ListeningPracticeContent, UniversalContent, UserAnswer, ListeningSentence } from '@/types';

// 将UniversalContent转换为ListeningPracticeContent
export function convertToListeningContent(content: UniversalContent): ListeningPracticeContent {
  const transcript = content.originalText;
  const translation = content.translation;
  const sentences = transcript ? createListeningSentences(transcript, translation) : [];
  
  return {
    id: content.id,
    title: content.title,
    description: content.description,
    level: content.level,
    category: content.category,
    practiceType: 'comprehension',
    audioUrl: content.audioUrl || '/audio/placeholder.mp3',
    transcript,
    sentences: setSentenceTimestamps(sentences),
    duration: content.estimatedDuration * 60, // 转换为秒
    questions: [], // 可以根据内容动态生成问题
    estimatedDuration: content.estimatedDuration,
    playbackSpeed: [0.75, 1.0, 1.25],
    difficulty: 3
  };
}

// 格式化时间显示
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// 计算答题得分
export function calculateScore(userAnswers: Map<string, UserAnswer>, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  
  const correctAnswers = Array.from(userAnswers.values()).filter(answer => answer.isCorrect).length;
  return Math.round((correctAnswers / totalQuestions) * 100);
}

// 将文本切分为句子
export function splitTextIntoSentences(text: string): string[] {
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

// 创建听力句子对象数组
export function createListeningSentences(text: string, translation?: string): ListeningSentence[] {
  const sentences = splitTextIntoSentences(text);
  const translations = translation ? splitTextIntoSentences(translation) : [];
  
  return sentences.map((sentence, index) => ({
    id: `sentence-${index}`,
    text: sentence.trim(),
    translation: translations[index]?.trim(),
    isRevealed: false,
    hasBeenPlayed: false
  }));
}

// 计算两个字符串的相似度（使用简化的编辑距离算法）
export function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const str1 = text1.toLowerCase().trim();
  const str2 = text2.toLowerCase().trim();
  
  if (str1 === str2) return 100;
  
  // 计算编辑距离
  const distance = calculateEditDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 100;
  
  const similarity = ((maxLength - distance) / maxLength) * 100;
  return Math.max(0, Math.round(similarity));
}

// 计算编辑距离（Levenshtein距离）
function calculateEditDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null)
    .map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // 插入
        matrix[j - 1][i] + 1,     // 删除
        matrix[j - 1][i - 1] + indicator  // 替换
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// 根据文本长度估算TTS播放时间（毫秒）
export function estimateSentenceDuration(text: string, playbackRate: number = 1.0): number {
  if (!text) return 0;
  
  // 基于平均每分钟150-200个单词的语速估算
  const wordsPerMinute = 175;
  const words = text.split(/\s+/).length;
  const baseDurationMs = (words / wordsPerMinute) * 60 * 1000;
  
  // 考虑播放速度
  return Math.round(baseDurationMs / playbackRate);
}

// 为句子数组设置预估时间戳
export function setSentenceTimestamps(sentences: ListeningSentence[], playbackRate: number = 1.0): ListeningSentence[] {
  let currentTime = 0;
  
  return sentences.map(sentence => {
    const duration = estimateSentenceDuration(sentence.text, playbackRate);
    const startTime = currentTime;
    const endTime = currentTime + duration;
    
    currentTime = endTime + 500; // 500ms 句间停顿
    
    return {
      ...sentence,
      startTime,
      endTime
    };
  });
}