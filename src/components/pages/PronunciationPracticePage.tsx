import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Target, 
  TrendingUp,
  RotateCcw,
  Play,
  Volume2
} from 'lucide-react';
import { PronunciationPractice } from '@/components/features/PronunciationPractice';
import { VoiceRecorder } from '@/components/features/VoiceRecorder';
import { useSpeech } from '@/hooks/useSpeech';
import { PronunciationScore, AppError } from '@/types';

// 练习内容数据
const practiceContent = {
  words: [
    { text: "pronunciation", difficulty: "hard", topic: "学术词汇" },
    { text: "communication", difficulty: "medium", topic: "日常交流" },
    { text: "beautiful", difficulty: "easy", topic: "形容词" },
    { text: "development", difficulty: "hard", topic: "商务英语" },
    { text: "international", difficulty: "hard", topic: "学术词汇" },
    { text: "comfortable", difficulty: "medium", topic: "日常交流" },
    { text: "technology", difficulty: "medium", topic: "科技词汇" },
    { text: "environment", difficulty: "medium", topic: "环境话题" }
  ],
  sentences: [
    { 
      text: "Good morning, how are you today?", 
      difficulty: "easy", 
      topic: "日常问候" 
    },
    { 
      text: "I would like to make a reservation for dinner.", 
      difficulty: "medium", 
      topic: "餐厅用语" 
    },
    { 
      text: "The weather forecast predicts heavy rain tomorrow.", 
      difficulty: "medium", 
      topic: "天气话题" 
    },
    { 
      text: "Could you please explain the project requirements in detail?", 
      difficulty: "hard", 
      topic: "商务英语" 
    },
    { 
      text: "Artificial intelligence is transforming various industries.", 
      difficulty: "hard", 
      topic: "科技话题" 
    },
    { 
      text: "I'm looking forward to meeting you next week.", 
      difficulty: "easy", 
      topic: "日常交流" 
    }
  ],
  paragraphs: [
    {
      text: "Learning English pronunciation requires consistent practice and patience. Start with individual sounds, then move to words, and finally to complete sentences. Regular practice will help you develop muscle memory and improve your speaking confidence.",
      difficulty: "medium",
      topic: "学习建议"
    },
    {
      text: "Climate change is one of the most pressing issues of our time. It affects weather patterns, sea levels, and biodiversity around the world. Everyone has a role to play in addressing this global challenge through sustainable practices.",
      difficulty: "hard",
      topic: "环境话题"
    },
    {
      text: "Technology has revolutionized the way we communicate and work. From smartphones to artificial intelligence, these innovations have made our lives more convenient and connected than ever before.",
      difficulty: "medium",
      topic: "科技话题"
    }
  ]
};

/**
 * 发音练习页面
 */
