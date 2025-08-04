import { useState } from 'react';
import { Search, Settings, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { WordPopover } from './WordPopover';
import { useDictionary } from '@/hooks/useDictionary';
import { DictionaryConfig } from '@/services';
import { cn } from '@/lib/utils';

/**
 * 词典服务演示组件
 * 用于测试和演示词典服务的功能
 */
export function DictionaryDemo() {
  const [searchWord, setSearchWord] = useState('');
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    provider: 'mock' as 'youdao' | 'mock',
    appKey: '',
    appSecret: '',
    enabled: true,
  });

  const {
    isConfigured,
    isLoading,
    error,
    config,
    updateConfig,
    queryState,
    lookupWord,
    getAvailableProviders,
    validateConfig,
  } = useDictionary();

  const providers = getAvailableProviders();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchWord.trim()) return;

    try {
      // 设置弹窗位置（居中显示）
      setPopoverPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2 - 100,
      });
      setShowPopover(true);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  const handleConfigSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateConfig(configForm);
      setShowConfig(false);
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  };

  const handleWordClick = (word: string, event: React.MouseEvent) => {
    setSearchWord(word);
    setPopoverPosition({
      x: event.clientX,
      y: event.clientY,
    });
    setShowPopover(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 标题 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          词典服务演示
        </h1>
        <p className="text-muted-foreground">
          测试有道词典API集成和单词查询功能
        </p>
      </div>

      {/* 配置状态 */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">服务配置</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
          >
            {showConfig ? '隐藏配置' : '显示配置'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <span className="text-sm text-muted-foreground">状态</span>
            <div className="flex items-center space-x-2 mt-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConfigured ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm font-medium">
                {isLoading ? '初始化中...' : isConfigured ? '已配置' : '未配置'}
              </span>
            </div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">服务提供商</span>
            <p className="text-sm font-medium mt-1">
              {config?.provider === 'youdao' ? '有道词典' : '模拟服务'}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">启用状态</span>
            <p className="text-sm font-medium mt-1">
              {config?.enabled ? '已启用' : '已禁用'}
            </p>
          </div>
        </div>

        {error && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">配置错误</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          </Alert>
        )}

        {/* 配置表单 */}
        {showConfig && (
          <form onSubmit={handleConfigSave} className="space-y-4 pt-4 border-t border-border">
            <div>
              <label className="text-sm font-medium mb-2 block">
                服务提供商
              </label>
              <select
                value={configForm.provider}
                onChange={(e) => setConfigForm(prev => ({
                  ...prev,
                  provider: e.target.value as 'youdao' | 'mock'
                }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.description}
                  </option>
                ))}
              </select>
            </div>

            {configForm.provider === 'youdao' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    API应用Key
                  </label>
                  <Input
                    type="text"
                    value={configForm.appKey}
                    onChange={(e) => setConfigForm(prev => ({
                      ...prev,
                      appKey: e.target.value
                    }))}
                    placeholder="请输入有道API应用Key"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    API应用密钥
                  </label>
                  <Input
                    type="password"
                    value={configForm.appSecret}
                    onChange={(e) => setConfigForm(prev => ({
                      ...prev,
                      appSecret: e.target.value
                    }))}
                    placeholder="请输入有道API应用密钥"
                  />
                </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enabled"
                checked={configForm.enabled}
                onChange={(e) => setConfigForm(prev => ({
                  ...prev,
                  enabled: e.target.checked
                }))}
                className="rounded border-border"
              />
              <label htmlFor="enabled" className="text-sm font-medium">
                启用词典服务
              </label>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  保存中...
                </>
              ) : (
                '保存配置'
              )}
            </Button>
          </form>
        )}
      </div>

      {/* 搜索区域 */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">单词查询</h2>
        </div>

        <form onSubmit={handleSearch} className="flex space-x-2 mb-4">
          <Input
            type="text"
            value={searchWord}
            onChange={(e) => setSearchWord(e.target.value)}
            placeholder="输入要查询的英文单词..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!isConfigured || !searchWord.trim() || queryState.status === 'loading'}
          >
            {queryState.status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>

        {!isConfigured && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">词典服务未配置</p>
              <p className="text-sm text-muted-foreground">
                请先配置词典服务才能进行单词查询
              </p>
            </div>
          </Alert>
        )}
      </div>

      {/* 示例文本 */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">示例文本</h2>
        </div>
        <p className="text-foreground leading-relaxed">
          点击下面的单词来查询释义：{' '}
          <span 
            className="text-primary cursor-pointer hover:underline font-medium"
            onClick={(e) => handleWordClick('hello', e)}
          >
            hello
          </span>
          {', '}
          <span 
            className="text-primary cursor-pointer hover:underline font-medium"
            onClick={(e) => handleWordClick('world', e)}
          >
            world
          </span>
          {', '}
          <span 
            className="text-primary cursor-pointer hover:underline font-medium"
            onClick={(e) => handleWordClick('beautiful', e)}
          >
            beautiful
          </span>
          {', '}
          <span 
            className="text-primary cursor-pointer hover:underline font-medium"
            onClick={(e) => handleWordClick('language', e)}
          >
            language
          </span>
          {', '}
          <span 
            className="text-primary cursor-pointer hover:underline font-medium"
            onClick={(e) => handleWordClick('learning', e)}
          >
            learning
          </span>
          {', '}
          <span 
            className="text-primary cursor-pointer hover:underline font-medium"
            onClick={(e) => handleWordClick('dictionary', e)}
          >
            dictionary
          </span>
        </p>
      </div>

      {/* 查询历史 */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">查询状态</h2>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">当前状态:</span>
            <span className="text-sm font-medium">
              {queryState.status === 'idle' && '待查询'}
              {queryState.status === 'loading' && '查询中...'}
              {queryState.status === 'success' && '查询成功'}
              {queryState.status === 'error' && '查询失败'}
            </span>
          </div>
          {queryState.word && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">查询单词:</span>
              <span className="text-sm font-medium">{queryState.word}</span>
            </div>
          )}
          {queryState.error && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">错误信息:</span>
              <span className="text-sm text-destructive">{queryState.error.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* 单词弹窗 */}
      {showPopover && searchWord && (
        <WordPopover
          word={searchWord}
          position={popoverPosition}
          onClose={() => setShowPopover(false)}
          onAddToWordbook={(word, definition) => {
            console.log('添加到单词本:', word, definition);
            // 这里应该调用实际的添加到单词本的功能
            return Promise.resolve();
          }}
        />
      )}
    </div>
  );
}