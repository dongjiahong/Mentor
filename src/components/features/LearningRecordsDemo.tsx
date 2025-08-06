'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BookOpen,
    Headphones,
    Mic,
    Languages,
    Clock,
    Target,
    TrendingUp,
    Award,
    BarChart3,
    Calendar
} from 'lucide-react';
import { useLearningRecords, useLearningStats, useLearningAbilities } from '@/hooks/useLearningRecords';
import { ActivityType, EnglishLevel } from '@/types';

/**
 * 学习记录演示组件
 * 展示学习行为记录系统的功能
 */
export function LearningRecordsDemo() {
    const {
        isInitialized,
        stats,
        recentRecords,
        recordReading,
        recordListening,
        recordSpeaking,
        recordTranslation,
        refreshStats
    } = useLearningRecords();

    const {
        todayStats,
        weeklyStats,
        monthlyStats,
        refreshAllStats
    } = useLearningStats();

    const {
        abilities,
        levelUpgrade,
        evaluateAbilities,
        checkLevelUpgrade
    } = useLearningAbilities();

    const [isRecording, setIsRecording] = useState(false);
    const [recordingActivity, setRecordingActivity] = useState<ActivityType | null>(null);

    // 模拟记录学习活动
    const simulateActivity = async (activityType: ActivityType) => {
        setIsRecording(true);
        setRecordingActivity(activityType);

        try {
            const timeSpent = Math.floor(Math.random() * 300) + 60; // 60-360秒
            const accuracyScore = Math.floor(Math.random() * 30) + 70; // 70-100分

            switch (activityType) {
                case 'reading':
                    await recordReading({
                        timeSpent,
                        wordsRead: Math.floor(timeSpent / 2),
                        comprehensionScore: accuracyScore
                    });
                    break;
                case 'listening':
                    await recordListening({
                        timeSpent,
                        comprehensionScore: accuracyScore,
                        playbackSpeed: 1.0
                    });
                    break;
                case 'speaking':
                    await recordSpeaking({
                        word: 'example',
                        timeSpent,
                        pronunciationScore: accuracyScore,
                        attempts: Math.floor(Math.random() * 3) + 1
                    });
                    break;
                case 'translation':
                    await recordTranslation({
                        word: 'example',
                        timeSpent,
                        accuracyScore: accuracyScore,
                        translationType: 'word'
                    });
                    break;
            }

            // 刷新统计数据
            await refreshAllStats();
            await evaluateAbilities();
            await checkLevelUpgrade();
        } catch (error) {
            console.error('记录学习活动失败:', error);
        } finally {
            setIsRecording(false);
            setRecordingActivity(null);
        }
    };

    // 格式化时间显示
    const formatTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}小时${minutes}分钟`;
        } else if (minutes > 0) {
            return `${minutes}分钟${secs}秒`;
        } else {
            return `${secs}秒`;
        }
    };

    // 获取水平颜色
    const getLevelColor = (level: EnglishLevel): string => {
        const colors = {
            'A1': 'bg-red-100 text-red-800',
            'A2': 'bg-orange-100 text-orange-800',
            'B1': 'bg-yellow-100 text-yellow-800',
            'B2': 'bg-blue-100 text-blue-800',
            'C1': 'bg-green-100 text-green-800',
            'C2': 'bg-purple-100 text-purple-800'
        };
        return colors[level] || 'bg-gray-100 text-gray-800';
    };

    // 初始化示例数据
    const initializeSampleData = async () => {
        try {
            const response = await fetch('/api/learning-records/init', {
                method: 'POST',
            });
            const result = await response.json();
            if (result.success) {
                // 刷新所有数据
                await refreshAllStats();
                await evaluateAbilities();
                await checkLevelUpgrade();
                console.log('示例数据初始化成功');
            }
        } catch (error) {
            console.error('初始化示例数据失败:', error);
        }
    };

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">正在初始化学习记录系统...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 标题和描述 */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">学习行为记录系统</h2>
                <p className="text-gray-600">
                    记录和分析您的学习活动，提供个性化的学习建议和能力评估
                </p>
                <div className="pt-2">
                    <Button
                        onClick={initializeSampleData}
                        variant="outline"
                        size="sm"
                    >
                        初始化示例数据
                    </Button>
                </div>
            </div>

            {/* 水平升级提醒 */}
            {levelUpgrade.data?.shouldUpgrade && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-green-800">恭喜！建议升级英语水平</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-green-700 mb-3">{levelUpgrade.data.reason}</p>
                        <div className="flex items-center space-x-4">
                            <Badge className={getLevelColor(levelUpgrade.data.currentLevel)}>
                                当前: {levelUpgrade.data.currentLevel}
                            </Badge>
                            <span className="text-green-600">→</span>
                            <Badge className={getLevelColor(levelUpgrade.data.suggestedLevel)}>
                                建议: {levelUpgrade.data.suggestedLevel}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="activities" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="activities">学习活动</TabsTrigger>
                    <TabsTrigger value="stats">统计数据</TabsTrigger>
                    <TabsTrigger value="abilities">能力评估</TabsTrigger>
                    <TabsTrigger value="records">学习记录</TabsTrigger>
                </TabsList>

                {/* 学习活动记录 */}
                <TabsContent value="activities" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5" />
                                <span>记录学习活动</span>
                            </CardTitle>
                            <CardDescription>
                                点击下方按钮模拟记录不同类型的学习活动
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Button
                                    onClick={() => simulateActivity('reading')}
                                    disabled={isRecording}
                                    className="h-20 flex-col space-y-2"
                                    variant={recordingActivity === 'reading' ? 'default' : 'outline'}
                                >
                                    <BookOpen className="h-6 w-6" />
                                    <span>阅读练习</span>
                                    {recordingActivity === 'reading' && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    )}
                                </Button>

                                <Button
                                    onClick={() => simulateActivity('listening')}
                                    disabled={isRecording}
                                    className="h-20 flex-col space-y-2"
                                    variant={recordingActivity === 'listening' ? 'default' : 'outline'}
                                >
                                    <Headphones className="h-6 w-6" />
                                    <span>听力练习</span>
                                    {recordingActivity === 'listening' && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    )}
                                </Button>

                                <Button
                                    onClick={() => simulateActivity('speaking')}
                                    disabled={isRecording}
                                    className="h-20 flex-col space-y-2"
                                    variant={recordingActivity === 'speaking' ? 'default' : 'outline'}
                                >
                                    <Mic className="h-6 w-6" />
                                    <span>口语练习</span>
                                    {recordingActivity === 'speaking' && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    )}
                                </Button>

                                <Button
                                    onClick={() => simulateActivity('translation')}
                                    disabled={isRecording}
                                    className="h-20 flex-col space-y-2"
                                    variant={recordingActivity === 'translation' ? 'default' : 'outline'}
                                >
                                    <Languages className="h-6 w-6" />
                                    <span>翻译练习</span>
                                    {recordingActivity === 'translation' && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 统计数据 */}
                <TabsContent value="stats" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 今日统计 */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center space-x-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>今日学习</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {todayStats.status === 'loading' ? (
                                    <div className="animate-pulse space-y-2">
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    </div>
                                ) : todayStats.data ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">学习时间</span>
                                            <span className="font-medium">{formatTime(todayStats.data.totalStudyTime)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">平均准确率</span>
                                            <span className="font-medium">{todayStats.data.averageAccuracy.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">连续天数</span>
                                            <span className="font-medium">{todayStats.data.streakDays}天</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-gray-500 text-sm">暂无今日数据</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* 本周统计 */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center space-x-2">
                                    <BarChart3 className="h-4 w-4" />
                                    <span>本周学习</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {weeklyStats.status === 'loading' ? (
                                    <div className="animate-pulse space-y-2">
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    </div>
                                ) : weeklyStats.data ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">学习时间</span>
                                            <span className="font-medium">{formatTime(weeklyStats.data.totalStudyTime)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">掌握单词</span>
                                            <span className="font-medium">{weeklyStats.data.masteredWords}个</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">平均准确率</span>
                                            <span className="font-medium">{weeklyStats.data.averageAccuracy.toFixed(1)}%</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-gray-500 text-sm">暂无本周数据</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* 本月统计 */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center space-x-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>本月学习</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {monthlyStats.status === 'loading' ? (
                                    <div className="animate-pulse space-y-2">
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    </div>
                                ) : monthlyStats.data ? (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">学习时间</span>
                                            <span className="font-medium">{formatTime(monthlyStats.data.totalStudyTime)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">总单词数</span>
                                            <span className="font-medium">{monthlyStats.data.totalWords}个</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">掌握单词</span>
                                            <span className="font-medium">{monthlyStats.data.masteredWords}个</span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-gray-500 text-sm">暂无本月数据</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* 活动类型分布 */}
                    {stats.data && (
                        <Card>
                            <CardHeader>
                                <CardTitle>学习活动分布</CardTitle>
                                <CardDescription>各类学习活动的参与情况</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {Object.entries(stats.data.activitiesByType).map(([type, count]) => {
                                        const total = Object.values(stats.data!.activitiesByType).reduce((sum, c) => sum + c, 0);
                                        const percentage = total > 0 ? (count / total) * 100 : 0;

                                        const typeNames = {
                                            reading: '阅读',
                                            listening: '听力',
                                            speaking: '口语',
                                            translation: '翻译'
                                        };

                                        return (
                                            <div key={type} className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>{typeNames[type as keyof typeof typeNames]}</span>
                                                    <span>{count}次 ({percentage.toFixed(1)}%)</span>
                                                </div>
                                                <Progress value={percentage} className="h-2" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* 能力评估 */}
                <TabsContent value="abilities" className="space-y-4">
                    {abilities.status === 'loading' ? (
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <span className="ml-2">正在评估能力水平...</span>
                                </div>
                            </CardContent>
                        </Card>
                    ) : abilities.data ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 词汇能力 */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center space-x-2">
                                        <BookOpen className="h-4 w-4" />
                                        <span>词汇能力</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <Badge className={getLevelColor(abilities.data.vocabularyLevel.level)}>
                                            {abilities.data.vocabularyLevel.level}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>掌握程度</span>
                                            <span>{abilities.data.vocabularyLevel.score.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={abilities.data.vocabularyLevel.score} className="h-2" />
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex justify-between">
                                            <span>总单词数:</span>
                                            <span>{abilities.data.vocabularyLevel.totalWords}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>掌握单词:</span>
                                            <span>{abilities.data.vocabularyLevel.masteredWords}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 发音能力 */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center space-x-2">
                                        <Mic className="h-4 w-4" />
                                        <span>发音能力</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <Badge className={getLevelColor(abilities.data.pronunciationLevel.level)}>
                                            {abilities.data.pronunciationLevel.level}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>准确率</span>
                                            <span>{abilities.data.pronunciationLevel.score.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={abilities.data.pronunciationLevel.score} className="h-2" />
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex justify-between">
                                            <span>平均准确率:</span>
                                            <span>{abilities.data.pronunciationLevel.averageAccuracy.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>近期改进:</span>
                                            <span className={abilities.data.pronunciationLevel.recentImprovement >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {abilities.data.pronunciationLevel.recentImprovement >= 0 ? '+' : ''}
                                                {abilities.data.pronunciationLevel.recentImprovement.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 阅读能力 */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center space-x-2">
                                        <Target className="h-4 w-4" />
                                        <span>阅读能力</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center">
                                        <Badge className={getLevelColor(abilities.data.readingLevel.level)}>
                                            {abilities.data.readingLevel.level}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>理解能力</span>
                                            <span>{abilities.data.readingLevel.score.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={abilities.data.readingLevel.score} className="h-2" />
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex justify-between">
                                            <span>理解准确率:</span>
                                            <span>{abilities.data.readingLevel.comprehensionAccuracy.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>平均阅读时间:</span>
                                            <span>{formatTime(abilities.data.readingLevel.averageReadingTime)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <p className="text-gray-500">暂无能力评估数据</p>
                                <Button
                                    onClick={evaluateAbilities}
                                    className="mt-4"
                                    variant="outline"
                                >
                                    开始评估
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* 学习记录 */}
                <TabsContent value="records" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Clock className="h-5 w-5" />
                                <span>最近学习记录</span>
                            </CardTitle>
                            <CardDescription>
                                显示最近的学习活动记录
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentRecords.status === 'loading' ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="animate-pulse flex items-center space-x-4 p-3 border rounded">
                                            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : recentRecords.data && recentRecords.data.length > 0 ? (
                                <div className="space-y-3">
                                    {recentRecords.data.map((record) => {
                                        const activityIcons = {
                                            reading: BookOpen,
                                            listening: Headphones,
                                            speaking: Mic,
                                            translation: Languages
                                        };

                                        const activityNames = {
                                            reading: '阅读练习',
                                            listening: '听力练习',
                                            speaking: '口语练习',
                                            translation: '翻译练习'
                                        };

                                        const Icon = activityIcons[record.activityType];

                                        return (
                                            <div key={record.id} className="flex items-center space-x-4 p-3 border rounded hover:bg-gray-50">
                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <Icon className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {activityNames[record.activityType]}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {record.createdAt.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-4 mt-1">
                                                        <span className="text-xs text-gray-500">
                                                            时长: {formatTime(record.timeSpent)}
                                                        </span>
                                                        {record.accuracyScore && (
                                                            <span className="text-xs text-gray-500">
                                                                准确率: {record.accuracyScore.toFixed(1)}%
                                                            </span>
                                                        )}
                                                        {record.word && (
                                                            <span className="text-xs text-blue-600">
                                                                单词: {record.word}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">暂无学习记录</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        开始学习活动后，记录将显示在这里
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}