import { useState, useEffect } from 'react'
import { contentClient } from '@/services/client';
import { WritingPromptItem, WritingPromptsQuery } from '@/types';

interface UseWritingPromptsResult {
  prompts: WritingPromptItem[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * 获取写作提示的自定义 Hook
 */
export function useWritingPrompts(query?: WritingPromptsQuery): UseWritingPromptsResult {
  const [prompts, setPrompts] = useState<WritingPromptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrompts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await contentClient.getWritingPrompts(query)
      setPrompts(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取写作提示失败'
      console.error('获取写作提示失败:', err)
      setError(errorMessage)
      setPrompts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [query?.writing_type, query?.difficulty_level, query?.limit, query?.offset])

  return {
    prompts,
    loading,
    error,
    refetch: fetchPrompts
  }
}