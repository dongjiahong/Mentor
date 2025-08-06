import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Archive,
  Headphones,
  Mic,
  BookOpen,
  PenTool,
  ChevronRight,
  Clock,
  Star,
  Target,
  TrendingUp,
  Users,
  BookMarked
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LearningModule, 
  LEARNING_MODULE_DESCRIPTIONS 
} from '@/types';

interface ModuleLearningSelectorProps {
  selectedModule?: LearningModule;
  onModuleSelect: (module: LearningModule) => void;
  className?: string;
  showDetails?: boolean;
  userLevel?: string;
  userProgress?: Record<LearningModule, {
    totalTime: number;
    completedSessions: number;
    averageScore: number;
    streak: number;
  }>;
}

// 模块图标映射
const moduleIcons = {
  content: Archive,
  listening: Headphones,
  speaking: Mic,
  reading: BookOpen,
  writing: PenTool
};

// 模块难度映射
const moduleDifficulty = {
  content: { level: '入门', stars: 1 },
  reading: { level: '基础', stars: 2 },
  listening: { level: '中级', stars: 3 },
  speaking: { level: '中级', stars: 3 },
  writing: { level: '高级', stars: 4 }
};

// 模块推荐顺序
const learningPath = ['content', 'reading', 'listening', 'speaking', 'writing'] as LearningModule[];

// 模块统计数据（模拟）
const moduleStats = {
  content: { totalContents: 156, newThisWeek: 12, categories: 8 },
  listening: { totalExercises: 89, avgAccuracy: 78, popularTopics: ['日常对话', '新闻听力', '学术讲座'] },
  speaking: { totalExercises: 64, avgPronunciation: 82, practiceTypes: ['跟读', '对话', '自由表达'] },
  reading: { totalArticles: 124, avgReadingSpeed: 195, topics: ['科技', '文化', '商务'] },
  writing: { totalExercises: 43, avgScore: 75, types: ['邮件写作', '议论文', '创意写作'] }
};

