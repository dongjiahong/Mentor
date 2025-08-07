import { useState, useEffect } from 'react';
import { learningContentService, LearningContentItem, LearningContentQuery } from '@/services/learning-content/LearningContentService';

export interface UseLearningContentResult {
  content: LearningContentItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * 学习内容数据Hook
 */
export function useLearningContent(params?: LearningContentQuery): UseLearningContentResult {
  const [content, setContent] = useState<LearningContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = params?.limit || 20;

  const fetchContent = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offset;
      
      const newContent = await learningContentService.getLearningContent({
        ...params,
        limit,
        offset: currentOffset,
      });

      if (reset) {
        setContent(newContent);
        setOffset(newContent.length);
      } else {
        setContent(prev => [...prev, ...newContent]);
        setOffset(prev => prev + newContent.length);
      }

      // 如果返回的内容少于请求的limit，说明没有更多数据了
      setHasMore(newContent.length === limit);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取学习内容失败';
      setError(errorMessage);
      console.error('获取学习内容失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    setOffset(0);
    await fetchContent(true);
  };

  const loadMore = async () => {
    if (!loading && hasMore) {
      await fetchContent(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    let isActive = true;

    const initializeData = async () => {
      try {
        // 先尝试获取现有内容
        await fetchContent(true);
        
        // 如果没有内容，则初始化示例数据
        if (isActive) {
          const contentAfterFetch = await learningContentService.getLearningContent({ limit: 1 });
          if (contentAfterFetch.length === 0) {
            await learningContentService.initializeSampleContent();
            // 重新获取数据
            await fetchContent(true);
          }
        }
      } catch (err) {
        console.error('初始化学习内容失败:', err);
      }
    };

    initializeData();

    return () => {
      isActive = false;
    };
  }, []);

  // 当params改变时重新获取数据
  useEffect(() => {
    refetch();
  }, [JSON.stringify(params)]);

  return {
    content,
    loading,
    error,
    refetch,
    hasMore,
    loadMore,
  };
}