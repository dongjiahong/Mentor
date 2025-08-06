import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Mic, 
  MessageSquare, 
  Headphones,
  Clock,
  Star,
  ChevronRight,
  Volume2
} from 'lucide-react';
import { VoiceLearningMode } from '@/types';
import { cn } from '@/lib/utils';

interface LearningModeOption {
  mode: VoiceLearningMode;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  features: string[];
  color: string;
}

interface LearningModeSelectorProps {
  selectedMode?: VoiceLearningMode;
  onModeSelect: (mode: VoiceLearningMode) => void;
  className?: string;
  showDetails?: boolean;
}

const learningModes: LearningModeOption[] = [
  {
    mode: 'reading',
    title: '文本阅读',
    description: '专注于阅读理解，提升词汇量和语感',
    icon: BookOpen,
    difficulty: 'beginner',
    estimatedTime: '5-10 分钟',
    features: ['单词查询', '翻译对照', '语音朗读'],
    color: 'from-blue-500 to-blue-600'
  },
  {
    mode: 'follow_along',
    title: '跟读练习',
    description: '听标准发音，跟读练习，提升口语表达',
    icon: Mic,
    difficulty: 'intermediate',
    estimatedTime: '8-15 分钟',
    features: ['语音识别', '发音评分', '实时反馈'],
    color: 'from-green-500 to-green-600'
  },
  {
    mode: 'dialogue_practice',
    title: '对话练习',
    description: '模拟真实对话场景，提升交流能力',
    icon: MessageSquare,
    difficulty: 'intermediate',
    estimatedTime: '10-20 分钟',
    features: ['情景对话', '智能提示', '角色扮演'],
    color: 'from-purple-500 to-purple-600'
  },
  {
    mode: 'listening_comprehension',
    title: '听力理解',
    description: '训练听力技能，提升理解能力',
    icon: Headphones,
    difficulty: 'advanced',
    estimatedTime: '15-25 分钟',
    features: ['听力测试', '理解问答', '复述练习'],
    color: 'from-orange-500 to-orange-600'
  }
];

const difficultyConfig = {
  beginner: { label: '初级', color: 'bg-green-100 text-green-800', icon: '⭐' },
  intermediate: { label: '中级', color: 'bg-yellow-100 text-yellow-800', icon: '⭐⭐' },
  advanced: { label: '高级', color: 'bg-red-100 text-red-800', icon: '⭐⭐⭐' }
};

export function LearningModeSelector({ 
  selectedMode, 
  onModeSelect, 
  className,
  showDetails = true 
}: LearningModeSelectorProps) {
  const [hoveredMode, setHoveredMode] = useState<VoiceLearningMode | null>(null);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">选择学习模式</h2>
        <p className="text-muted-foreground">
          根据你的学习目标和水平，选择最适合的练习模式
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {learningModes.map((option) => {
          const IconComponent = option.icon;
          const isSelected = selectedMode === option.mode;
          const isHovered = hoveredMode === option.mode;
          const difficultyInfo = difficultyConfig[option.difficulty];

          return (
            <Card 
              key={option.mode}
              className={cn(
                "group relative overflow-hidden border-2 transition-all duration-300 cursor-pointer transform hover:scale-105",
                isSelected 
                  ? "border-primary shadow-lg bg-primary/5" 
                  : "border-border hover:border-primary/50 hover:shadow-md",
                "bg-gradient-to-br from-background to-background/50"
              )}
              onMouseEnter={() => setHoveredMode(option.mode)}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => onModeSelect(option.mode)}
            >
              {/* 背景渐变效果 */}
              <div 
                className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-5 transition-opacity",
                  option.color,
                  isSelected || isHovered ? "opacity-10" : "opacity-5"
                )}
              />
              
              <CardHeader className="relative pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn(
                    "p-3 rounded-lg bg-gradient-to-br transition-all duration-300",
                    option.color,
                    "text-white shadow-md",
                    isSelected || isHovered ? "shadow-lg scale-110" : ""
                  )}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center text-primary">
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {option.title}
                  </h3>
                  <Badge className={cn("text-xs", difficultyInfo.color)}>
                    {difficultyInfo.icon} {difficultyInfo.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="relative pt-0">
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {option.description}
                </p>
                
                <div className="flex items-center text-xs text-muted-foreground mb-3">
                  <Clock className="h-3 w-3 mr-1" />
                  {option.estimatedTime}
                </div>

                {showDetails && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-foreground">
                      功能特色：
                    </div>
                    <div className="space-y-1">
                      {option.features.map((feature, index) => (
                        <div 
                          key={index} 
                          className="flex items-center text-xs text-muted-foreground"
                        >
                          <ChevronRight className="h-3 w-3 mr-1 text-primary/60" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 选择指示器 */}
                {isSelected && (
                  <div className="absolute bottom-2 right-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  </div>
                )}
              </CardContent>

              {/* Hover 效果 */}
              {isHovered && !isSelected && (
                <div className="absolute inset-0 bg-primary/5 border-2 border-primary/20 rounded-lg pointer-events-none" />
              )}
            </Card>
          );
        })}
      </div>

      {/* 详细说明面板 */}
      {selectedMode && showDetails && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "p-3 rounded-lg bg-gradient-to-br text-white shadow-md",
                learningModes.find(m => m.mode === selectedMode)?.color
              )}>
                {(() => {
                  const IconComponent = learningModes.find(m => m.mode === selectedMode)?.icon || BookOpen;
                  return <IconComponent className="h-6 w-6" />;
                })()}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {learningModes.find(m => m.mode === selectedMode)?.title}
                  </h3>
                  <Badge className={cn(
                    "text-xs", 
                    difficultyConfig[learningModes.find(m => m.mode === selectedMode)?.difficulty || 'beginner'].color
                  )}>
                    {difficultyConfig[learningModes.find(m => m.mode === selectedMode)?.difficulty || 'beginner'].icon}
                    {difficultyConfig[learningModes.find(m => m.mode === selectedMode)?.difficulty || 'beginner'].label}
                  </Badge>
                </div>
                
                <p className="text-muted-foreground mb-4">
                  {learningModes.find(m => m.mode === selectedMode)?.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      预计时长: {learningModes.find(m => m.mode === selectedMode)?.estimatedTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <Volume2 className="h-4 w-4" />
                      需要麦克风权限
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="ml-4"
                    onClick={() => onModeSelect(selectedMode)}
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