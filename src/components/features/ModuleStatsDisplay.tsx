import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Clock,
  Award,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProficiencyAssessmentClient } from '@/services/client/ProficiencyAssessmentClient';
import { LearningRecordCollector } from '@/services/assessment/LearningRecordCollector';

interface ModuleStatsDisplayProps {
  module: 'reading' | 'listening' | 'speaking' | 'writing';
  className?: string;
  compact?: boolean;
}

interface ModuleStats {
  todayAccuracy: number;
  weekAccuracy: number;
  totalAttempts: number;
  recentTrend: 'up' | 'down' | 'stable';
}

const moduleDisplayNames = {
  reading: '阅读',
  listening: '听力',
  speaking: '口语',
  writing: '写作'
};

const moduleColors = {
  reading: 'text-blue-600',
  listening: 'text-green-600',
  speaking: 'text-orange-600',
  writing: 'text-purple-600'
};

const moduleColorsBg = {
  reading: 'bg-blue-50 border-blue-200',
  listening: 'bg-green-50 border-green-200',
  speaking: 'bg-orange-50 border-orange-200',
  writing: 'bg-purple-50 border-purple-200'
};

function getTrendIcon(trend: 'up' | 'down' | 'stable') {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    case 'down':
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    default:
      return <Minus className="h-3 w-3 text-gray-500" />;
  }
}

function getTrendText(trend: 'up' | 'down' | 'stable') {
  switch (trend) {
    case 'up':
      return '上升';
    case 'down':
      return '下降';
    default:
      return '稳定';
  }
}

function getAccuracyLevel(accuracy: number) {
  if (accuracy >= 90) return { level: '优秀', color: 'text-green-600' };
  if (accuracy >= 80) return { level: '良好', color: 'text-blue-600' };
  if (accuracy >= 70) return { level: '一般', color: 'text-yellow-600' };
  if (accuracy >= 60) return { level: '需改进', color: 'text-orange-600' };
  return { level: '待提升', color: 'text-red-600' };
}

export function ModuleStatsDisplay({ 
  module, 
  className,
  compact = false 
}: ModuleStatsDisplayProps) {
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const moduleStats = await ProficiencyAssessmentClient.getModuleStats(module);
        setStats(moduleStats);
      } catch (err) {
        console.error(`获取${module}模块统计失败:`, err);
        setError('获取统计失败');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [module]);

  if (loading) {
    return (
      <Card className={cn(moduleColorsBg[module], className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm">加载中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className={cn(moduleColorsBg[module], className)}>
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-500">
            {error || '暂无数据'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const accuracyLevel = getAccuracyLevel(stats.weekAccuracy);

  if (compact) {
    return (
      <Card className={cn(moduleColorsBg[module], className)}>
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">
                {moduleDisplayNames[module]}
              </div>
              <div className="text-xs text-gray-600">
                本周准确率: {stats.weekAccuracy}%
              </div>
            </div>
            <div className="text-right">
              <Badge 
                variant="secondary"
                className={cn('text-xs', accuracyLevel.color)}
              >
                {accuracyLevel.level}
              </Badge>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                {getTrendIcon(stats.recentTrend)}
                <span className="ml-1">{getTrendText(stats.recentTrend)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(moduleColorsBg[module], className)}>
      <CardHeader className="pb-2">
        <CardTitle className={cn('text-sm', moduleColors[module])}>
          {moduleDisplayNames[module]}统计
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 今日准确率 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>今日准确率</span>
            <span className="font-medium">{stats.todayAccuracy}%</span>
          </div>
          <Progress 
            value={stats.todayAccuracy} 
            className="h-1.5" 
          />
        </div>

        {/* 本周准确率 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>本周准确率</span>
            <span className="font-medium">{stats.weekAccuracy}%</span>
          </div>
          <Progress 
            value={stats.weekAccuracy} 
            className="h-1.5" 
          />
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-xs text-gray-600">总练习</div>
            <div className="font-medium text-sm">{stats.totalAttempts}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-600">近期趋势</div>
            <div className="flex items-center justify-center">
              {getTrendIcon(stats.recentTrend)}
              <span className="ml-1 text-sm">{getTrendText(stats.recentTrend)}</span>
            </div>
          </div>
        </div>

        {/* 水平评级 */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">当前水平</span>
            <Badge 
              variant="secondary"
              className={cn('text-xs', accuracyLevel.color)}
            >
              {accuracyLevel.level}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 用于学习页面主界面的模块统计概览
export function ModuleStatsOverview() {
  const modules: Array<'reading' | 'listening' | 'speaking' | 'writing'> = 
    ['reading', 'listening', 'speaking', 'writing'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {modules.map(module => (
        <ModuleStatsDisplay 
          key={module}
          module={module}
          compact
        />
      ))}
    </div>
  );
}

// 用于练习页面的详细统计显示
export function DetailedModuleStats({ 
  module 
}: { 
  module: 'reading' | 'listening' | 'speaking' | 'writing' 
}) {
  return (
    <div className="space-y-4">
      <ModuleStatsDisplay module={module} />
      
      {/* 可以在这里添加更多详细统计，如历史趋势图表等 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">学习建议</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            基于您的{moduleDisplayNames[module]}表现，建议继续保持练习频率，
            重点关注准确率的提升。
          </div>
        </CardContent>
      </Card>
    </div>
  );
}