import { useState, useEffect, useCallback } from 'react';
import { WordbookService } from '@/services/wordbook/WordbookService';
import { 
  Word, 
  WordAddReason, 
  WordQueryParams,
  AppError,
  ErrorType 
} from '@/types';

interface WordbookStats {
  totalWords: number;
  masteredWords: number;
  needReviewWords: number;
  wordsByReason: Record<WordAddReason, number>;
  wordsByProficiency: Record<number, number>;
}

interface UseWordbookReturn {
  // 状态
  words: Word[];
  reviewWords: Word[];
  stats: WordbookStats | null;
  loading: boolean;
  error: AppError | null;

  // 单词管理方法
  addWord: (word: string, definition: string, addReason: WordAddReason, pronunciation?: string) => Promise<Word | null>;
  getWord: (id: number) => Promise<Word | null>;
  getWordByText: (word: string) => Promise<Word | null>;
  updateWordProficiency: (wordId: number, accuracyScore: number, timeSpent?: number) => Promise<Word | null>;
  setWordProficiency: (wordId: number, proficiencyLevel: number) => Promise<Word | null>;
  markWordAsMastered: (wordId: number) => Promise<Word | null>;
  resetWordProgress: (wordId: number) => Promise<Word | null>;
  removeWord: (wordId: number) => Promise<boolean>;
  updateWordDefinition: (wordId: number, definition: string) => Promise<Word | null>;
  updateWordPronunciation: (wordId: number, pronunciation: string) => Promise<Word | null>;

  // 查询方法
  loadWords: (params?: WordQueryParams) => Promise<void>;
  loadReviewWords: () => Promise<void>;
  loadStats: () => Promise<void>;
  searchWords: (query: string) => Promise<Word[]>;

  // 复习相关方法
  getRecommendedReviewWords: (limit?: number) => Promise<Word[]>;
  batchUpdateReviewStatus: (wordIds: number[], accuracyScores: number[]) => Promise<Word[]>;
  getTodayReviewQueue: () => Promise<Word[]>;
  processReviewResult: (wordId: number, result: 'unknown' | 'familiar' | 'known') => Promise<Word | null>;

  // 工具方法
  refresh: () => Promise<void>;
  clearError: () => void;
}

/**
 * 单词本Hook
 * 提供单词本相关的状态管理和操作方法
 */
