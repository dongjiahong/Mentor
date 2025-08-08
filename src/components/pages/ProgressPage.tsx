import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Target,
  Clock,
  Award,
  Mic,
  Volume2,
  ArrowUp,
  X,
  BookOpen
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useLearningStats, useLearningAbilities, useLearningReport } from '@/hooks/useLearningRecords';
import { EnglishLevel } from '@/types';


// 水平升级提醒组件
function LevelUpgradeNotification({
  upgrade,
  onClose
}: {
  upgrade: {
    shouldUpgrade: boolean;
    currentLevel: EnglishLevel;
    suggestedLevel: EnglishLevel;
    reason: string;
  };
  onClose: () => void;
}) {
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <ArrowUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              🎉 恭喜！建议提升英语水平
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              从 <span className="font-bold">{upgrade.currentLevel}</span> 升级到{' '}
              <span className="font-bold">{upgrade.suggestedLevel}</span>
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              {upgrade.reason}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-yellow-500 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// 能力雷达图组件
function AbilityRadarChart({ abilities }: { abilities: any }) {
  const data = [
    {
      ability: '词汇量',
      score: abilities.vocabularyLevel.score,
      fullMark: 100,
    },
    {
      ability: '发音',
      score: abilities.pronunciationLevel.score,
      fullMark: 100,
    },
    {
      ability: '阅读',
      score: abilities.readingLevel.score,
      fullMark: 100,
    },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="ability" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar
          name="能力分数"
          dataKey="score"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.3}
        />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// 学习活动分布饼图
function ActivityPieChart({ activitiesByType }: { activitiesByType: Record<string, number> }) {
  const data = [
    { name: '阅读', value: activitiesByType.reading, color: '#8884d8' },
    { name: '听力', value: activitiesByType.listening, color: '#82ca9d' },
    { name: '口语', value: activitiesByType.speaking, color: '#ffc658' },
    { name: '翻译', value: activitiesByType.translation, color: '#ff7300' },
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>暂无学习活动数据</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}


export function ProgressPage() {
  const { todayStats, weeklyStats, monthlyStats, isInitialized } = useLearningStats();
  const { abilities, levelUpgrade } = useLearningAbilities();
  const [showLevelUpgrade, setShowLevelUpgrade] = useState(false);

  // 检查水平升级提醒
  useEffect(() => {
    if (levelUpgrade.status === 'success' && levelUpgrade.data?.shouldUpgrade) {
      setShowLevelUpgrade(true);
    }
  }, [levelUpgrade]);


  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!isInitialized) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">正在加载学习数据...</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = monthlyStats.data;
  const todayData = todayStats.data;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">成长报告</h1>
        <p className="text-muted-foreground">
          查看您的学习进度和成长轨迹
        </p>
      </div>

      {/* 水平升级提醒 */}
      {showLevelUpgrade && levelUpgrade.data && (
        <LevelUpgradeNotification
          upgrade={levelUpgrade.data}
          onClose={() => setShowLevelUpgrade(false)}
        />
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">单词量</span>
          </div>
          <div className="text-2xl font-bold text-card-foreground">
            {stats?.masteredWords || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            已掌握单词 / 总计 {stats?.totalWords || 0}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">发音准确率</span>
          </div>
          <div className="text-2xl font-bold text-card-foreground">
            {stats?.averageAccuracy ? `${stats.averageAccuracy.toFixed(1)}%` : '0%'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">平均准确率</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">学习时长</span>
          </div>
          <div className="text-2xl font-bold text-card-foreground">
            {stats?.totalStudyTime ? formatTime(stats.totalStudyTime) : '0m'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            今日: {todayData?.totalStudyTime ? formatTime(todayData.totalStudyTime) : '0m'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">连续学习</span>
          </div>
          <div className="text-2xl font-bold text-card-foreground">
            {stats?.streakDays || 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">天</p>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* 能力分析雷达图 */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">能力分析</h3>
          {abilities.status === 'success' && abilities.data ? (
            <AbilityRadarChart abilities={abilities.data} />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>正在分析您的能力水平...</p>
              </div>
            </div>
          )}
        </div>

        {/* 学习活动分布 */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">学习活动分布</h3>
          {stats?.activitiesByType ? (
            <ActivityPieChart activitiesByType={stats.activitiesByType} />
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>暂无学习活动数据</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 能力详细信息 */}
      {abilities.status === 'success' && abilities.data && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-card-foreground">词汇能力</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">当前水平</span>
                <span className="font-semibold">{abilities.data.vocabularyLevel.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">掌握单词</span>
                <span className="font-semibold">{abilities.data.vocabularyLevel.masteredWords}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">总单词数</span>
                <span className="font-semibold">{abilities.data.vocabularyLevel.totalWords}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, abilities.data.vocabularyLevel.score)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Mic className="h-6 w-6 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-card-foreground">发音能力</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">当前水平</span>
                <span className="font-semibold">{abilities.data.pronunciationLevel.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">平均准确率</span>
                <span className="font-semibold">{abilities.data.pronunciationLevel.averageAccuracy.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, abilities.data.pronunciationLevel.score)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Volume2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-card-foreground">阅读能力</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">当前水平</span>
                <span className="font-semibold">{abilities.data.readingLevel.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">理解准确率</span>
                <span className="font-semibold">{abilities.data.readingLevel.comprehensionAccuracy.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, abilities.data.readingLevel.score)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}