/**
 * 单词本服务演示
 * 展示如何使用WordbookService和MemoryAlgorithm
 */

import { WordbookService } from './WordbookService';
import { MemoryAlgorithm } from './MemoryAlgorithm';
import { StorageService } from '../storage/StorageService';

/**
 * 演示单词本基础功能
 */
export async function demonstrateBasicWordbook() {
  console.log('=== 单词本基础功能演示 ===');
  
  // 初始化服务
  const storageService = new StorageService();
  const wordbookService = new WordbookService(storageService);
  
  try {
    await wordbookService.initialize();
    console.log('✅ 单词本服务初始化成功');

    // 1. 添加单词
    console.log('\n1. 添加单词到单词本');
    
    const word1 = await wordbookService.addWordFromTranslationLookup(
      'hello', 
      '你好；问候', 
      '/həˈloʊ/'
    );
    console.log('添加翻译查询单词:', word1.word, '-', word1.definition);

    const word2 = await wordbookService.addWordFromPronunciationError(
      'world', 
      '世界；全球', 
      '/wɜːrld/'
    );
    console.log('添加发音错误单词:', word2.word, '-', word2.definition);

    const word3 = await wordbookService.addWordFromListeningDifficulty(
      'difficult', 
      '困难的；艰难的'
    );
    console.log('添加听力困难单词:', word3.word, '-', word3.definition);

    // 2. 智能添加（检查重复）
    console.log('\n2. 智能添加单词（检查重复）');
    
    const duplicateWord = await wordbookService.smartAddWord(
      'hello', 
      '你好；问候；打招呼', 
      'pronunciation_error' // 更高优先级
    );
    console.log('智能添加结果:', duplicateWord.word, '- 添加原因:', duplicateWord.addReason);

    // 3. 查询单词
    console.log('\n3. 查询单词');
    
    const foundWord = await wordbookService.getWordByText('world');
    if (foundWord) {
      console.log('找到单词:', foundWord.word, '- 熟练度:', foundWord.proficiencyLevel);
    }

    // 4. 获取统计信息
    console.log('\n4. 获取统计信息');
    
    const stats = await wordbookService.getWordStats();
    console.log('总单词数:', stats.totalWords);
    console.log('掌握单词数:', stats.masteredWords);
    console.log('需要复习单词数:', stats.needReviewWords);
    console.log('按添加原因分组:', stats.wordsByReason);
    console.log('按熟练度分组:', stats.wordsByProficiency);

    // 5. 更新熟练度
    console.log('\n5. 更新单词熟练度');
    
    const updatedWord = await wordbookService.updateWordProficiency(
      word1.id, 
      0.85, // 85%准确率
      3000  // 3秒响应时间
    );
    console.log('更新后熟练度:', updatedWord.proficiencyLevel);
    console.log('下次复习时间:', updatedWord.nextReviewAt);

    // 6. 获取复习单词
    console.log('\n6. 获取需要复习的单词');
    
    const reviewWords = await wordbookService.getWordsForReview();
    console.log('需要复习的单词数量:', reviewWords.length);
    reviewWords.forEach(word => {
      console.log(`- ${word.word}: 熟练度 ${word.proficiencyLevel}, 复习次数 ${word.reviewCount}`);
    });

    // 7. 获取推荐复习单词
    console.log('\n7. 获取推荐复习单词');
    
    const recommendedWords = await wordbookService.getRecommendedReviewWords(5);
    console.log('推荐复习单词数量:', recommendedWords.length);
    recommendedWords.forEach(word => {
      console.log(`- ${word.word}: 熟练度 ${word.proficiencyLevel}`);
    });

    console.log('\n✅ 单词本基础功能演示完成');
    
  } catch (error) {
    console.error('❌ 演示过程中出现错误:', error);
  } finally {
    wordbookService.close();
  }
}

/**
 * 演示记忆曲线算法
 */
