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
import { StorageService } from '@/services/storage/StorageService';
import { AIService } from '@/services/ai/AIService';

interface SettingsState {
  userProfile: UserProfile | null;
  aiConfig: AIConfig | null;
  isLoading: boolean;
  error: AppError | null;
  hasUnsavedChanges: boolean;
}

interface SettingsFormData {
  englishLevel: EnglishLevel;
  learningGoal: LearningGoal;
  apiUrl: string;
  apiKey: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
}

export function useSettings() {
  const [state, setState] = useState<SettingsState>({
    userProfile: null,
    aiConfig: null,
    isLoading: true,
    error: null,
    hasUnsavedChanges: false
  });

  const [formData, setFormData] = useState<SettingsFormData>({
    englishLevel: 'A1',
    learningGoal: 'daily_conversation',
    apiUrl: process.env.OPENAI_BASE_URL || 'https://api-inference.modelscope.cn/v1/',
    apiKey: process.env.OPENAI_API_KEY || '',
    modelName: process.env.OPEHAI_MODEL || 'Qwen/Qwen3-235B-A22B-Instruct-2507',
    temperature: 0.7,
    maxTokens: 2000
  });

  const storageService = new StorageService();

  // 加载设置数据
  const loadSettings = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // 从后端API加载用户配置和AI配置
      const [userProfileResponse, aiConfigResponse] = await Promise.all([
        fetch('/api/user-profile').then(res => res.json().catch(() => ({ success: false }))),
        fetch('/api/ai-config').then(res => res.json().catch(() => ({ success: false })))
      ]);

      let userProfile: UserProfile | null = null;
      let aiConfig: AIConfig | null = null;

      // 处理用户配置响应
      if (userProfileResponse.success && userProfileResponse.data) {
        userProfile = {
          id: userProfileResponse.data.id,
          englishLevel: userProfileResponse.data.english_level,
          learningGoal: userProfileResponse.data.learning_goal,
          createdAt: new Date(userProfileResponse.data.created_at),
          updatedAt: new Date(userProfileResponse.data.updated_at)
        };
      }

      // 处理AI配置响应
      if (aiConfigResponse.success && aiConfigResponse.data) {
        aiConfig = {
          id: aiConfigResponse.data.id,
          apiUrl: aiConfigResponse.data.api_url,
          apiKey: aiConfigResponse.data.api_key,
          modelName: aiConfigResponse.data.model_name,
          temperature: aiConfigResponse.data.temperature,
          maxTokens: aiConfigResponse.data.max_tokens,
          createdAt: new Date(aiConfigResponse.data.created_at),
          updatedAt: new Date(aiConfigResponse.data.updated_at)
        };
      }

      setState(prev => ({
        ...prev,
        userProfile,
        aiConfig,
        isLoading: false
      }));

      // 更新表单数据
      setFormData({
        englishLevel: userProfile?.englishLevel || 'B1',
        learningGoal: userProfile?.learningGoal || 'daily_conversation',
        apiUrl: aiConfig?.apiUrl || 'https://api-inference.modelscope.cn/v1/',
        apiKey: aiConfig?.apiKey || '',
        modelName: aiConfig?.modelName || 'Qwen/Qwen3-235B-A22B-Instruct-2507',
        temperature: aiConfig?.temperature || 0.7,
        maxTokens: aiConfig?.maxTokens || 2000
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: new AppError({
          type: ErrorType.DATABASE_ERROR,
          message: '加载设置失败',
          details: error
        })
      }));
    }
  }, []);

  // 保存设置
  const saveSettings = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // 验证表单数据
      const validation = validateFormData(formData);
      if (!validation.isValid) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: new AppError({
            type: ErrorType.VALIDATION_ERROR,
            message: '表单验证失败',
            details: validation.errors
          })
        }));
        return false;
      }

      // 保存用户配置到后端API
      const userProfileResponse = await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          englishLevel: formData.englishLevel,
          learningGoal: formData.learningGoal
        })
      });

      if (!userProfileResponse.ok) {
        throw new Error('保存用户配置失败');
      }

      const userProfileResult = await userProfileResponse.json();
      if (!userProfileResult.success) {
        throw new Error(userProfileResult.error || '保存用户配置失败');
      }

      // 保存AI配置到后端API
      const aiConfigResponse = await fetch('/api/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiUrl: formData.apiUrl,
          apiKey: formData.apiKey,
          modelName: formData.modelName,
          temperature: formData.temperature,
          maxTokens: formData.maxTokens
        })
      });

      if (!aiConfigResponse.ok) {
        throw new Error('保存AI配置失败');
      }

      const aiConfigResult = await aiConfigResponse.json();
      if (!aiConfigResult.success) {
        throw new Error(aiConfigResult.error || '保存AI配置失败');
      }

      // 构建配置对象
      const userProfile: UserProfile = {
        id: userProfileResult.data.id,
        englishLevel: formData.englishLevel,
        learningGoal: formData.learningGoal,
        createdAt: new Date(userProfileResult.data.createdAt || Date.now()),
        updatedAt: new Date()
      };

      const aiConfig: AIConfig = {
        id: aiConfigResult.data.id,
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey,
        modelName: formData.modelName,
        temperature: formData.temperature || 0.7,
        maxTokens: formData.maxTokens || 2000,
        createdAt: new Date(aiConfigResult.data.createdAt || Date.now()),
        updatedAt: new Date()
      };

      setState(prev => ({
        ...prev,
        userProfile,
        aiConfig,
        isLoading: false,
        hasUnsavedChanges: false
      }));

      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: new AppError({
          type: ErrorType.DATABASE_ERROR,
          message: error instanceof Error ? error.message : '保存设置失败',
          details: error
        })
      }));
      return false;
    }
  }, [formData]);

  // 测试AI配置连接
  const testAIConnection = useCallback(async (): Promise<ConfigValidation> => {
    try {
      // 基础验证
      if (!formData.apiUrl || !formData.apiKey || !formData.modelName) {
        return {
          isValid: false,
          errors: ['请填写完整的AI配置信息']
        };
      }

      // 创建临时AI配置用于测试
      const testConfig: AIConfig = {
        id: 0,
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey,
        modelName: formData.modelName,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 使用AI服务进行配置验证
      const aiService = new AIService();
      const isValid = await aiService.validateConfig(testConfig);

      if (!isValid) {
        return {
          isValid: false,
          errors: ['AI配置验证失败，请检查API URL、密钥和模型名称']
        };
      }

      // 额外检查：获取可用模型列表
      try {
        const response = await fetch(`${formData.apiUrl}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${formData.apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const availableModels = data.data?.map((model: any) => model.id) || [];
          
          // 检查模型是否可用
          if (!availableModels.includes(formData.modelName)) {
            return {
              isValid: true,
              errors: [],
              warnings: [`模型 ${formData.modelName} 可能不可用，可用模型: ${availableModels.slice(0, 5).join(', ')}`]
            };
          }
        }
      } catch (error) {
        // 如果获取模型列表失败，但基础验证通过，仍然认为配置有效
        return {
          isValid: true,
          errors: [],
          warnings: ['无法获取可用模型列表，但基础配置验证通过']
        };
      }

      return {
        isValid: true,
        errors: []
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['网络连接失败，请检查网络设置']
      };
    }
  }, [formData.apiUrl, formData.apiKey, formData.modelName]);

  // 更新表单数据
  const updateFormData = useCallback((updates: Partial<SettingsFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setState(prev => ({ ...prev, hasUnsavedChanges: true }));
  }, []);

  // 重置表单
  const resetForm = useCallback(() => {
    if (state.userProfile || state.aiConfig) {
      setFormData({
        englishLevel: state.userProfile?.englishLevel || 'A1',
        learningGoal: state.userProfile?.learningGoal || 'daily_conversation',
        apiUrl: state.aiConfig?.apiUrl || 'https://api-inference.modelscope.cn/v1/',
        apiKey: state.aiConfig?.apiKey || '',
        modelName: state.aiConfig?.modelName || 'Qwen/Qwen3-235B-A22B-Instruct-2507',
        temperature: state.aiConfig?.temperature || 0.7,
        maxTokens: state.aiConfig?.maxTokens || 2000
      });
    }
    setState(prev => ({ ...prev, hasUnsavedChanges: false }));
  }, [state.userProfile, state.aiConfig]);

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 初始化加载
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    // 状态
    ...state,
    formData,
    
    // 操作
    updateFormData,
    saveSettings,
    testAIConnection,
    resetForm,
    clearError,
    reload: loadSettings
  };
}

// 表单验证函数
function validateFormData(data: SettingsFormData): ValidationResult {
  const errors: Record<string, string> = {};

  // 验证英语水平
  const validLevels: EnglishLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  if (!validLevels.includes(data.englishLevel)) {
    errors.englishLevel = '请选择有效的英语水平';
  }

  // 验证学习目标
  const validGoals: LearningGoal[] = [
    'daily_conversation',
    'business_english', 
    'academic_english',
    'travel_english',
    'exam_preparation'
  ];
  if (!validGoals.includes(data.learningGoal)) {
    errors.learningGoal = '请选择有效的学习目标';
  }

  // 验证API URL
  if (!data.apiUrl.trim()) {
    errors.apiUrl = 'API URL不能为空';
  } else {
    try {
      new URL(data.apiUrl);
    } catch {
      errors.apiUrl = 'API URL格式不正确';
    }
  }

  // 验证API Key
  if (!data.apiKey.trim()) {
    errors.apiKey = 'API Key不能为空';
  } else if (data.apiKey.length < 10) {
    errors.apiKey = 'API Key长度不能少于10个字符';
  }

  // 验证模型名称
  if (!data.modelName.trim()) {
    errors.modelName = '模型名称不能为空';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}