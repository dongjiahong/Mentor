import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Trophy,
  Star,
  BarChart3,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
  Flame,
  Award
} from 'lucide-react';
import { VoiceLearningProgress, VoiceAttempt, VoiceLearningMode } from '@/types';
import { cn } from '@/lib/utils';

interface ProgressFeedbackCardProps {
  progress: VoiceLearningProgress;
  mode?: VoiceLearningMode;
  recentAttempts?: VoiceAttempt[];
  showDetailedStats?: boolean;
  onReset?: () => void;
  className?: string;
}

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
}

const modeLabels = {
  reading: '文本阅读',
  follow_along: '跟读练习',
  dialogue_practice: '对话练习', 
  listening_comprehension: '听力理解'
};

export function ProgressFeedbackCard({
  progress,
  mode,
  recentAttempts = [],
  showDetailedStats = true,
  onReset,
  className
}: ProgressFeedbackCardProps) {
  
  // 计算完成率
  const completionRate = progress.totalSentences > 0 
    ? Math.round((progress.completedSentences / progress.totalSentences) * 100)
    : 0;

  // 格式化时长
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // 获取成就等级
  const getAchievementLevel = (score: number): { label: string; color: string; icon: React.ComponentType<any> } => {
    if (score >= 90) return { label: '卓越', color: 'text-yellow-600', icon: Trophy };
    if (score >= 80) return { label: '优秀', color: 'text-green-600', icon: Award };
    if (score >= 70) return { label: '良好', color: 'text-blue-600', icon: Star };
    if (score >= 60) return { label: '及格', color: 'text-orange-600', icon: CheckCircle };
    return { label: '需努力', color: 'text-red-600', icon: Target };
  };

  // 计算趋势
  const calculateTrend = (): { direction: 'up' | 'down' | 'neutral'; percentage: number } => {
    if (recentAttempts.length < 2) return { direction: 'neutral', percentage: 0 };
    
    const recent = recentAttempts.slice(-3).map(a => a.similarity);
    const earlier = recentAttempts.slice(-6, -3).map(a => a.similarity);
    
    if (recent.length === 0 || earlier.length === 0) return { direction: 'neutral', percentage: 0 };
    
    const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, score) => sum + score, 0) / earlier.length;
    
    const difference = recentAvg - earlierAvg;
    const percentage = Math.abs(difference);
    
    if (difference > 2) return { direction: 'up', percentage };
    if (difference < -2) return { direction: 'down', percentage };
    return { direction: 'neutral', percentage };
  };

  const trend = calculateTrend();
  const achievement = getAchievementLevel(progress.averageScore);

  // 统计数据
  const stats: StatItem[] = [
    {
      label: '完成进度',
      value: `${progress.completedSentences}/${progress.totalSentences}`,
      icon: Target,
      color: 'text-blue-600'
    },
    {
      label: '平均分数',
      value: `${progress.averageScore}分`,
      icon: BarChart3,
      color: 'text-green-600',
      trend: trend.direction,
      trendValue: trend.percentage
    },
    {
      label: '最佳成绩',
      value: `${progress.bestScore}分`,
      icon: Trophy,
      color: 'text-yellow-600'
    },
    {
      label: '练习时长',
      value: formatDuration(progress.sessionDuration),
      icon: Clock,
      color: 'text-purple-600'
    }
  ];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            学习进度
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {mode && (
              <Badge variant="outline" className="text-xs">
                {modeLabels[mode] || mode}
              </Badge>
            )}
            
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 px-2"
              >
                重置
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 整体进度 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">整体完成度</h3>
            <span className="text-sm font-medium">{completionRate}%</span>
          </div>
          
          <Progress value={completionRate} className="h-2" />
          
          <div className="text-xs text-muted-foreground text-center">
            已完成 {progress.completedSentences} 个练习，共 {progress.totalSentences} 个
          </div>
        </div>

        {/* 成就展示 */}
        <div className="flex items-center justify-center p-4 bg-gradient-to-r from-background to-muted/50 rounded-lg border">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <achievement.icon className={cn("h-8 w-8", achievement.color)} />
            </div>
            <div className="font-medium">{achievement.label}</div>
            <div className="text-sm text-muted-foreground">
              当前水平
            </div>
          </div>
        </div>

        {/* 关键统计 */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="p-3 bg-background border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <IconComponent className={cn("h-4 w-4", stat.color)} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                  {stat.trend && stat.trend !== 'neutral' && (
                    <div className={cn(
                      "flex items-center text-xs",
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {stat.trend === 'up' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {stat.trendValue && stat.trendValue > 0 && (
                        <span>{Math.round(stat.trendValue)}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-lg font-semibold">{stat.value}</div>
              </div>
            );
          })}
        </div>

        {/* 详细统计 */}
        {showDetailedStats && progress.totalAttempts > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              详细统计
            </h3>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 bg-muted/50 rounded">
                <div className="text-sm font-medium">{progress.totalAttempts}</div>
                <div className="text-xs text-muted-foreground">总尝试次数</div>
              </div>
              
              <div className="p-2 bg-muted/50 rounded">
                <div className="text-sm font-medium">
                  {Math.round((progress.completedSentences / Math.max(progress.totalAttempts, 1)) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">成功率</div>
              </div>
              
              <div className="p-2 bg-muted/50 rounded">
                <div className="text-sm font-medium">
                  {progress.sessionDuration > 0 ? 
                    Math.round(progress.totalAttempts / (progress.sessionDuration / 60)) : 0
                  }
                </div>
                <div className="text-xs text-muted-foreground">每分钟尝试</div>
              </div>
            </div>
          </div>
        )}

        {/* 最近表现 */}
        {recentAttempts.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              最近表现
            </h3>
            
            <div className="space-y-2">
              {recentAttempts.slice(-5).map((attempt, index) => (
                <div key={attempt.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                  <span className="flex-1 truncate">{attempt.originalText}</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={attempt.similarity >= 80 ? "default" : 
                               attempt.similarity >= 60 ? "secondary" : "destructive"}
                      className="text-xs"
                    >
                      {attempt.similarity}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 鼓励信息 */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Flame className="h-4 w-4 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium text-blue-900">
                {completionRate === 100 ? '🎉 恭喜完成所有练习！' :
                 progress.averageScore >= 80 ? '👏 表现优秀，继续保持！' :
                 progress.averageScore >= 60 ? '💪 进步很大，再接再厉！' :
                 '🚀 继续练习，你一定可以的！'}
              </div>
              <div className="text-xs text-blue-700 mt-1">
                {completionRate === 100 ? '你已经掌握了这个内容，可以挑战更难的练习。' :
                 trend.direction === 'up' ? '你的表现正在稳步提升，太棒了！' :
                 trend.direction === 'down' ? '不要气馁，每次练习都是进步的机会。' :
                 '保持专注，每一次练习都有意义。'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}