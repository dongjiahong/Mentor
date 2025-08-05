import { useState } from 'react';
import { User, Bot, Palette, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { useSettings } from '@/hooks';
import { useTheme } from '@/hooks';
import { DictionaryConfig } from '@/components/features';
import { FormField } from '@/components/ui/form-field';
import { SelectWithOptions } from '@/components/ui/select-with-options';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Alert } from '@/components/ui/alert';
import { 
  ENGLISH_LEVEL_DESCRIPTIONS, 
  LEARNING_GOAL_DESCRIPTIONS,
  EnglishLevel,
  LearningGoal 
} from '@/types';

export function SettingsPage() {
  const {
    userProfile,
    aiConfig,
    formData,
    isLoading,
    error,
    hasUnsavedChanges,
    updateFormData,
    saveSettings,
    testAIConnection,
    resetForm,
    clearError
  } = useSettings();

  const { theme, setTheme } = useTheme();
  
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    message: string;
    warnings?: string[];
  } | null>(null);

  // 英语水平选项
  const levelOptions = Object.entries(ENGLISH_LEVEL_DESCRIPTIONS).map(([value, label]) => ({
    value: value as EnglishLevel,
    label: `${value} - ${label}`
  }));

  // 学习目标选项
  const goalOptions = Object.entries(LEARNING_GOAL_DESCRIPTIONS).map(([value, label]) => ({
    value: value as LearningGoal,
    label
  }));

  // 模型选项
  const modelOptions = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' }
  ];

  // 处理AI连接测试
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);
    
    try {
      const result = await testAIConnection();
      setConnectionResult({
        success: result.isValid,
        message: result.isValid ? 'AI配置测试成功！' : result.errors.join(', '),
        warnings: result.warnings
      });
    } catch (error) {
      setConnectionResult({
        success: false,
        message: '测试连接时发生错误'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // 处理保存设置
  const handleSaveSettings = async () => {
    clearError();
    const success = await saveSettings();
    
    if (success) {
      setConnectionResult({
        success: true,
        message: '设置保存成功！'
      });
    }
  };

  // 处理重置表单
  const handleResetForm = () => {
    resetForm();
    setConnectionResult(null);
  };

  if (isLoading && !userProfile && !aiConfig) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">加载设置中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">设置</h1>
        <p className="text-muted-foreground">
          个性化您的学习体验
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="error" className="mb-6">
          <p className="font-medium">{error.message}</p>
        </Alert>
      )}

      {/* 连接测试结果 */}
      {connectionResult && (
        <Alert 
          variant={connectionResult.success ? 'success' : 'error'} 
          className="mb-6"
        >
          <div>
            <p>{connectionResult.message}</p>
            {connectionResult.warnings && connectionResult.warnings.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-yellow-600">注意事项：</p>
                <ul className="text-sm list-disc list-inside">
                  {connectionResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Alert>
      )}

      <div className="space-y-6">
        {/* 用户配置 */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">用户配置</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="英语水平" required>
              <SelectWithOptions
                options={levelOptions}
                value={formData.englishLevel}
                onChange={(value) => updateFormData({ englishLevel: value as EnglishLevel })}
                placeholder="请选择您的英语水平"
              />
            </FormField>

            <FormField label="学习目标" required>
              <SelectWithOptions
                options={goalOptions}
                value={formData.learningGoal}
                onChange={(value) => updateFormData({ learningGoal: value as LearningGoal })}
                placeholder="请选择您的学习目标"
              />
            </FormField>
          </div>
        </div>

        {/* AI模型配置 */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">AI模型配置</h2>
          </div>
          
          <div className="space-y-4">
            <FormField label="API URL" required>
              <Input
                type="url"
                value={formData.apiUrl}
                onChange={(e) => updateFormData({ apiUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </FormField>

            <FormField label="API Key" required>
              <Input
                type="password"
                value={formData.apiKey}
                onChange={(e) => updateFormData({ apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </FormField>

            <FormField label="模型名称" required>
              <SelectWithOptions
                options={modelOptions}
                value={formData.modelName}
                onChange={(value) => updateFormData({ modelName: value })}
                placeholder="请选择模型"
              />
            </FormField>

            <div className="flex justify-start">
              <LoadingButton
                variant="outline"
                onClick={handleTestConnection}
                loading={testingConnection}
                disabled={!formData.apiUrl || !formData.apiKey || !formData.modelName}
              >
                {testingConnection ? '测试中...' : '测试连接'}
              </LoadingButton>
            </div>
          </div>
        </div>

        {/* 词典服务配置 */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">词典服务</h2>
          </div>
          
          <DictionaryConfig />
        </div>

        {/* 外观设置 */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">外观设置</h2>
          </div>
          
          <FormField label="主题模式">
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name="theme" 
                  value="light" 
                  checked={theme === 'light'}
                  onChange={() => setTheme('light')}
                  className="rounded" 
                />
                <span className="text-sm">浅色</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name="theme" 
                  value="dark" 
                  checked={theme === 'dark'}
                  onChange={() => setTheme('dark')}
                  className="rounded" 
                />
                <span className="text-sm">深色</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  name="theme" 
                  value="system" 
                  checked={theme === 'system'}
                  onChange={() => setTheme('system')}
                  className="rounded" 
                />
                <span className="text-sm">跟随系统</span>
              </label>
            </div>
          </FormField>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between">
          <div>
            {hasUnsavedChanges && (
              <Button
                variant="outline"
                onClick={handleResetForm}
                disabled={isLoading}
              >
                重置
              </Button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <LoadingButton
              onClick={handleSaveSettings}
              loading={isLoading}
              disabled={!hasUnsavedChanges}
            >
              {isLoading ? '保存中...' : '保存设置'}
            </LoadingButton>
          </div>
        </div>

        {/* 未保存更改提示 */}
        {hasUnsavedChanges && (
          <Alert variant="warning">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              您有未保存的更改，请记得保存设置。
            </div>
          </Alert>
        )}
      </div>
    </div>
  );
}