export function demonstrateMemoryAlgorithm() {
  console.log('\n=== 记忆曲线算法演示 ===');

  // 1. 基础间隔计算
  console.log('\n1. 基础间隔计算');
  
  for (let level = 0; level <= 5; level++) {
    const nextReview = MemoryAlgorithm.calculateBasicNextReview(level);
    const now = new Date();
    const daysDiff = Math.round((nextReview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`熟练度 ${level}: ${daysDiff}天后复习 (${MemoryAlgorithm.getIntervalDescription(daysDiff)})`);
  }

  // 2. SuperMemo算法演示
  console.log('\n2. SuperMemo算法演示');
  
  let memoryState = MemoryAlgorithm.createDefaultMemoryState();
  console.log('初始状态:', {
    proficiencyLevel: memoryState.proficiencyLevel,
    easinessFactor: memoryState.easinessFactor.toFixed(2),
    interval: memoryState.interval
  });

  // 模拟几次学习
  const reviewResults = [
    { wordId: 1, accuracyScore: 0.9, responseTime: 1500, difficulty: 2 }, // 优秀
    { wordId: 1, accuracyScore: 0.7, responseTime: 3000, difficulty: 3 }, // 一般
    { wordId: 1, accuracyScore: 0.95, responseTime: 1000, difficulty: 1 }, // 完美
    { wordId: 1, accuracyScore: 0.3, responseTime: 8000, difficulty: 4 }   // 较差
  ];

  reviewResults.forEach((result, index) => {
    memoryState = MemoryAlgorithm.calculateSuperMemoNextReview(memoryState, result);
    console.log(`第${index + 1}次学习后:`, {
      准确率: `${(result.accuracyScore * 100).toFixed(0)}%`,
      熟练度: memoryState.proficiencyLevel,
      简易因子: memoryState.easinessFactor.toFixed(2),
      间隔天数: memoryState.interval,
      重复次数: memoryState.repetitions
    });
  });

  // 3. 学习建议
  console.log('\n3. 学习建议');
  
  const advice = MemoryAlgorithm.getLearningAdvice(memoryState);
  console.log('当前建议:', advice);

  // 4. 遗忘概率
  console.log('\n4. 遗忘概率计算');
  
  const forgettingProb = MemoryAlgorithm.calculateForgettingProbability(memoryState);
  console.log('遗忘概率:', `${(forgettingProb * 100).toFixed(1)}%`);

  // 5. 优先级计算
  console.log('\n5. 复习优先级计算');
  
  const priority = MemoryAlgorithm.calculateReviewPriority(memoryState);
  console.log('复习优先级:', priority.toFixed(2));

  console.log('\n✅ 记忆曲线算法演示完成');
}

/**
 * 演示批量操作
 */
export async function demonstrateBatchOperations() {
  console.log('\n=== 批量操作演示 ===');
  
  const storageService = new StorageService();
  const wordbookService = new WordbookService(storageService);
  
  try {
    await wordbookService.initialize();

    // 添加多个单词
    console.log('\n1. 批量添加单词');
    
    const words = [
      { word: 'apple', definition: '苹果', reason: 'translation_lookup' as const },
      { word: 'banana', definition: '香蕉', reason: 'pronunciation_error' as const },
      { word: 'orange', definition: '橙子', reason: 'listening_difficulty' as const },
      { word: 'grape', definition: '葡萄', reason: 'translation_lookup' as const },
      { word: 'strawberry', definition: '草莓', reason: 'pronunciation_error' as const }
    ];

    const addedWords = [];
    for (const wordData of words) {
      const word = await wordbookService.smartAddWord(
        wordData.word, 
        wordData.definition, 
        wordData.reason
      );
      addedWords.push(word);
      console.log(`添加: ${word.word} - ${word.definition}`);
    }

    // 批量更新复习状态
    console.log('\n2. 批量更新复习状态');
    
    const wordIds = addedWords.map(w => w.id);
    const accuracyScores = [0.9, 0.7, 0.85, 0.6, 0.95]; // 模拟不同的准确率

    const updatedWords = await wordbookService.batchUpdateReviewStatus(wordIds, accuracyScores);
    
    updatedWords.forEach((word, index) => {
      console.log(`${word.word}: 准确率 ${(accuracyScores[index] * 100).toFixed(0)}% -> 熟练度 ${word.proficiencyLevel}`);
    });

    // 获取最终统计
    console.log('\n3. 最终统计信息');
    
    const finalStats = await wordbookService.getWordStats();
    console.log('总单词数:', finalStats.totalWords);
    console.log('按熟练度分组:', finalStats.wordsByProficiency);

    console.log('\n✅ 批量操作演示完成');
    
  } catch (error) {
    console.error('❌ 批量操作演示出现错误:', error);
  } finally {
    wordbookService.close();
  }
}

/**
 * 运行所有演示
 */
export async function runAllDemos() {
  console.log('🚀 开始单词本服务演示\n');
  
  await demonstrateBasicWordbook();
  demonstrateMemoryAlgorithm();
  await demonstrateBatchOperations();
  
  console.log('\n🎉 所有演示完成！');
}

// 如果直接运行此文件，执行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllDemos().catch(console.error);
}