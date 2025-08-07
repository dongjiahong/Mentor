import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Home,
  Settings,
  BarChart3,
  User,
  Headphones,
  Mic,
  BookOpen,
  PenTool,
  Bot,
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  LearningModule,
  UniversalContent,
  ListeningPracticeContent,
  ReadingPracticeContent,
  WritingPracticeContent
} from '@/types';
import { 
  ModuleLearningSelector,
  ContentBrowser,
  ListeningPracticePanel,
  SpeakingPracticePanel,
  ReadingPracticePanel,
  WritingPracticePanel
} from '@/components/features';
import { writingContents, listeningContents, readingContents } from '@/services/content/SampleContentData';
import { learningContentService } from '@/services/learning-content/LearningContentService';
import { useLearningContent } from '@/hooks/useLearningContent';
import { convertToVoicePracticeContent, convertToDialoguePracticeScenario } from '@/utils/contentConverter';

type ViewState = 
  | 'home'                    // 主页 - 模块选择
  | 'content_browser'         // 内容浏览
  | 'listening_practice'      // 听力练习
  | 'speaking_practice'       // 口语练习  
  | 'reading_practice'        // 阅读练习
  | 'writing_practice'        // 写作练习
  | 'content_detail';         // 内容详情

interface LearningPageState {
  currentView: ViewState;
  selectedModule: LearningModule | null;
  selectedContent: UniversalContent | ListeningPracticeContent | ReadingPracticeContent | WritingPracticeContent | null;
  dbContents: UniversalContent[];
  userProgress: Record<LearningModule, {
    totalTime: number;
    completedSessions: number;
    averageScore: number;
    streak: number;
  }>;
}

