import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PronunciationEvaluator } from '@/services/pronunciation/PronunciationEvaluator';
import { PronunciationScore } from '@/types';

/**
 * 发音评估测试页面
 * 用于测试发音评估算法
 */
export function PronunciationTestPage() {
  const [targetText, setTargetText] = useState('Hello world');
  const [spokenText, setSpokenText] = useState('Hello world');
  const [score, setScore] = useState<PronunciationScore | null>(null);

  const handleEvaluate = () => {
    const result = PronunciationEvaluator.evaluate(targetText, spokenText);
    setScore(result);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const testCases = [
    { target: 'Hello world', spoken: 'Hello world', description: '完全匹配' },
    { target: 'Hello world', spoken: 'Helo word', description: '轻微错误' },
    { target: 'Hello beautiful world', spoken: 'Hello world', description: '缺少单词' },
    { target: 'Hello world', spoken: 'Hello beautiful world', description: '多余单词' },
    { target: 'pronunciation', spoken: 'pronuncation', description: '发音错误' },
    { target: 'communication', spoken: 'comunication', description: '拼写错误' },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">发音评估测试</h1>
        <p className="text-muted-foreground">测试发音评估算法的准确性</p>
      </div>

      {/* 手动测试 */}
      <Card>
        <CardHeader>
          <CardTitle>手动测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target">目标文本</Label>
              <Input
                id="target"
                value={targetText}
                onChange={(e) => setTargetText(e.target.value)}
                placeholder="输入目标文本"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spoken">识别文本</Label>
              <Input
                id="spoken"
                value={spokenText}
                onChange={(e) => setSpokenText(e.target.value)}
                placeholder="输入识别结果"
              />
            </div>
          </div>
          
          <Button onClick={handleEvaluate} className="w-full">
            评估发音
          </Button>

          {score && (
            <div className="space-y-4 mt-6">
              {/* 总体评分 */}
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(score.overallScore)}`}>
                  {score.overallScore}
                </div>
                <div className="text-sm text-muted-foreground">总分</div>
              </div>

              {/* 详细评分 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-background border rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(score.accuracyScore)}`}>
                    {score.accuracyScore}
                  </div>
                  <div className="text-sm text-muted-foreground">准确度</div>
                  <Progress value={score.accuracyScore} className="mt-2 h-2" />
                </div>
                
                <div className="text-center p-3 bg-background border rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(score.fluencyScore)}`}>
                    {score.fluencyScore}
                  </div>
                  <div className="text-sm text-muted-foreground">流利度</div>
                  <Progress value={score.fluencyScore} className="mt-2 h-2" />
                </div>
                
                <div className="text-center p-3 bg-background border rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(score.pronunciationScore)}`}>
                    {score.pronunciationScore}
                  </div>
                  <div className="text-sm text-muted-foreground">发音</div>
                  <Progress value={score.pronunciationScore} className="mt-2 h-2" />
                </div>
              </div>

              {/* 反馈 */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2">评估反馈</h4>
                <p className="text-sm">{score.feedback}</p>
              </div>

              {/* 错误分析 */}
              {score.mistakes && score.mistakes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">错误分析</h4>
                  <div className="space-y-2">
                    {score.mistakes.map((mistake, index) => (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-medium text-sm">
                          {mistake.actual ? (
                            <>
                              <span className="text-red-600">"{mistake.actual}"</span>
                              {' → '}
                              <span className="text-green-600">"{mistake.expected}"</span>
                            </>
                          ) : (
                            <span className="text-red-600">缺少: "{mistake.expected}"</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {mistake.suggestion}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预设测试用例 */}
      <Card>
        <CardHeader>
          <CardTitle>预设测试用例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testCases.map((testCase, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setTargetText(testCase.target);
                  setSpokenText(testCase.spoken);
                  const result = PronunciationEvaluator.evaluate(testCase.target, testCase.spoken);
                  setScore(result);
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{testCase.description}</Badge>
                    <div className="text-sm text-muted-foreground">
                      点击测试
                    </div>
                  </div>
                  <div className="text-sm">
                    <div><strong>目标:</strong> {testCase.target}</div>
                    <div><strong>识别:</strong> {testCase.spoken}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}