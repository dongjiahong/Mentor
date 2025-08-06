import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReviewWordCard } from '@/components/features/ReviewWordCard';
import { useWordbook } from '@/hooks';
import { Word } from '@/types';

export function WordbookReviewPage() {
  const router = useRouter();
  const {
    getTodayReviewQueue,
    processReviewResult,
    loading,
    error,
    clearError
  } = useWordbook();

  // 本地状态
  const [reviewQueue, setReviewQueue] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    known: 0,
    familiar: 0,
    unknown: 0
  });
  const [pendingReviews, setPendingReviews] = useState<Array<{
    wordId: number;
    result: 'unknown' | 'familiar' | 'known';
  }>>([]);
  const [reviewedWordIds, setReviewedWordIds] = useState<Set<number>>(new Set());

  // 加载复习队列
  const loadReviewQueue = useCallback(async () => {
    try {
      const queue = await getTodayReviewQueue();
      setReviewQueue(queue);
      setCurrentIndex(0);
      setCompletedCount(0);
      setSessionStats({ known: 0, familiar: 0, unknown: 0 });
      setPendingReviews([]); // 清空待处理复习结果
      setReviewedWordIds(new Set()); // 清空已复习单词记录
    } catch (err) {
      console.error('加载复习队列失败:', err);
    }
  }, [getTodayReviewQueue]);

  // 初始化加载复习队列
  useEffect(() => {
    loadReviewQueue();
  }, []); // 移除依赖，避免无限循环

  // 处理复习结果（本地处理，不立即发送到服务端）
  const handleReviewResult = (
    wordId: number, 
    result: 'unknown' | 'familiar' | 'known'
  ) => {
    // 记录复习结果到待处理队列
    setPendingReviews(prev => [...prev, { wordId, result }]);
    
    // 更新统计
    setSessionStats(prev => ({
      ...prev,
      [result]: prev[result] + 1
    }));
    
    setCompletedCount(prev => prev + 1);
    
    // 根据结果处理队列
    if (result === 'unknown') {
      // 不会的单词重新排队到后面，但不标记为已复习
      const currentWord = reviewQueue[currentIndex];
      setReviewQueue(prev => {
        const newQueue = [...prev];
        newQueue.splice(currentIndex, 1); // 移除当前位置
        newQueue.push(currentWord); // 添加到末尾
        return newQueue;
      });
    } else {
      // 其他情况标记为已复习并移到下一个单词
      setReviewedWordIds(prev => new Set([...prev, wordId]));
      setCurrentIndex(prev => prev + 1);
    }
  };

  // 批量提交复习结果到服务端
  const submitPendingReviews = useCallback(async () => {
    if (pendingReviews.length === 0) return;
    
    try {
      // 批量处理复习结果
      for (const review of pendingReviews) {
        await processReviewResult(review.wordId, review.result);
      }
      
      // 清空待处理队列
      setPendingReviews([]);
      
      console.log(`已提交 ${pendingReviews.length} 个复习结果`);
    } catch (err) {
      console.error('提交复习结果失败:', err);
    }
  }, [pendingReviews, processReviewResult]);

  // 当复习完成时提交结果
  useEffect(() => {
    const isCompleted = currentIndex >= reviewQueue.length && reviewQueue.length > 0;
    if (isCompleted && pendingReviews.length > 0) {
      submitPendingReviews();
    }
  }, [currentIndex, reviewQueue.length, pendingReviews.length, submitPendingReviews]);

  // 重新开始复习
  const handleRestart = () => {
    // 先提交未处理的复习结果
    if (pendingReviews.length > 0) {
      submitPendingReviews();
    }
    // 重置状态
    setCurrentIndex(0);
    setCompletedCount(0);
    setSessionStats({ known: 0, familiar: 0, unknown: 0 });
    setPendingReviews([]);
    setReviewedWordIds(new Set());
    // 重新加载复习队列
    loadReviewQueue();
  };

  // 返回单词本
  const handleBack = () => {
    // 先提交未处理的复习结果
    if (pendingReviews.length > 0) {
      submitPendingReviews();
    }
    router.push('/wordbook');
  };

  // 计算进度
  const totalWords = reviewQueue.length;
  const progress = totalWords > 0 ? (completedCount / totalWords) * 100 : 0;
  const currentWord = reviewQueue[currentIndex];
  const isCompleted = currentIndex >= reviewQueue.length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* 错误提示 */}
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>
            {error.message}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearError}
              className="ml-2"
            >
              关闭
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回单词本</span>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">今日复习</h1>
            <p className="text-sm text-muted-foreground">
              {totalWords > 0 ? `共 ${totalWords} 个单词需要复习` : '暂无需要复习的单词'}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleRestart}
          disabled={loading}
          className="flex items-center space-x-2"
        >
          <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>重新开始</span>
        </Button>
      </div>

      {/* 进度条和统计 */}
      {totalWords > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="md:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{completedCount}</span>
                  <span>{totalWords}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  {Math.round(progress)}% 完成
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">记忆</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{sessionStats.known}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">查看</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{sessionStats.familiar}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">不会</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{sessionStats.unknown}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 复习内容 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : totalWords === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            今日复习已完成！
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            今天没有需要复习的单词，继续保持学习的好习惯。
          </p>
          <Button onClick={handleBack}>
            返回单词本
          </Button>
        </div>
      ) : isCompleted ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            复习完成！
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            恭喜你完成了今日的复习任务。
          </p>
          
          {/* 复习总结 */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <h4 className="font-medium mb-2">复习总结</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{sessionStats.known}</div>
                <div className="text-muted-foreground">记忆</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{sessionStats.familiar}</div>
                <div className="text-muted-foreground">查看</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{sessionStats.unknown}</div>
                <div className="text-muted-foreground">不会</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={handleRestart}>
              再次复习
            </Button>
            <Button onClick={handleBack}>
              返回单词本
            </Button>
          </div>
        </div>
      ) : currentWord ? (
        <div className="max-w-2xl mx-auto">
          {/* 当前单词位置指示 */}
          <div className="text-center mb-4">
            <div className="text-sm text-muted-foreground">
              第 {currentIndex + 1} / {totalWords} 个单词
            </div>
            {currentIndex > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                剩余 {totalWords - currentIndex - 1} 个单词
              </div>
            )}
          </div>

          {/* 复习卡片 */}
          <ReviewWordCard
            word={currentWord}
            onReviewResult={handleReviewResult}
            isReviewed={reviewedWordIds.has(currentWord.id)}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            加载复习内容...
          </h3>
        </div>
      )}
    </div>
  );
}