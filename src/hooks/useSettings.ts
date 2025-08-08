import { useState, useEffect, useCallback } from 'react';
import { 
  UserProfile, 
  AIConfig, 
  EnglishLevel, 
  LearningGoal,
  AppError,
  ErrorType,
  ValidationResult,
  ConfigValidation
} from '@/types';
import { settingsClient } from '@/services/client';
import { AIService } from '@/services/ai/AIService';

interface SettingsState {
  userProfile: UserProfile | null;
  aiConfig: AIConfig | null;
  isLoading: boolean;
  error: AppError | null;
  isInitialized: boolean;
  hasUnsavedChanges: boolean;
}

interface FormData {
  englishLevel: EnglishLevel;
  learningGoal: LearningGoal;
  apiUrl: string;
  apiKey: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
}

export function useSettings() {
  // 状态管理
  const [state, setState] = useState<SettingsState>({
    userProfile: null,
    aiConfig: null,
    isLoading: false,
    error: null,
    isInitialized: false,
    hasUnsavedChanges: false
  });

  // 原始数据状态（用于对比）
  const [originalData, setOriginalData] = useState<FormData>({
    englishLevel: 'B1',
    learningGoal: 'daily_conversation',
    apiUrl: 'https://api-inference.modelscope.cn/v1/',
    apiKey: '',
    modelName: 'Qwen/Qwen3-235B-A22B-Instruct-2507',
    temperature: 0.7,
    maxTokens: 2000
  });

  // 表单数据状态
  const [formData, setFormData] = useState<FormData>({
    englishLevel: 'B1',
    learningGoal: 'daily_conversation',
    apiUrl: 'https://api-inference.modelscope.cn/v1/',
    apiKey: '',
    modelName: 'Qwen/Qwen3-235B-A22B-Instruct-2507',
    temperature: 0.7,
    maxTokens: 2000
  });

  // API Key 状态管理
  const [apiKeyState, setApiKeyState] = useState({
    originalKey: '', // 完整的原始 API Key
    displayKey: '',  // 显示的 API Key（可能是密文）
    isModified: false // 是否被修改过
  });

  // 加载设置数据
  const loadSettings = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // 使用新的客户端服务加载配置
      const [userProfile, aiConfig] = await Promise.all([
        settingsClient.getUserProfile().catch(() => null),
        settingsClient.getAIConfig().catch(() => null)
      ]);

      setState(prev => ({
        ...prev,
        userProfile,
        aiConfig,
        isLoading: false,
        isInitialized: true
      }));

      // 从本地存储获取完整的 API Key（如果有的话）
      const localAIConfig = settingsClient.getCachedAIConfig();
      // 如果本地存储的API Key包含***，说明它也是密文，需要清空
      const fullApiKey = localAIConfig?.apiKey && !localAIConfig.apiKey.includes('***') 
        ? localAIConfig.apiKey 
        : '';
      
      // 确定显示的 API Key：如果有数据且包含***则说明是密文，否则显示原值
      const displayApiKey = aiConfig?.apiKey && aiConfig.apiKey.includes('***') 
        ? aiConfig.apiKey  // 显示密文
        : aiConfig?.apiKey || '';

      // 更新 API Key 状态
      setApiKeyState({
        originalKey: fullApiKey,
        displayKey: displayApiKey,
        isModified: false
      });

      // 更新表单数据和原始数据
      const newFormData = {
        englishLevel: userProfile?.englishLevel || 'B1',
        learningGoal: userProfile?.learningGoal || 'daily_conversation',
        apiUrl: aiConfig?.apiUrl || 'https://api-inference.modelscope.cn/v1/',
        apiKey: displayApiKey,
        modelName: aiConfig?.modelName || 'Qwen/Qwen3-235B-A22B-Instruct-2507',
        temperature: aiConfig?.temperature || 0.7,
        maxTokens: aiConfig?.maxTokens || 2000
      };
      setFormData(newFormData);
      setOriginalData(newFormData);

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: new AppError({ type: ErrorType.LOAD_ERROR, message: error instanceof Error ? error.message : '加载设置失败' }),
        isLoading: false,
        isInitialized: true
      }));
    }
  }, []);

  // 保存用户配置
  const saveUserProfile = useCallback(async (profile: Partial<UserProfile>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const updatedProfile: UserProfile = {
        id: state.userProfile?.id || Date.now(),
        englishLevel: profile.englishLevel || 'B1',
        learningGoal: profile.learningGoal || 'daily_conversation',
        createdAt: state.userProfile?.createdAt || new Date(),
        updatedAt: new Date()
      };

      await settingsClient.saveUserProfile(updatedProfile);
      
      setState(prev => ({
        ...prev,
        userProfile: updatedProfile,
        isLoading: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: new AppError({ type: ErrorType.SAVE_ERROR, message: error instanceof Error ? error.message : '保存用户配置失败' }),
        isLoading: false
      }));
      throw error;
    }
  }, [state.userProfile]);

  // 保存AI配置
  const saveAIConfig = useCallback(async (config: Partial<AIConfig>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const updatedConfig: AIConfig = {
        id: state.aiConfig?.id || Date.now(),
        apiUrl: config.apiUrl?.trim() || 'https://api-inference.modelscope.cn/v1/',
        apiKey: config.apiKey?.trim() || '',
        modelName: config.modelName?.trim() || 'Qwen/Qwen3-235B-A22B-Instruct-2507',
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 2000,
        createdAt: state.aiConfig?.createdAt || new Date(),
        updatedAt: new Date()
      };

      await settingsClient.saveAIConfig(updatedConfig);
      
      setState(prev => ({
        ...prev,
        aiConfig: updatedConfig,
        isLoading: false
      }));

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: new AppError({ type: ErrorType.SAVE_ERROR, message: error instanceof Error ? error.message : '保存AI配置失败' }),
        isLoading: false
      }));
      throw error;
    }
  }, [state.aiConfig]);

  // 测试AI连接
  const testAIConnection = useCallback(async (): Promise<ConfigValidation> => {
    try {
      // 使用修改后的 API Key 或原始的完整 API Key
      const apiKey = apiKeyState.isModified 
        ? formData.apiKey 
        : apiKeyState.originalKey;
        
      const config: AIConfig = {
        id: Date.now(),
        apiUrl: formData.apiUrl,
        apiKey: apiKey,
        modelName: formData.modelName,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await settingsClient.testAIConfig(config);
      
      return {
        isValid: result.success,
        errors: result.success ? [] : [result.error || 'AI配置测试失败'],
        warnings: result.warnings || []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'AI配置测试失败'],
        warnings: []
      };
    }
  }, [formData, apiKeyState]);

  // 重置表单
  const resetForm = useCallback(() => {
    setFormData({ ...originalData });
    // 重置 API Key 状态
    setApiKeyState(prev => ({
      ...prev,
      displayKey: originalData.apiKey,
      isModified: false
    }));
    setState(prev => ({ ...prev, hasUnsavedChanges: false }));
  }, [originalData]);

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 检查是否有未保存的更改
  const checkForUnsavedChanges = useCallback((newFormData: FormData) => {
    const hasUserChanges = newFormData.englishLevel !== originalData.englishLevel ||
                          newFormData.learningGoal !== originalData.learningGoal;
    
    const hasAIChanges = newFormData.apiUrl !== originalData.apiUrl ||
                        newFormData.apiKey !== originalData.apiKey ||
                        newFormData.modelName !== originalData.modelName ||
                        newFormData.temperature !== originalData.temperature ||
                        newFormData.maxTokens !== originalData.maxTokens;
    
    const hasChanges = hasUserChanges || hasAIChanges;
    
    setState(prev => ({ ...prev, hasUnsavedChanges: hasChanges }));
    return { hasUserChanges, hasAIChanges, hasChanges };
  }, [originalData]);

  // 更新表单数据
  const updateFormData = useCallback((updates: Partial<FormData>) => {
    // 如果更新包含 apiKey，需要特殊处理
    if (updates.apiKey !== undefined) {
      setApiKeyState(prev => ({
        ...prev,
        displayKey: updates.apiKey!,
        isModified: true
      }));
    }
    
    setFormData(prev => {
      const newFormData = { ...prev, ...updates };
      checkForUnsavedChanges(newFormData);
      return newFormData;
    });
  }, [checkForUnsavedChanges]);

  // 智能保存设置（只保存有变化的部分）
  const saveSettings = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const changes = checkForUnsavedChanges(formData);
      const savePromises = [];
      
      // 只保存有变化的用户配置
      if (changes.hasUserChanges) {
        savePromises.push(saveUserProfile({
          englishLevel: formData.englishLevel,
          learningGoal: formData.learningGoal
        }));
      }
      
      // 只保存有变化的AI配置
      if (changes.hasAIChanges) {
        // 验证必要字段
        const apiUrl = formData.apiUrl?.trim();
        // 使用修改后的 API Key 或原始的完整 API Key
        const apiKey = apiKeyState.isModified 
          ? formData.apiKey?.trim() 
          : apiKeyState.originalKey?.trim();
        const modelName = formData.modelName?.trim();
        
        // 如果API Key显示为密文且用户未修改，说明数据库中有完整的API Key
        // 此时只验证URL和模型名称
        const isApiKeyMasked = !apiKeyState.isModified && formData.apiKey.includes('***');
        
        if (!apiUrl || !modelName) {
          throw new Error('API URL 和模型名称不能为空');
        }
        
        // 只有当API Key不是密文状态时才验证其非空
        if (!isApiKeyMasked && !apiKey) {
          throw new Error('API Key 不能为空');
        }
        
        // 构建保存配置，如果API Key是密文状态，传递一个特殊标记
        const configToSave = {
          apiUrl,
          apiKey: isApiKeyMasked ? formData.apiKey : apiKey, // 保持密文用于服务端识别
          modelName,
          temperature: formData.temperature,
          maxTokens: formData.maxTokens
        };
        
        savePromises.push(saveAIConfig(configToSave));
      }
      
      if (savePromises.length > 0) {
        await Promise.all(savePromises);
      }
      
      // 更新原始数据
      setOriginalData({ ...formData });
      
      // 如果保存了 AI 配置且 API Key 被修改，更新状态
      if (changes.hasAIChanges && apiKeyState.isModified) {
        setApiKeyState(prev => ({
          originalKey: formData.apiKey,  // 现在的输入值成为新的原始值
          displayKey: formData.apiKey,
          isModified: false  // 重置修改状态
        }));
      }
      
      setState(prev => ({ ...prev, hasUnsavedChanges: false }));
      
      return true;
    } catch (error) {
      console.error('保存设置失败:', error);
      setState(prev => ({
        ...prev,
        error: new AppError({ type: ErrorType.SAVE_ERROR, message: error instanceof Error ? error.message : '保存设置失败' })
      }));
      return false;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [formData, checkForUnsavedChanges, saveUserProfile, saveAIConfig, apiKeyState]);

  // 重置设置
  const resetSettings = useCallback(async () => {
    try {
      await settingsClient.clearAll();
      setState({
        userProfile: null,
        aiConfig: null,
        isLoading: false,
        error: null,
        isInitialized: true
      });
      const defaultFormData = {
        englishLevel: 'B1',
        learningGoal: 'daily_conversation',
        apiUrl: 'https://api-inference.modelscope.cn/v1/',
        apiKey: '',
        modelName: 'Qwen/Qwen3-235B-A22B-Instruct-2507',
        temperature: 0.7,
        maxTokens: 2000
      };
      setFormData(defaultFormData);
      setOriginalData(defaultFormData);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: new AppError({ type: ErrorType.OPERATION_ERROR, message: error instanceof Error ? error.message : '重置设置失败' })
      }));
    }
  }, []);

  // 数据同步
  const syncSettings = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const result = await settingsClient.syncFromServer();
      
      if (result.errors.length > 0) {
        console.warn('同步设置时出现错误:', result.errors);
      }
      
      await loadSettings();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: new AppError({ type: ErrorType.SYNC_ERROR, message: error instanceof Error ? error.message : '同步设置失败' }),
        isLoading: false
      }));
    }
  }, [loadSettings]);

  // 初始化
  useEffect(() => {
    if (!state.isInitialized) {
      loadSettings();
    }
  }, [loadSettings, state.isInitialized]);

  return {
    // 状态
    ...state,
    formData,
    
    // 操作方法
    loadSettings,
    saveUserProfile,
    saveAIConfig,
    saveSettings,
    testAIConnection,
    updateFormData,
    resetForm,
    resetSettings,
    syncSettings,
    clearError
  };
}