export function PronunciationPracticePage() {
  const [selectedContent, setSelectedContent] = useState<{
    text: string;
    type: 'word' | 'sentence' | 'paragraph';
    difficulty: string;
    topic: string;
  } | null>(null);
  const [practiceMode, setPracticeMode] = useState<'guided' | 'free'>('guided');
  const [scores, setScores] = useState<PronunciationScore[]>([]);

  const { speak } = useSpeech();

  // 选择练习内容
  const selectContent = useCallback((
    text: string, 
    type: 'word' | 'sentence' | 'paragraph', 
    difficulty: string, 
    topic: string
  ) => {
    setSelectedContent({ text, type, difficulty, topic });
    setScores([]);
  }, []);

  // 处理评分更新
  const handleScoreUpdate = useCallback((score: PronunciationScore) => {
    setScores(prev => [...prev, score]);
  }, []);

  // 处理练习完成
  const handlePracticeComplete = useCallback((finalScore: PronunciationScore) => {
    console.log('练习完成，最终得分:', finalScore);
    // 这里可以保存到数据库或显示完成提示
  }, []);

  // 处理错误
  const handleError = useCallback((error: AppError) => {
    console.error('发音练习错误:', error);
    // 这里可以显示错误提示
  }, []);

  // 播放示例发音
  const playExample = useCallback(async (text: string) => {
    try {
      await speak(text, { rate: 0.8 });
    } catch (error) {
      console.error('播放失败:', error);
    }
  }, [speak]);

  // 重置练习
  const resetPractice = useCallback(() => {
    setSelectedContent(null);
    setScores([]);
  }, []);

  // 获取难度颜色
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 获取难度标签
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '未知';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 页面标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Target className="h-8 w-8 text-blue-600" />
          发音练习中心
        </h1>
        <p className="text-muted-foreground">
          通过AI智能评估提升你的英语发音水平
        </p>
      </div>

      {/* 练习模式选择 */}
      <div className="flex justify-center gap-2">
        <Button
          variant={practiceMode === 'guided' ? 'default' : 'outline'}
          onClick={() => setPracticeMode('guided')}
        >
          引导练习
        </Button>
        <Button
          variant={practiceMode === 'free' ? 'default' : 'outline'}
          onClick={() => setPracticeMode('free')}
        >
          自由练习
        </Button>
      </div>

      {selectedContent ? (
        <div className="space-y-4">
          {/* 当前练习信息 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  当前练习
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getDifficultyColor(selectedContent.difficulty)}>
                    {getDifficultyLabel(selectedContent.difficulty)}
                  </Badge>
                  <Badge variant="outline">{selectedContent.topic}</Badge>
                  <Button variant="outline" size="sm" onClick={resetPractice}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    重新选择
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex-1 p-3 bg-muted rounded-lg">
                  <p className="text-lg">{selectedContent.text}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => playExample(selectedContent.text)}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 练习组件 */}
          {practiceMode === 'guided' ? (
            <PronunciationPractice
              targetText={selectedContent.text}
              practiceType={selectedContent.type}
              difficulty={selectedContent.difficulty as 'easy' | 'medium' | 'hard'}
              showDetailedAnalysis={true}
              onScoreUpdate={handleScoreUpdate}
              onComplete={handlePracticeComplete}
              onError={handleError}
            />
          ) : (
            <VoiceRecorder
              targetText={selectedContent.text}
              showTargetText={true}
              showComparison={true}
              showPronunciationScore={true}
              autoEvaluate={true}
              onRecordingComplete={(_result, score) => {
                if (score) handleScoreUpdate(score);
              }}
              onError={handleError}
            />
          )}

          {/* 练习统计 */}
          {scores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  练习统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {scores.length}
                    </div>
                    <div className="text-sm text-muted-foreground">练习次数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.max(...scores.map(s => s.overallScore))}
                    </div>
                    <div className="text-sm text-muted-foreground">最高分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length)}
                    </div>
                    <div className="text-sm text-muted-foreground">平均分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {scores[scores.length - 1]?.overallScore || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">最新得分</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* 内容选择界面 */
        <Tabs defaultValue="words" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="words">单词练习</TabsTrigger>
            <TabsTrigger value="sentences">句子练习</TabsTrigger>
            <TabsTrigger value="paragraphs">段落练习</TabsTrigger>
          </TabsList>

          <TabsContent value="words" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {practiceContent.words.map((item, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => selectContent(item.text, 'word', item.difficulty, item.topic)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getDifficultyColor(item.difficulty)}>
                          {getDifficultyLabel(item.difficulty)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            playExample(item.text);
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <h3 className="font-medium text-lg">{item.text}</h3>
                        <p className="text-sm text-muted-foreground">{item.topic}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sentences" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {practiceContent.sentences.map((item, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => selectContent(item.text, 'sentence', item.difficulty, item.topic)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getDifficultyColor(item.difficulty)}>
                          {getDifficultyLabel(item.difficulty)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            playExample(item.text);
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.topic}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="paragraphs" className="space-y-4">
            <div className="space-y-4">
              {practiceContent.paragraphs.map((item, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => selectContent(item.text, 'paragraph', item.difficulty, item.topic)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getDifficultyColor(item.difficulty)}>
                            {getDifficultyLabel(item.difficulty)}
                          </Badge>
                          <Badge variant="outline">{item.topic}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            playExample(item.text);
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <p className="text-sm leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}