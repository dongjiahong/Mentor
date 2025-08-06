'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    TrendingUp,
    Target,
    Clock,
    Award,
    BookOpen,
    Mic,
    Volume2,
    BarChart3,
    RefreshCw
} from 'lucide-react';
import { ProgressPage } from '@/pages/ProgressPage';

/**
 * 成长报告演示组件
 * 展示成长报告页面的功能
 */
export function ProgressDemo() {
    const [isInitializing, setIsInitializing] = useState(false);

    // 初始化示例数据
    const initializeSampleData = async () => {
        setIsInitializing(true);
        try {
            const response = await fetch('/api/learning-records/init', {
                method: 'POST',
            });
            const result = await response.json();
            if (result.success) {
                console.log('示例数据初始化成功:', result.data);
                // 刷新页面以显示新数据
                window.location.reload();
            } else {
                console.error('初始化失败:', result.error);
            }
        } catch (error) {
            console.error('初始化示例数据失败:', error);
        } finally {
            setIsInitializing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* 标题和描述 */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">成长报告演示</h2>
                <p className="text-gray-600">
                    展示学习进度、能力分析和成就系统
                </p>
                <div className="pt-2">
                    <Button
                        onClick={initializeSampleData}
                        disabled={isInitializing}
                        variant="outline"
                        size="sm"
                        className="mr-2"
                    >
                        {isInitializing ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                初始化中...
                            </>
                        ) : (
                            <>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                初始化示例数据
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="demo" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="demo">功能演示</TabsTrigger>
                    <TabsTrigger value="progress">成长报告</TabsTrigger>
                </TabsList>

                {/* 功能演示 */}
                <TabsContent value="demo" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 数据可视化 */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center space-x-2">
                                    <BarChart3 className="h-4 w-4" />
                                    <span>数据可视化</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Target className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm">能力雷达图</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <span className="text-sm">学习活动分布</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-purple-600" />
                                        <span className="text-sm">进度趋势图</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 能力评估 */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center space-x-2">
                                    <Target className="h-4 w-4" />
                                    <span>能力评估</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <BookOpen className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm">词汇能力</span>
                                        <Badge variant="outline" className="ml-auto">A2</Badge>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Mic className="h-4 w-4 text-green-600" />
                                        <span className="text-sm">发音能力</span>
                                        <Badge variant="outline" className="ml-auto">B1</Badge>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Volume2 className="h-4 w-4 text-purple-600" />
                                        <span className="text-sm">阅读能力</span>
                                        <Badge variant="outline" className="ml-auto">A2</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 成就系统 */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center space-x-2">
                                    <Award className="h-4 w-4" />
                                    <span>成就系统</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm">学习达人</span>
                                        <Badge variant="secondary" className="ml-auto text-xs">新</Badge>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <BookOpen className="h-4 w-4 text-green-600" />
                                        <span className="text-sm">词汇小能手</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <TrendingUp className="h-4 w-4 text-orange-600" />
                                        <span className="text-sm">坚持不懈</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* 功能说明 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>功能说明</CardTitle>
                            <CardDescription>
                                成长报告页面的主要功能特性
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">数据可视化</h4>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                        <li>• 单词量、发音水平、阅读能力的进度图表</li>
                                        <li>• 学习活动分布饼图</li>
                                        <li>• 能力雷达图分析</li>
                                        <li>• 实时数据更新</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900">成长体系</h4>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                        <li>• 学习成就和里程碑显示</li>
                                        <li>• 水平提升提醒和庆祝反馈</li>
                                        <li>• 个性化学习建议</li>
                                        <li>• 能力水平自动评估</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 成长报告页面 */}
                <TabsContent value="progress" className="space-y-4">
                    <ProgressPage />
                </TabsContent>
            </Tabs>
        </div>
    );
}