export function NewIntegratedLearningPage() {
  const [state, setState] = useState<LearningPageState>({
    currentView: 'home',
    selectedModule: null,
    selectedContent: null,
    dbContents: [],
    userProgress: {
      content: { totalTime: 3600, completedSessions: 12, averageScore: 0, streak: 5 },
      listening: { totalTime: 2400, completedSessions: 8, averageScore: 78, streak: 3 },
      speaking: { totalTime: 1800, completedSessions: 6, averageScore: 82, streak: 2 },
      reading: { totalTime: 4200, completedSessions: 15, averageScore: 85, streak: 7 },
      writing: { totalTime: 1200, completedSessions: 4, averageScore: 75, streak: 1 }
    }
  });

  // 从数据库获取学习内容
  const { content: dbContent, loading: dbLoading, error: dbError } = useLearningContent();

  // 处理数据库内容转换
  useEffect(() => {
    if (dbContent && dbContent.length > 0) {
      const convertedContent: UniversalContent[] = [];
      
      dbContent.forEach(item => {
        if (item.content_type === 'article' || item.content_type === 'mixed') {
          const converted = convertToVoicePracticeContent(item);
          if (converted) {
            // 转换为UniversalContent格式
            const universalContent: UniversalContent = {
              id: converted.id,
              title: converted.title,
              description: converted.description,
              contentType: 'article' as const,
              level: converted.level,
              category: converted.category,
              tags: [converted.category],
              originalText: converted.sentences.map(s => s.text).join(' '),
              translation: converted.sentences.map(s => s.translation).join(' '),
              wordCount: converted.sentences.reduce((sum, s) => sum + s.text.split(' ').length, 0),
              estimatedDuration: converted.estimatedDuration,
              sentences: converted.sentences.map(s => ({
                id: s.id,
                text: s.text,
                translation: s.translation,
                difficulty: s.difficulty
              })),
              supportedModules: ['reading', 'speaking'],
              createdAt: new Date(item.created_at)
            };
            convertedContent.push(universalContent);
          }
        } else if (item.content_type === 'dialogue') {
          const converted = convertToDialoguePracticeScenario(item);
          if (converted) {
            // 转换为UniversalContent格式
            const universalContent: UniversalContent = {
              id: converted.id,
              title: converted.title,
              description: converted.description,
              contentType: 'dialogue' as const,
              level: converted.level,
              category: converted.category,
              tags: [converted.category],
              originalText: converted.conversations.map(c => c.text).join(' '),
              translation: converted.conversations.map(c => c.translation || '').join(' '),
              wordCount: converted.conversations.reduce((sum, c) => sum + c.text.split(' ').length, 0),
              estimatedDuration: 15,
              conversations: converted.conversations.map(c => ({
                id: c.id,
                speaker: c.speaker,
                text: c.text,
                translation: c.translation
              })),
              supportedModules: ['speaking', 'listening'],
              createdAt: new Date(item.created_at)
            };
            convertedContent.push(universalContent);
          }
        }
      });
      
      setState(prev => ({
        ...prev,
        dbContents: convertedContent
      }));
    }
  }, [dbContent]);

  // 处理模块选择
  const handleModuleSelect = useCallback((module: LearningModule) => {
    setState(prev => ({
      ...prev,
      selectedModule: module,
      currentView: module === 'content' ? 'content_browser' : `${module}_practice` as ViewState,
      selectedContent: null
    }));
  }, []);

  // 处理内容选择
  const handleContentSelect = useCallback((content: UniversalContent | ListeningPracticeContent | ReadingPracticeContent | WritingPracticeContent) => {
    setState(prev => ({
      ...prev,
      selectedContent: content
    }));
  }, []);

  // 处理内容删除
  const handleContentDelete = useCallback(async (contentId: string) => {
    try {
      // 提取真正的数据库ID
      let dbId: number;
      if (contentId.startsWith('db_dialogue_')) {
        dbId = parseInt(contentId.replace('db_dialogue_', ''));
      } else if (contentId.startsWith('db_')) {
        dbId = parseInt(contentId.replace('db_', ''));
      } else {
        throw new Error('无效的内容ID格式');
      }
      
      // 从数据库中删除
      await learningContentService.deleteLearningContent(dbId);
      
      // 从本地状态中删除
      setState(prev => ({
        ...prev,
        dbContents: prev.dbContents.filter(content => content.id !== contentId)
      }));
      
    } catch (error) {
      console.error('删除内容失败:', error);
      alert('删除内容失败，请重试');
    }
  }, []);

  // 返回主页
  const handleBackToHome = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentView: 'home',
      selectedModule: null,
      selectedContent: null
    }));
  }, []);

  // 返回模块选择
  const handleBackToModule = useCallback(() => {
    if (!state.selectedModule) {
      handleBackToHome();
      return;
    }

    setState(prev => ({
      ...prev,
      currentView: prev.selectedModule === 'content' ? 'content_browser' : `${prev.selectedModule}_practice` as ViewState,
      selectedContent: null
    }));
  }, [state.selectedModule, handleBackToHome]);

  // 完成练习处理
  const handlePracticeComplete = useCallback(() => {
    // 更新用户进度
    if (state.selectedModule) {
      setState(prev => ({
        ...prev,
        userProgress: {
          ...prev.userProgress,
          [state.selectedModule!]: {
            ...prev.userProgress[state.selectedModule!],
            completedSessions: prev.userProgress[state.selectedModule!].completedSessions + 1,
            totalTime: prev.userProgress[state.selectedModule!].totalTime + 900 // 假设练习了15分钟
          }
        }
      }));
    }

    // 返回内容选择或模块首页
    handleBackToModule();
  }, [state.selectedModule, handleBackToModule]);

  // 获取面包屑导航
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      { label: '学习中心', onClick: handleBackToHome }
    ];

    if (state.selectedModule) {
      const moduleNames = {
        content: '内容管理',
        listening: '听力练习',
        speaking: '口语练习',
        reading: '阅读练习',
        writing: '写作练习'
      };
      
      breadcrumbs.push({
        label: moduleNames[state.selectedModule],
        onClick: handleBackToModule
      });
    }

    if (state.selectedContent) {
      breadcrumbs.push({
        label: state.selectedContent.title,
        onClick: () => {}
      });
    }

    return breadcrumbs;
  };

  // 渲染导航栏
  const renderNavigation = () => {
    const breadcrumbs = getBreadcrumbs();
    
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={crumb.onClick}
                className="text-muted-foreground hover:text-foreground"
              >
                {index === 0 && <Home className="h-4 w-4 mr-2" />}
                {crumb.label}
              </Button>
              {index < breadcrumbs.length - 1 && (
                <span className="text-muted-foreground">/</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/ai-generator'}
            className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:border-purple-300"
          >
            <Bot className="h-4 w-4 mr-2 text-purple-600" />
            <Sparkles className="h-3 w-3 mr-1 text-yellow-500" />
            AI 生成器
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            学习报告
          </Button>
          <Button variant="outline" size="sm">
            <User className="h-4 w-4 mr-2" />
            个人设置
          </Button>
        </div>
      </div>
    );
  };

  // 渲染主页面
  const renderMainContent = () => {
    switch (state.currentView) {
      case 'home':
        return (
          <ModuleLearningSelector
            selectedModule={state.selectedModule}
            onModuleSelect={handleModuleSelect}
            userLevel="B1"
            userProgress={state.userProgress}
            showDetails={true}
          />
        );

      case 'content_browser':
        return (
          <ContentBrowser
            contents={state.dbContents}
            onContentSelect={handleContentSelect}
            onContentDelete={handleContentDelete}
            onModuleSelect={handleModuleSelect}
            showSearch={true}
            showFilters={true}
            showModuleTabs={true}
            showDeleteButton={true}
            itemsPerPage={12}
          />
        );

      case 'listening_practice':
        if (state.selectedContent) {
          return (
            <ListeningPracticePanel
              content={state.selectedContent as UniversalContent}
              onBack={handleBackToModule}
              onComplete={handlePracticeComplete}
            />
          );
        } else {
          // 显示听力练习内容列表
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Headphones className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold">听力练习</h2>
                  <p className="text-sm text-muted-foreground">
                    提升听力理解能力
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listeningContents.map(content => (
                  <Card 
                    key={content.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleContentSelect(content)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{content.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">{content.level}</Badge>
                        <Badge variant="secondary">{content.difficulty}/5</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {content.description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        预计时长: {content.estimatedDuration} 分钟
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        }

      case 'speaking_practice':
        if (state.selectedContent) {
          return (
            <SpeakingPracticePanel
              content={state.selectedContent as UniversalContent}
              onBack={handleBackToModule}
              onComplete={handlePracticeComplete}
            />
          );
        } else {
          // 显示口语练习内容列表
          const speakingContents = state.dbContents.filter(content => 
            content.supportedModules.includes('speaking')
          );
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <Mic className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold">口语练习</h2>
                  <p className="text-sm text-muted-foreground">
                    提升口语表达和发音准确度
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {speakingContents.map(content => (
                  <Card 
                    key={content.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleContentSelect(content)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{content.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">{content.level}</Badge>
                        <Badge variant="secondary">
                          {content.sentences ? content.sentences.length : content.conversations?.length || 0} 项
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {content.description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        预计时长: {content.estimatedDuration} 分钟
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        }

      case 'reading_practice':
        if (state.selectedContent) {
          return (
            <ReadingPracticePanel
              content={state.selectedContent as UniversalContent}
              onBack={handleBackToModule}
              onComplete={handlePracticeComplete}
            />
          );
        } else {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold">阅读练习</h2>
                  <p className="text-sm text-muted-foreground">
                    提升阅读速度和理解能力
                  </p>
                </div>
              </div>
              
              {dbLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">加载阅读内容中...</span>
                </div>
              )}

              {dbError && (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">加载阅读内容失败: {dbError}</p>
                  <Button onClick={() => window.location.reload()}>
                    重新加载
                  </Button>
                </div>
              )}
              
              {!dbLoading && !dbError && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {readingContents.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground mb-4">暂无阅读练习内容</p>
                      <p className="text-sm text-muted-foreground">内容正在初始化中，请稍后刷新页面</p>
                    </div>
                  ) : (
                    readingContents.map(content => (
                  <Card 
                    key={content.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleContentSelect(content)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{content.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">{content.level}</Badge>
                        <Badge variant="secondary">{content.wordCount} 词</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {content.description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        预计时长: {content.estimatedDuration} 分钟
                      </div>
                    </CardContent>
                  </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        }

      case 'writing_practice':
        if (state.selectedContent) {
          return (
            <WritingPracticePanel
              content={state.selectedContent as WritingPracticeContent}
              onBack={handleBackToModule}
              onComplete={handlePracticeComplete}
            />
          );
        } else {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <PenTool className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold">写作练习</h2>
                  <p className="text-sm text-muted-foreground">
                    提升写作技巧和表达能力
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {writingContents.map(content => (
                  <Card 
                    key={content.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleContentSelect(content)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{content.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">{content.level}</Badge>
                        <Badge variant="secondary">
                          {content.wordLimit ? `${content.wordLimit}词` : '自由发挥'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {content.description}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        预计时长: {content.estimatedDuration} 分钟
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        }

      default:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">页面未找到</h2>
            <Button onClick={handleBackToHome}>
              返回主页
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 头部状态栏 */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {renderNavigation()}
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {renderMainContent()}
      </div>

    </div>
  );
}