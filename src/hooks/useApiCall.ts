import { useCallback } from 'react';
import { useAsyncState } from './useAsyncState';
import { AppError, ErrorType } from '@/types';

interface ApiCallOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
  showLoading?: boolean;
}

/**
 * 通用API调用Hook
 * 简化API调用的状态管理和错误处理
 */
export function useApiCall<T = unknown>() {
  const asyncState = useAsyncState<T>();

  const call = useCallback(async (
    apiFunction: () => Promise<T>,
    options: ApiCallOptions = {}
  ): Promise<T | null> => {
    const { onSuccess, onError, showLoading = true } = options;

    try {
      if (showLoading) {
        asyncState.setLoading();
      }

      const result = await apiFunction();
      asyncState.setSuccess(result);
      onSuccess?.(result);
      return result;
    } catch (error) {
      let appError: AppError;
      
      if (error instanceof AppError) {
        appError = error;
      } else if (error instanceof Error) {
        // 根据错误信息判断错误类型
        let errorType: ErrorType = ErrorType.API_ERROR;
        
        if (error.message.includes('timeout')) {
          errorType = ErrorType.TIMEOUT_ERROR;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorType = ErrorType.NETWORK_ERROR;
        } else if (error.message.includes('rate limit')) {
          errorType = ErrorType.RATE_LIMIT_ERROR;
        }

        appError = new AppError({
          type: errorType,
          message: error.message,
          details: error,
          recoverable: errorType !== ErrorType.AUTHENTICATION_ERROR
        });
      } else {
        appError = new AppError({
          type: ErrorType.API_ERROR,
          message: 'Unknown API error',
          details: error,
          recoverable: true
        });
      }

      asyncState.setError(appError);
      onError?.(appError);
      return null;
    }
  }, [asyncState]);

  const retry = useCallback(async (
    lastApiFunction: () => Promise<T>,
    options: ApiCallOptions = {}
  ) => {
    return call(lastApiFunction, options);
  }, [call]);

  return {
    ...asyncState,
    call,
    retry
  };
}