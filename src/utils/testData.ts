import { WordbookService } from '@/services/wordbook/WordbookService';

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