export function useWordbook(): UseWordbookReturn {
  const [wordbookService] = useState(() => new WordbookService());
  const [words, setWords] = useState<Word[]>([]);
  const [reviewWords, setReviewWords] = useState<Word[]>([]);
  const [stats, setStats] = useState<WordbookStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // 加载初始数据
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const wordsList = await wordbookService.getWordsList();
      setWords(wordsList);
      
      const reviewWordsList = await wordbookService.getWordsForReview();
      setReviewWords(reviewWordsList);
      
      const statsData = await wordbookService.getWordStats();
      setStats(statsData);
    } catch (err) {
      const appError = err instanceof AppError ? err : new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: '加载初始数据失败',
        details: err
      });
      setError(appError);
    } finally {
      setLoading(false);
    }
  }, [wordbookService]);

  // 初始化服务
  useEffect(() => {
    let isMounted = true;
    
    const initService = async () => {
      try {
        setLoading(true);
        await wordbookService.initialize();
        
        if (isMounted) {
          await loadInitialData();
        }
      } catch (err) {
        if (isMounted) {
          setError(new AppError({
            type: ErrorType.DATABASE_ERROR,
            message: '初始化单词本服务失败',
            details: err
          }));
          setLoading(false);
        }
      }
    };

    initService();
    
    return () => {
      isMounted = false;
    };
  }, [wordbookService, loadInitialData]);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 错误处理包装器
  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T | null> => {
    try {
      setError(null);
      return await operation();
    } catch (err) {
      const appError = err instanceof AppError ? err : new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: errorMessage,
        details: err
      });
      setError(appError);
      return null;
    }
  }, []);

  // ==================== 单词管理方法 ====================

  const addWord = useCallback(async (
    word: string,
    definition: string,
    addReason: WordAddReason,
    pronunciation?: string
  ): Promise<Word | null> => {
    return withErrorHandling(async () => {
      const newWord = await wordbookService.smartAddWord(word, definition, addReason, pronunciation);
      
      // 更新本地状态
      setWords(prev => {
        const existingIndex = prev.findIndex(w => w.id === newWord.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newWord;
          return updated;
        } else {
          return [newWord, ...prev];
        }
      });

      // 如果是新单词且需要复习，添加到复习列表
      if (newWord.nextReviewAt && new Date(newWord.nextReviewAt) <= new Date()) {
        setReviewWords(prev => {
          const exists = prev.some(w => w.id === newWord.id);
          return exists ? prev : [newWord, ...prev];
        });
      }

      // 更新统计信息
      await loadStats();
      
      return newWord;
    }, '添加单词失败');
  }, [wordbookService, withErrorHandling]);

  const getWord = useCallback(async (id: number): Promise<Word | null> => {
    return withErrorHandling(async () => {
      return await wordbookService.getWord(id);
    }, '获取单词失败');
  }, [wordbookService, withErrorHandling]);

  const getWordByText = useCallback(async (word: string): Promise<Word | null> => {
    return withErrorHandling(async () => {
      return await wordbookService.getWordByText(word);
    }, '查找单词失败');
  }, [wordbookService, withErrorHandling]);

  const updateWordProficiency = useCallback(async (
    wordId: number,
    accuracyScore: number,
    timeSpent?: number
  ): Promise<Word | null> => {
    return withErrorHandling(async () => {
      const updatedWord = await wordbookService.updateWordProficiency(wordId, accuracyScore, timeSpent);
      
      // 更新本地状态
      setWords(prev => prev.map(w => w.id === wordId ? updatedWord : w));
      setReviewWords(prev => {
        const filtered = prev.filter(w => w.id !== wordId);
        // 如果还需要复习，保留在复习列表中
        if (updatedWord.nextReviewAt && new Date(updatedWord.nextReviewAt) <= new Date()) {
          return [updatedWord, ...filtered];
        }
        return filtered;
      });

      // 更新统计信息
      await loadStats();
      
      return updatedWord;
    }, '更新单词熟练度失败');
  }, [wordbookService, withErrorHandling]);

  const setWordProficiency = useCallback(async (
    wordId: number,
    proficiencyLevel: number
  ): Promise<Word | null> => {
    return withErrorHandling(async () => {
      const updatedWord = await wordbookService.setWordProficiency(wordId, proficiencyLevel);
      
      // 更新本地状态
      setWords(prev => prev.map(w => w.id === wordId ? updatedWord : w));
      setReviewWords(prev => prev.map(w => w.id === wordId ? updatedWord : w));

      // 更新统计信息
      await loadStats();
      
      return updatedWord;
    }, '设置单词熟练度失败');
  }, [wordbookService, withErrorHandling]);

  const markWordAsMastered = useCallback(async (wordId: number): Promise<Word | null> => {
    return setWordProficiency(wordId, 5);
  }, [setWordProficiency]);

  const resetWordProgress = useCallback(async (wordId: number): Promise<Word | null> => {
    return setWordProficiency(wordId, 0);
  }, [setWordProficiency]);

  const removeWord = useCallback(async (wordId: number): Promise<boolean> => {
    const result = await withErrorHandling(async () => {
      await wordbookService.removeWordFromBook(wordId);
      return true;
    }, '删除单词失败');

    if (result) {
      // 更新本地状态
      setWords(prev => prev.filter(w => w.id !== wordId));
      setReviewWords(prev => prev.filter(w => w.id !== wordId));
      
      // 更新统计信息
      await loadStats();
    }

    return result !== null;
  }, [wordbookService, withErrorHandling]);

  const updateWordDefinition = useCallback(async (
    wordId: number,
    definition: string
  ): Promise<Word | null> => {
    return withErrorHandling(async () => {
      const updatedWord = await wordbookService.updateWordDefinition(wordId, definition);
      
      // 更新本地状态
      setWords(prev => prev.map(w => w.id === wordId ? updatedWord : w));
      setReviewWords(prev => prev.map(w => w.id === wordId ? updatedWord : w));
      
      return updatedWord;
    }, '更新单词定义失败');
  }, [wordbookService, withErrorHandling]);

  const updateWordPronunciation = useCallback(async (
    wordId: number,
    pronunciation: string
  ): Promise<Word | null> => {
    return withErrorHandling(async () => {
      const updatedWord = await wordbookService.updateWordPronunciation(wordId, pronunciation);
      
      // 更新本地状态
      setWords(prev => prev.map(w => w.id === wordId ? updatedWord : w));
      setReviewWords(prev => prev.map(w => w.id === wordId ? updatedWord : w));
      
      return updatedWord;
    }, '更新单词发音失败');
  }, [wordbookService, withErrorHandling]);

  // ==================== 查询方法 ====================

  const loadWords = useCallback(async (params?: WordQueryParams): Promise<void> => {
    const result = await withErrorHandling(async () => {
      setLoading(true);
      const wordsList = await wordbookService.getWordsList(params);
      setWords(wordsList);
      return true;
    }, '加载单词列表失败');
    
    if (result !== null) {
      setLoading(false);
    }
  }, [wordbookService, withErrorHandling]);

  const loadReviewWords = useCallback(async (): Promise<void> => {
    await withErrorHandling(async () => {
      const reviewWordsList = await wordbookService.getWordsForReview();
      setReviewWords(reviewWordsList);
    }, '加载复习单词失败');
  }, [wordbookService, withErrorHandling]);

  const loadStats = useCallback(async (): Promise<void> => {
    await withErrorHandling(async () => {
      const statsData = await wordbookService.getWordStats();
      setStats(statsData);
    }, '加载统计信息失败');
  }, [wordbookService, withErrorHandling]);

  const searchWords = useCallback(async (query: string): Promise<Word[]> => {
    const result = await withErrorHandling(async () => {
      return await wordbookService.getWordsList({ search: query, limit: 50 });
    }, '搜索单词失败');
    
    return result || [];
  }, [wordbookService, withErrorHandling]);

  // ==================== 复习相关方法 ====================

  const getRecommendedReviewWords = useCallback(async (limit: number = 20): Promise<Word[]> => {
    const result = await withErrorHandling(async () => {
      return await wordbookService.getRecommendedReviewWords(limit);
    }, '获取推荐复习单词失败');
    
    return result || [];
  }, [wordbookService, withErrorHandling]);

  const batchUpdateReviewStatus = useCallback(async (
    wordIds: number[],
    accuracyScores: number[]
  ): Promise<Word[]> => {
    const result = await withErrorHandling(async () => {
      const updatedWords = await wordbookService.batchUpdateReviewStatus(wordIds, accuracyScores);
      
      // 更新本地状态
      setWords(prev => prev.map(word => {
        const updated = updatedWords.find(w => w.id === word.id);
        return updated || word;
      }));

      // 更新复习列表
      await loadReviewWords();
      
      // 更新统计信息
      await loadStats();
      
      return updatedWords;
    }, '批量更新复习状态失败');
    
    return result || [];
  }, [withErrorHandling, wordbookService, loadReviewWords, loadStats]);

  // 获取今日复习队列
  const getTodayReviewQueue = useCallback(async (): Promise<Word[]> => {
    const result = await withErrorHandling(async () => {
      return await wordbookService.getTodayReviewQueue();
    }, '获取今日复习队列失败');
    
    return result || [];
  }, [wordbookService, withErrorHandling]);

  // 处理复习结果
  const processReviewResult = useCallback(async (
    wordId: number, 
    result: 'unknown' | 'familiar' | 'known'
  ): Promise<Word | null> => {
    return withErrorHandling(async () => {
      const updatedWord = await wordbookService.processReviewResult(wordId, result);
      
      // 更新本地状态
      setWords(prev => prev.map(w => w.id === wordId ? updatedWord : w));
      setReviewWords(prev => {
        const filtered = prev.filter(w => w.id !== wordId);
        // 根据复习结果决定是否保留在复习列表中
        if (result === 'unknown' || result === 'familiar') {
          return [...filtered, updatedWord];
        }
        return filtered;
      });

      // 更新统计信息
      await loadStats();
      
      return updatedWord;
    }, '处理复习结果失败');
  }, [withErrorHandling, wordbookService, loadStats]);

  // ==================== 工具方法 ====================

  const refresh = useCallback(async (): Promise<void> => {
    await loadInitialData();
  }, [loadInitialData]);

  return {
    // 状态
    words,
    reviewWords,
    stats,
    loading,
    error,

    // 单词管理方法
    addWord,
    getWord,
    getWordByText,
    updateWordProficiency,
    setWordProficiency,
    markWordAsMastered,
    resetWordProgress,
    removeWord,
    updateWordDefinition,
    updateWordPronunciation,

    // 查询方法
    loadWords,
    loadReviewWords,
    loadStats,
    searchWords,

    // 复习相关方法
    getRecommendedReviewWords,
    batchUpdateReviewStatus,
    getTodayReviewQueue,
    processReviewResult,

    // 工具方法
    refresh,
    clearError
  };
}