import { useState, useEffect } from 'react';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">设置</h1>
          <p className="text-muted-foreground">
            个性化您的学习体验
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {mounted && hasUnsavedChanges && (
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={isLoading}
            >
              重置
            </Button>
          )}
          <LoadingButton
            onClick={saveSettings}
            loading={isLoading}
            disabled={!mounted || !hasUnsavedChanges}
          >
            {isLoading ? '保存中...' : '保存设置'}
          </LoadingButton>
        </div>
      </div>

      {/* 未保存更改提示 */}
      {mounted && hasUnsavedChanges && (
        <Alert variant="warning" className="mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            您有未保存的更改，请记得保存设置。
          </div>
        </Alert>
      )}

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
              {mounted ? (
                <SelectWithOptions
                  options={levelOptions}
                  value={formData.englishLevel}
                  onChange={(value) => updateFormData({ englishLevel: value as EnglishLevel })}
                  placeholder="请选择您的英语水平"
                />
              ) : (
                <div className="h-10 bg-muted animate-pulse rounded"></div>
              )}
            </FormField>

            <FormField label="学习目标" required>
              {mounted ? (
                <SelectWithOptions
                  options={goalOptions}
                  value={formData.learningGoal}
                  onChange={(value) => updateFormData({ learningGoal: value as LearningGoal })}
                  placeholder="请选择您的学习目标"
                />
              ) : (
                <div className="h-10 bg-muted animate-pulse rounded"></div>
              )}
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
              {mounted ? (
                <Input
                  type="url"
                  value={formData.apiUrl}
                  onChange={(e) => updateFormData({ apiUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                />
              ) : (
                <div className="h-10 bg-muted animate-pulse rounded"></div>
              )}
            </FormField>

            <FormField label="API Key" required>
              {mounted ? (
                <Input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => updateFormData({ apiKey: e.target.value })}
                  placeholder="sk-..."
                />
              ) : (
                <div className="h-10 bg-muted animate-pulse rounded"></div>
              )}
            </FormField>

            <FormField label="模型名称" required>
              {mounted ? (
                <div className="space-y-2">
                  <SelectWithOptions
                    options={[...modelOptions, { value: 'custom', label: '自定义模型...' }]}
                    value={modelOptions.find(opt => opt.value === formData.modelName) ? formData.modelName : 'custom'}
                    onChange={(value) => {
                      if (value !== 'custom') {
                        updateFormData({ modelName: value })
                      }
                    }}
                    placeholder="请选择模型"
                  />
                  {(!modelOptions.find(opt => opt.value === formData.modelName) || 
                    modelOptions.find(opt => opt.value === formData.modelName)?.value === 'custom') && (
                    <Input
                      type="text"
                      value={formData.modelName}
                      onChange={(e) => updateFormData({ modelName: e.target.value })}
                      placeholder="输入自定义模型名称，如：Qwen/Qwen3-235B-A22B-Instruct-2507"
                      className="mt-2"
                    />
                  )}
                </div>
              ) : (
                <div className="h-10 bg-muted animate-pulse rounded"></div>
              )}
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Temperature (0-2)" required>
                {mounted ? (
                  <>
                    <Input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.temperature || 0.7}
                      onChange={(e) => updateFormData({ temperature: parseFloat(e.target.value) || 0.7 })}
                      placeholder="0.7"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      控制输出的随机性，0为确定性输出，2为高随机性
                    </p>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="h-10 bg-muted animate-pulse rounded"></div>
                    <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
                  </div>
                )}
              </FormField>

              <FormField label="最大令牌数" required>
                {mounted ? (
                  <>
                    <Input
                      type="number"
                      min="1"
                      max="8000"
                      value={formData.maxTokens || 2000}
                      onChange={(e) => updateFormData({ maxTokens: parseInt(e.target.value) || 2000 })}
                      placeholder="2000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      单次请求的最大输出长度
                    </p>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="h-10 bg-muted animate-pulse rounded"></div>
                    <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
                  </div>
                )}
              </FormField>
            </div>

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
            {mounted ? (
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
            ) : (
              <div className="h-6 bg-muted animate-pulse rounded"></div>
            )}
          </FormField>
        </div>

      </div>
    </div>
  );
}