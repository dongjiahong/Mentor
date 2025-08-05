import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  DictionaryService, 
  WordDefinition, 
  AppError, 
  ErrorType,
  AsyncState 
} from '@/types';
import { 
  DictionaryServiceFactory, 
  DictionaryConfigManager,
  DictionaryConfig 
} from '@/services';

// 词典Hook状态接口
interface DictionaryState {
  service: DictionaryService | null;
  config: DictionaryConfig | null;
  isConfigured: boolean;
  isLoading: boolean;
  error: AppError | null;
}

// 查询状态接口
interface QueryState extends AsyncState<WordDefinition> {
  word?: string;
}

/**
 * 词典服务Hook
 * 提供词典服务的初始化、配置管理和单词查询功能
 */
export function useDictionary() {
  const [state, setState] = useState<DictionaryState>({
    service: null,
    config: null,
    isConfigured: false,
    isLoading: true,
    error: null,
  });

  const [queryState, setQueryState] = useState<QueryState>({
    status: 'idle',
  });

  // 使用ref来避免重复初始化
  const initializationRef = useRef(false);

  /**
   * 初始化词典服务
   */
  const initializeService = useCallback(async () => {
    if (initializationRef.current) {
      return;
    }

    initializationRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let config = DictionaryConfigManager.getConfig();
      let isConfigured = DictionaryConfigManager.isConfigured();

      // 如果没有配置，自动创建默认的模拟服务配置
      if (!config || !isConfigured) {
        const defaultConfig = DictionaryConfigManager.getDefaultConfig();
        config = DictionaryConfigManager.saveConfig(defaultConfig);
        isConfigured = true;
      }

      const service = await DictionaryServiceFactory.createService(config);
      setState({
        service,
        config,
        isConfigured: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('初始化词典服务失败:', error);
      setState({
        service: null,
        config: null,
        isConfigured: false,
        isLoading: false,
        error: error instanceof AppError ? error : new AppError({
          type: ErrorType.INVALID_CONFIG,
          message: '初始化词典服务失败',
          details: error
        }),
      });
    }
  }, []);

  /**
   * 更新词典配置
   */
  const updateConfig = useCallback(async (newConfig: Omit<DictionaryConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 验证配置
      const validation = DictionaryConfigManager.validateConfig(newConfig);
      if (!validation.isValid) {
        throw new AppError({
          type: ErrorType.VALIDATION_ERROR,
          message: '配置验证失败',
          details: validation.errors
        });
      }

      // 保存配置
      const savedConfig = DictionaryConfigManager.saveConfig(newConfig);

      // 创建新的服务实例
      const service = await DictionaryServiceFactory.createService(savedConfig);

      setState({
        service,
        config: savedConfig,
        isConfigured: true,
        isLoading: false,
        error: null,
      });

      return savedConfig;
    } catch (error) {
      console.error('更新词典配置失败:', error);
      const appError = error instanceof AppError ? error : new AppError({
        type: ErrorType.INVALID_CONFIG,
        message: '更新词典配置失败',
        details: error
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: appError,
      }));

      throw appError;
    }
  }, []);

  /**
   * 查询单词
   */
  const lookupWord = useCallback(async (word: string): Promise<WordDefinition> => {
    if (!state.service) {
      throw new AppError({
        type: ErrorType.INVALID_CONFIG,
        message: '词典服务未初始化'
      });
    }

    if (!word || typeof word !== 'string' || word.trim() === '') {
      throw new AppError({
        type: ErrorType.VALIDATION_ERROR,
        message: '单词不能为空'
      });
    }

    setQueryState({
      status: 'loading',
      word: word.trim(),
    });

    try {
      const result = await state.service.lookupWord(word.trim());
      
      setQueryState({
        status: 'success',
        data: result,
        word: word.trim(),
      });

      return result;
    } catch (error) {
      console.error('查询单词失败:', error);
      const appError = error instanceof AppError ? error : new AppError({
        type: ErrorType.API_ERROR,
        message: `查询单词 "${word}" 失败`,
        details: error
      });

      setQueryState({
        status: 'error',
        error: appError,
        word: word.trim(),
      });

      throw appError;
    }
  }, [state.service]);

  /**
   * 获取单词发音
   */
  const getWordPronunciation = useCallback(async (word: string): Promise<string> => {
    if (!state.service) {
      throw new AppError({
        type: ErrorType.INVALID_CONFIG,
        message: '词典服务未初始化'
      });
    }

    return await state.service.getWordPronunciation(word);
  }, [state.service]);

  /**
   * 搜索单词
   */
  const searchWords = useCallback(async (query: string, limit?: number): Promise<WordDefinition[]> => {
    if (!state.service) {
      return [];
    }

    try {
      return await state.service.searchWords(query, limit);
    } catch (error) {
      console.error('搜索单词失败:', error);
      return [];
    }
  }, [state.service]);

  /**
   * 清除查询状态
   */
  const clearQueryState = useCallback(() => {
    setQueryState({ status: 'idle' });
  }, []);

  /**
   * 重新初始化服务
   */
  const reinitialize = useCallback(() => {
    initializationRef.current = false;
    initializeService();
  }, [initializeService]);

  /**
   * 禁用词典服务
   */
  const disableService = useCallback(() => {
    try {
      const config = state.config;
      if (config) {
        DictionaryConfigManager.updateConfig({ enabled: false });
      }

      setState({
        service: null,
        config: config ? { ...config, enabled: false } : null,
        isConfigured: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('禁用词典服务失败:', error);
    }
  }, [state.config]);

  /**
   * 启用词典服务
   */
  const enableService = useCallback(async () => {
    try {
      const config = state.config;
      if (!config) {
        throw new AppError({
          type: ErrorType.INVALID_CONFIG,
          message: '没有找到词典配置'
        });
      }

      const updatedConfig = DictionaryConfigManager.updateConfig({ enabled: true });
      const service = await DictionaryServiceFactory.createService(updatedConfig);

      setState({
        service,
        config: updatedConfig,
        isConfigured: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('启用词典服务失败:', error);
      const appError = error instanceof AppError ? error : new AppError({
        type: ErrorType.INVALID_CONFIG,
        message: '启用词典服务失败',
        details: error
      });

      setState(prev => ({
        ...prev,
        error: appError,
      }));

      throw appError;
    }
  }, [state.config]);

  // 组件挂载时初始化服务
  useEffect(() => {
    initializeService();
  }, [initializeService]);

  return {
    // 服务状态
    service: state.service,
    config: state.config,
    isConfigured: state.isConfigured,
    isLoading: state.isLoading,
    error: state.error,

    // 查询状态
    queryState,

    // 操作方法
    updateConfig,
    lookupWord,
    getWordPronunciation,
    searchWords,
    clearQueryState,
    reinitialize,
    disableService,
    enableService,

    // 工具方法
    getAvailableProviders: DictionaryServiceFactory.getAvailableProviders,
    validateConfig: DictionaryConfigManager.validateConfig,
    getDefaultConfig: DictionaryConfigManager.getDefaultConfig,
  };
}

/**
 * 简化的词典查询Hook
 * 只提供查询功能，适用于不需要配置管理的场景
 */
export function useDictionaryQuery() {
  const { 
    lookupWord, 
    getWordPronunciation, 
    searchWords, 
    queryState, 
    clearQueryState,
    isConfigured,
    error: serviceError 
  } = useDictionary();

  return {
    lookupWord,
    getWordPronunciation,
    searchWords,
    queryState,
    clearQueryState,
    isAvailable: isConfigured,
    serviceError,
  };
}