import { useState, useEffect } from 'react';
import { Settings, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useDictionary } from '@/hooks';

import { cn } from '@/lib/utils';

interface DictionaryConfigProps {
  className?: string;
}

export function DictionaryConfig({ className }: DictionaryConfigProps) {
  const {
    config,
    isConfigured,
    isLoading,
    error,
    updateConfig,
    getAvailableProviders,
    validateConfig,
    getDefaultConfig,
  } = useDictionary();

  const [formData, setFormData] = useState<{
    provider: 'free';
    enabled: boolean;
  }>({
    provider: 'free', // 默认使用免费词典API
    enabled: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const providers = getAvailableProviders();

  // 初始化表单数据
  useEffect(() => {
    if (config) {
      setFormData({
        provider: config.provider,
        enabled: config.enabled,
      });
    } else {
      setFormData(getDefaultConfig());
    }
  }, [config, getDefaultConfig]);

  // 清除成功提示
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]);
    setValidationWarnings([]);
    setSaveSuccess(false);
  };

  const handleValidate = () => {
    const validation = validateConfig(formData);
    setValidationErrors(validation.errors);
    setValidationWarnings(validation.warnings || []);
    return validation.isValid;
  };

  const handleSave = async () => {
    if (!handleValidate()) {
      return;
    }

    setIsSaving(true);
    try {
      await updateConfig(formData);
      setSaveSuccess(true);
      setValidationErrors([]);
      setValidationWarnings([]);
    } catch (error) {
      console.error('保存配置失败:', error);
      // 错误已经在useDictionary中处理
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      setFormData({
        provider: config.provider,
        enabled: config.enabled,
      });
    } else {
      setFormData(getDefaultConfig());
    }
    setValidationErrors([]);
    setValidationWarnings([]);
    setSaveSuccess(false);
  };

  const selectedProvider = providers.find(p => p.id === formData.provider);
  const hasChanges = config ? (
    formData.provider !== config.provider ||
    formData.enabled !== config.enabled
  ) : true;

  return (
    <div className={cn("space-y-4", className)}>
      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      {/* 成功提示 */}
      {saveSuccess && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            词典服务配置已保存！
          </AlertDescription>
        </Alert>
      )}

      {/* 简化的配置界面 */}
      <div className="space-y-4">
        {/* 启用开关 */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">启用词典查询</Label>
            <p className="text-sm text-muted-foreground">
              点击单词时显示释义、音标和例句
            </p>
          </div>
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) => handleInputChange('enabled', checked)}
          />
        </div>

        {/* 状态显示 */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={cn("h-2 w-2 rounded-full", 
              isConfigured && formData.enabled ? "bg-green-500" : "bg-gray-400"
            )} />
            <span className="text-sm">
              {isLoading ? "初始化中..." : 
               isConfigured && formData.enabled ? "词典服务已启用" : "词典服务未启用"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            免费词典API
          </span>
        </div>

        {/* 操作按钮 */}
        {hasChanges && (
          <div className="flex space-x-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
              size="sm"
            >
              重置
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}