import { useState, useCallback } from 'react';
import { AsyncState, AsyncStatus, AppError } from '@/types';

/**
 * 通用异步状态管理Hook
 * 简化异步操作的状态管理模式
 */
export function useAsyncState<T = unknown>(initialData?: T) {
  const [state, setState] = useState<AsyncState<T>>({
    status: 'idle',
    data: initialData,
    error: undefined
  });

  const setLoading = useCallback(() => {
    setState(prev => ({ ...prev, status: 'loading', error: undefined }));
  }, []);

  const setSuccess = useCallback((data: T) => {
    setState({ status: 'success', data, error: undefined });
  }, []);

  const setError = useCallback((error: AppError) => {
    setState(prev => ({ ...prev, status: 'error', error, data: prev.data }));
  }, []);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      data: initialData,
      error: undefined
    });
  }, [initialData]);

  const execute = useCallback(async <R = T>(
    asyncFunction: () => Promise<R>,
    onSuccess?: (data: R) => void,
    onError?: (error: AppError) => void
  ): Promise<R | null> => {
    try {
      setLoading();
      const result = await asyncFunction();
      setSuccess(result as unknown as T);
      onSuccess?.(result);
      return result;
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError({
        type: 'API_ERROR' as any,
        message: error instanceof Error ? error.message : 'Unknown error',
        recoverable: true
      });
      setError(appError);
      onError?.(appError);
      return null;
    }
  }, [setLoading, setSuccess, setError]);

  return {
    ...state,
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
    isIdle: state.status === 'idle',
    setLoading,
    setSuccess,
    setError,
    reset,
    execute
  };
}