import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { testDatabase } from '@/test/database-test';

export function DatabaseTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const runTest = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      await testDatabase();
      setResult({
        success: true,
        message: '数据库测试通过！所有功能正常工作。'
      });
    } catch (error) {
      setResult({
        success: false,
        message: `数据库测试失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">数据库功能测试</h1>
      
      <div className="space-y-4">
        <p className="text-muted-foreground">
          点击下面的按钮来测试数据库初始化和基本操作功能。
        </p>
        
        <Button 
          onClick={runTest} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? '测试中...' : '运行数据库测试'}
        </Button>
        
        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <p>{result.message}</p>
          </Alert>
        )}
        
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">测试内容包括：</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>数据库连接初始化</li>
            <li>存储服务初始化</li>
            <li>用户配置的保存和获取</li>
            <li>AI配置的保存和获取</li>
            <li>单词本功能测试</li>
          </ul>
        </div>
      </div>
    </div>
  );
}