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
    apiUrl: 'https://api-inference.modelscope.cn/v1/',
    apiKey: '',
    modelName: 'Qwen/Qwen3-235B-A22B-Instruct-2507'
  });

  const storageService = new StorageService();

  // 加载设置数据
  const loadSettings = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await storageService.initialize();
      
      const [userProfile, aiConfig] = await Promise.all([
        storageService.getUserProfile(),
        storageService.getAIConfig()
      ]);

      setState(prev => ({
        ...prev,
        userProfile,
        aiConfig,
        isLoading: false
      }));

      // 更新表单数据
      if (userProfile || aiConfig) {
        setFormData({
          englishLevel: userProfile?.englishLevel || 'A1',
          learningGoal: userProfile?.learningGoal || 'daily_conversation',
          apiUrl: aiConfig?.apiUrl || 'https://api-inference.modelscope.cn/v1/',
          apiKey: aiConfig?.apiKey || '',
          modelName: aiConfig?.modelName || 'Qwen/Qwen3-235B-A22B-Instruct-2507'
        });
      }
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

      // 保存用户配置
      const userProfile = await storageService.saveUserProfile({
        englishLevel: formData.englishLevel,
        learningGoal: formData.learningGoal
      });

      // 保存AI配置
      const aiConfig = await storageService.saveAIConfig({
        apiUrl: formData.apiUrl,
        apiKey: formData.apiKey,
        modelName: formData.modelName
      });

      // 保存到持久化存储
      storageService.save();

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
          message: '保存设置失败',
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
        modelName: state.aiConfig?.modelName || 'Qwen/Qwen3-235B-A22B-Instruct-2507'
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