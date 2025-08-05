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
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>词典服务配置</span>
        </CardTitle>
        <CardDescription>
          词典服务已默认启用免费词典API，提供真实的英语单词查询功能。支持音标、释义、例句等完整信息。
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
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
              配置保存成功！词典服务已启用。
            </AlertDescription>
          </Alert>
        )}

        {/* 验证错误 */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 验证警告 */}
        {validationWarnings.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {validationWarnings.map((warning, index) => (
                  <div key={index}>• {warning}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 启用开关 */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">启用词典服务</Label>
            <p className="text-sm text-muted-foreground">
              启用后可以在阅读时查询单词释义
            </p>
          </div>
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) => handleInputChange('enabled', checked)}
          />
        </div>

        {/* 服务提供商选择 */}
        <div className="space-y-2">
          <Label htmlFor="provider">服务提供商</Label>
          <Select
            value={formData.provider}
            onValueChange={(value) => handleInputChange('provider', value as 'free')}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择词典服务提供商" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex flex-col">
                    <span>{provider.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {provider.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProvider && (
            <p className="text-sm text-muted-foreground">
              {selectedProvider.description}
            </p>
          )}
        </div>

        {/* 服务说明 */}
        {selectedProvider && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">免费词典服务说明：</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>使用 Free Dictionary API 提供真实的英语词典查询</li>
                  <li>支持音标、释义、例句和发音功能</li>
                  <li>完全免费，无需注册或配置API密钥</li>
                  <li>数据来源于开源词典项目</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 当前状态 */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">当前状态</p>
              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    初始化中...
                  </span>
                ) : isConfigured ? (
                  <span className="text-green-600">已配置并启用</span>
                ) : (
                  <span className="text-muted-foreground">未配置</span>
                )}
              </p>
            </div>
            
            {config && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  提供商: {providers.find(p => p.id === config.provider)?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  更新时间: {config.updatedAt.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || !formData.enabled}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                保存中...
              </>
            ) : (
              '保存配置'
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
          >
            重置
          </Button>
          
          <Button
            variant="ghost"
            onClick={handleValidate}
            disabled={isSaving}
          >
            验证
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}