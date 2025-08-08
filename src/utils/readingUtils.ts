import { UniversalContent, ReadingPracticeContent } from '@/types';

/**
 * 将UniversalContent转换为ReadingPracticeContent
 */
export function convertToReadingContent(content: UniversalContent): ReadingPracticeContent {
  return {
    id: content.id,
    title: content.title,
    description: content.description,
    level: content.level,
    category: content.category,
    practiceType: 'comprehension',
    text: content.originalText || '',
    wordCount: content.wordCount || 0,
    questions: [],
    vocabulary: [],
    estimatedDuration: content.estimatedDuration,
    difficulty: 3
  };
}