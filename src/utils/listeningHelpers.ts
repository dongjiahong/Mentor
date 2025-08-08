import { ListeningPracticeContent, UniversalContent, UserAnswer } from '@/types';

// 将UniversalContent转换为ListeningPracticeContent
export function convertToListeningContent(content: UniversalContent): ListeningPracticeContent {
  return {
    id: content.id,
    title: content.title,
    description: content.description,
    level: content.level,
    category: content.category,
    practiceType: 'comprehension',
    audioUrl: content.audioUrl || '/audio/placeholder.mp3',
    transcript: content.originalText,
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