export function ModuleLearningSelector({
  selectedModule,
  onModuleSelect,
  className,
  showDetails = true,
  userLevel = 'B1',
  userProgress
}: ModuleLearningSelectorProps) {
  const [hoveredModule, setHoveredModule] = useState<LearningModule | null>(null);

  // 获取推荐标签
  const getRecommendationBadge = useCallback((module: LearningModule) => {
    if (!userProgress) return null;

    const progress = userProgress[module];
    if (!progress) {
      if (module === 'content') return <Badge variant="secondary">开始学习</Badge>;
      return <Badge variant="outline">待解锁</Badge>;
    }

    if (progress.streak >= 7) {
      return <Badge className="bg-orange-500">热门练习</Badge>;
    }
    
    if (progress.averageScore >= 85) {
      return <Badge className="bg-green-500">表现优秀</Badge>;
    }

    if (progress.completedSessions < 5) {
      return <Badge variant="secondary">继续练习</Badge>;
    }

    return null;
  }, [userProgress]);

  // 获取模块进度百分比
  const getProgressPercentage = useCallback((module: LearningModule) => {
    if (!userProgress || !userProgress[module]) return 0;
    
    const progress = userProgress[module];
    // 简单的进度计算：基于完成的会话数和平均分数
    return Math.min(100, (progress.completedSessions * 10) + (progress.averageScore * 0.5));
  }, [userProgress]);

  // 渲染模块卡片
  const renderModuleCard = (module: LearningModule) => {
    const moduleInfo = LEARNING_MODULE_DESCRIPTIONS[module];
    const IconComponent = moduleIcons[module];
    const difficulty = moduleDifficulty[module];
    const isSelected = selectedModule === module;
    const isHovered = hoveredModule === module;
    const recommendationBadge = getRecommendationBadge(module);
    const progressPercentage = getProgressPercentage(module);
    const stats = moduleStats[module];
    const userModuleProgress = userProgress?.[module];

    return (
      <Card
        key={module}
        className={cn(
          "group relative overflow-hidden border-2 transition-all duration-300 cursor-pointer",
          "hover:scale-102 hover:shadow-lg",
          isSelected 
            ? "border-primary shadow-lg bg-primary/5 scale-102" 
            : "border-border hover:border-primary/50",
          "bg-gradient-to-br from-background to-background/50"
        )}
        onMouseEnter={() => setHoveredModule(module)}
        onMouseLeave={() => setHoveredModule(null)}
        onClick={() => onModuleSelect(module)}
      >
        {/* 背景装饰 */}
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-5 transition-opacity",
            moduleInfo.color,
            isSelected || isHovered ? "opacity-10" : "opacity-5"
          )}
        />

        <CardHeader className="relative pb-4">
          <div className="flex items-start justify-between mb-3">
            {/* 图标 */}
            <div className={cn(
              "p-3 rounded-xl bg-gradient-to-br transition-all duration-300 shadow-md",
              moduleInfo.color,
              "text-white",
              isSelected || isHovered ? "shadow-lg scale-110" : ""
            )}>
              <IconComponent className="h-7 w-7" />
            </div>

            {/* 推荐标签 */}
            <div className="flex flex-col items-end gap-2">
              {recommendationBadge}
              {isSelected && (
                <div className="flex items-center text-primary">
                  <Star className="h-4 w-4 fill-current" />
                </div>
              )}
            </div>
          </div>

          {/* 标题和难度 */}
          <div>
            <CardTitle className="text-xl font-bold text-foreground mb-2">
              {moduleInfo.title}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < difficulty.stars ? "text-yellow-400 fill-current" : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {difficulty.level}
              </span>
            </div>
          </div>

          {/* 进度条 */}
          {userProgress && progressPercentage > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">学习进度</span>
                <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className={cn("h-2 rounded-full transition-all duration-300 bg-gradient-to-r", moduleInfo.color)}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="relative pt-0">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
            {moduleInfo.description}
          </p>

          {/* 模块统计信息 */}
          <div className="space-y-3 mb-4">
            {module === 'content' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <BookMarked className="h-3 w-3 text-blue-600" />
                  <span>{stats.totalContents} 个内容</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span>本周新增 {stats.newThisWeek}</span>
                </div>
              </div>
            )}

            {module === 'listening' && (
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">练习数量</span>
                  <span className="font-medium">{stats.totalExercises}</span>
                </div>
                {userModuleProgress && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">平均准确率</span>
                    <span className="font-medium text-green-600">{userModuleProgress.averageScore}%</span>
                  </div>
                )}
              </div>
            )}

            {module === 'speaking' && (
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">发音练习</span>
                  <span className="font-medium">{stats.totalExercises}</span>
                </div>
                {userModuleProgress && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">发音得分</span>
                    <span className="font-medium text-blue-600">{userModuleProgress.averageScore}%</span>
                  </div>
                )}
              </div>
            )}

            {module === 'reading' && (
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">文章数量</span>
                  <span className="font-medium">{stats.totalArticles}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">平均速度</span>
                  <span className="font-medium text-purple-600">{stats.avgReadingSpeed} 字/分</span>
                </div>
              </div>
            )}

            {module === 'writing' && (
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">写作练习</span>
                  <span className="font-medium">{stats.totalExercises}</span>
                </div>
                {userModuleProgress && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">平均得分</span>
                    <span className="font-medium text-pink-600">{userModuleProgress.averageScore}分</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 用户学习数据 */}
          {userModuleProgress && (
            <div className="space-y-2 text-xs border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">完成会话</span>
                <span className="font-medium">{userModuleProgress.completedSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">学习时长</span>
                <span className="font-medium">
                  {Math.round(userModuleProgress.totalTime / 60)} 分钟
                </span>
              </div>
              {userModuleProgress.streak > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">连续天数</span>
                  <span className="font-medium text-orange-600">
                    {userModuleProgress.streak} 天 🔥
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 选择指示器 */}
          {isSelected && (
            <div className="absolute bottom-3 right-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
          )}
        </CardContent>

        {/* Hover 效果 */}
        {(isHovered || isSelected) && (
          <div className="absolute inset-0 border-2 border-primary/20 rounded-lg pointer-events-none" />
        )}
      </Card>
    );
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* 头部介绍 */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">选择学习模块</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          我们提供听说读写和内容管理五大学习模块，帮助您全面提升英语能力。根据您的学习目标选择合适的模块开始练习。
        </p>
      </div>


      {/* 模块卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {learningPath.map(renderModuleCard)}
      </div>

      {/* 详细说明面板 */}
      {selectedModule && showDetails && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-4 rounded-xl bg-gradient-to-br text-white shadow-lg",
                LEARNING_MODULE_DESCRIPTIONS[selectedModule].color
              )}>
                {(() => {
                  const IconComponent = moduleIcons[selectedModule];
                  return <IconComponent className="h-8 w-8" />;
                })()}
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-foreground">
                      {LEARNING_MODULE_DESCRIPTIONS[selectedModule].title}
                    </h3>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-4 w-4",
                            i < moduleDifficulty[selectedModule].stars ? "text-yellow-400 fill-current" : "text-gray-300"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">
                    {LEARNING_MODULE_DESCRIPTIONS[selectedModule].description}
                  </p>
                </div>

                {/* 模块特色功能 */}
                <div>
                  <h4 className="font-medium mb-2">模块特色：</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {selectedModule === 'content' && (
                      <>
                        <div className="flex items-center gap-2">
                          <BookMarked className="h-4 w-4 text-blue-600" />
                          <span>统一内容管理</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <span>智能内容推荐</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          <span>多模块共享</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <span>内容分析统计</span>
                        </div>
                      </>
                    )}
                    
                    {selectedModule === 'listening' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Headphones className="h-4 w-4 text-green-600" />
                          <span>多速度播放</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span>听力理解测试</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-600" />
                          <span>听力训练计时</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-orange-600" />
                          <span>听力文稿对照</span>
                        </div>
                      </>
                    )}
                    
                    {selectedModule === 'speaking' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Mic className="h-4 w-4 text-red-600" />
                          <span>语音识别</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span>发音评分</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          <span>对话练习</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span>发音改进建议</span>
                        </div>
                      </>
                    )}
                    
                    {selectedModule === 'reading' && (
                      <>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span>阅读速度测试</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <span>理解能力测试</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookMarked className="h-4 w-4 text-purple-600" />
                          <span>词汇积累</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span>阅读时间统计</span>
                        </div>
                      </>
                    )}
                    
                    {selectedModule === 'writing' && (
                      <>
                        <div className="flex items-center gap-2">
                          <PenTool className="h-4 w-4 text-pink-600" />
                          <span>AI写作评分</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span>多维度评估</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookMarked className="h-4 w-4 text-green-600" />
                          <span>写作模板</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span>改进建议</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      适合 {userLevel} 级别
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      建议每次练习 15-30 分钟
                    </div>
                  </div>
                  
                  <Button 
                    size="sm"
                    className="ml-4"
                    onClick={() => onModuleSelect(selectedModule)}
                  >
                    开始练习
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}