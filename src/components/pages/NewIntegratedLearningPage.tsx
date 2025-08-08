import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home,
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
// 移除内存数据导入，统一使用数据库数据源
// import { writingContents, listeningContents, readingContents } from '@/services/content/SampleContentData';
import { learningContentService } from '@/services/content';
import { writingPromptsService } from '@/services/practice';
import { useLearningContent } from '@/hooks/useLearningContent';
import { useWritingPrompts } from '@/hooks/useWritingPrompts';
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
  
  // 从数据库获取写作提示
  const { prompts: writingPrompts, loading: writingLoading, error: writingError, refetch: refetchWritingPrompts } = useWritingPrompts();
  
  // 初始化服务
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await learningContentService.initialize();
      } catch (error) {
        console.error('初始化服务失败:', error);
      }
    };
    
    initializeServices();
  }, []);
  
  // 处理URL参数，支持从AI生成器跳转过来
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const moduleParam = urlParams.get('module') as LearningModule | null;
    const contentId = urlParams.get('contentId');
    
    if (moduleParam && ['reading', 'listening', 'writing', 'speaking'].includes(moduleParam)) {
      // 设置模块
      setState(prev => ({
        ...prev,
        selectedModule: moduleParam,
        currentView: `${moduleParam}_practice` as ViewState
      }));
      
      // 如果有指定内容ID，在数据加载后自动选择该内容
      if (contentId) {
        // 对于写作模块，从数据库中查找写作提示
        if (moduleParam === 'writing' && writingPrompts.length > 0) {
          const targetPrompt = writingPrompts.find(prompt => 
            prompt.id.toString() === contentId
          );
          if (targetPrompt) {
            // 转换为WritingPracticeContent格式
            const writingContent: WritingPracticeContent = {
              id: targetPrompt.id.toString(),
              title: targetPrompt.title,
              description: targetPrompt.topic || '写作练习',
              level: targetPrompt.difficulty_level as EnglishLevel,
              category: targetPrompt.writing_type,
              practiceType: 'essay_writing' as WritingPracticeType,
              prompt: targetPrompt.prompt_text,
              wordLimit: parseInt(targetPrompt.word_count_requirement?.match(/\d+/)?.[0] || '200'),
              timeLimit: targetPrompt.time_limit,
              estimatedDuration: targetPrompt.time_limit || 30,
              difficulty: 3,
              evaluationCriteria: targetPrompt.evaluation_criteria,
              sampleOutline: targetPrompt.sample_outline
            };
            handleContentSelect(writingContent);
          }
        } else if (dbContent.length > 0) {
          // 对于其他模块，从转换后的内容中查找
          const targetContent = state.dbContents.find(content => 
            content.id === contentId || content.id === `db_${contentId}`
          );
          if (targetContent) {
            handleContentSelect(targetContent);
          }
        }
      }
      
      // 清除URL参数，避免页面刷新时重复跳转
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [dbContent, writingPrompts, state.dbContents]);

  // 处理数据库内容转换
  useEffect(() => {
    const convertedContent: UniversalContent[] = [];
    
    // 处理学习内容
    if (dbContent && dbContent.length > 0) {
      dbContent.forEach(item => {
        if (item.content_type === 'article' || item.content_type === 'mixed') {
          const converted = convertToVoicePracticeContent(item);
          if (converted) {
            // 转换为UniversalContent格式
            const universalContent: UniversalContent = {
              id: converted.id,
              title: item.title || converted.title,  // 优先使用数据库中的标题
              description: converted.description,
              contentType: 'article' as const,
              level: converted.level,
              category: converted.category,
              tags: [converted.category],
              originalText: item.original_text,  // 直接使用数据库原文，保留原有格式
              translation: item.translation,    // 直接使用数据库翻译，保留原有格式
              wordCount: item.word_count || converted.sentences.reduce((sum, s) => sum + s.text.split(' ').length, 0),
              estimatedDuration: converted.estimatedDuration,
              sentences: converted.sentences.map(s => ({
                id: s.id,
                text: s.text,
                translation: s.translation,
                difficulty: s.difficulty
              })),
              // 根据数据库activity_types字段确定支持的模块
              supportedModules: item.activity_types 
                ? item.activity_types.split(',').filter(type => 
                    ['reading', 'listening', 'speaking', 'writing'].includes(type.trim())
                  ) as LearningModule[]
                : ['reading', 'speaking'],
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
              title: item.title || converted.title,  // 优先使用数据库中的标题
              description: converted.description,
              contentType: 'dialogue' as const,
              level: converted.level,
              category: converted.category,
              tags: [converted.category],
              originalText: item.original_text,  // 直接使用数据库原文，保留对话格式
              translation: item.translation,    // 直接使用数据库翻译，保留对话格式
              wordCount: item.word_count || converted.conversations.reduce((sum, c) => sum + c.text.split(' ').length, 0),
              estimatedDuration: item.estimated_reading_time || 15,
              conversations: converted.conversations.map(c => ({
                id: c.id,
                speaker: c.speaker,
                text: c.text,
                translation: c.translation
              })),
              // 根据数据库activity_types字段确定支持的模块
              supportedModules: item.activity_types 
                ? item.activity_types.split(',').filter(type => 
                    ['reading', 'listening', 'speaking', 'writing'].includes(type.trim())
                  ) as LearningModule[]
                : ['speaking', 'listening'],
              createdAt: new Date(item.created_at)
            };
            convertedContent.push(universalContent);
          }
        }
      });
    }
    
    // 处理写作提示
    if (writingPrompts && writingPrompts.length > 0) {
      writingPrompts.forEach(prompt => {
        const universalContent: UniversalContent = {
          id: `writing_prompt_${prompt.id}`,
          title: prompt.title,
          description: prompt.topic || `${prompt.writing_type}写作练习`,
          contentType: 'article' as const,
          level: prompt.difficulty_level as EnglishLevel,
          category: prompt.writing_type || '写作练习',
          tags: [prompt.writing_type || '写作', 'AI生成'].filter(Boolean),
          originalText: prompt.prompt_text,
          translation: '',
          wordCount: prompt.prompt_text.split(' ').length,
          estimatedDuration: prompt.time_limit || 30,
          supportedModules: ['writing'] as LearningModule[],
          createdAt: new Date(prompt.created_at),
          // 添加写作专用字段
          writingPrompt: {
            prompt: prompt.prompt_text,
            wordLimit: parseInt(prompt.word_count_requirement?.match(/\d+/)?.[0] || '200'),
            timeLimit: prompt.time_limit,
            evaluationCriteria: prompt.evaluation_criteria,
            sampleOutline: prompt.sample_outline
          }
        };
        convertedContent.push(universalContent);
      });
    }
    
    setState(prev => ({
      ...prev,
      dbContents: convertedContent
    }));
  }, [dbContent, writingPrompts]);

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
    // 如果是写作内容，需要转换为WritingPracticeContent格式
    if ('writingPrompt' in content && content.writingPrompt && content.supportedModules.includes('writing')) {
      const writingContent: WritingPracticeContent = {
        id: content.id,
        title: content.title,
        description: content.description,
        level: content.level,
        category: content.category,
        practiceType: 'essay_writing' as WritingPracticeType,
        prompt: content.writingPrompt.prompt,
        wordLimit: content.writingPrompt.wordLimit || 200,
        timeLimit: content.writingPrompt.timeLimit || 30,
        estimatedDuration: content.estimatedDuration,
        difficulty: 3,
        evaluationCriteria: content.writingPrompt.evaluationCriteria,
        sampleOutline: content.writingPrompt.sampleOutline
      };
      setState(prev => ({
        ...prev,
        selectedContent: writingContent
      }));
    } else {
      setState(prev => ({
        ...prev,
        selectedContent: content
      }));
    }
  }, []);

  // 处理内容删除
  const handleContentDelete = useCallback(async (contentId: string) => {
    try {
      // 处理写作提示的删除
      if (contentId.startsWith('writing_prompt_')) {
        const promptId = parseInt(contentId.replace('writing_prompt_', ''));
        
        // 从数据库中删除写作提示
        await writingPromptsService.deleteWritingPrompt(promptId);
        
        // 重新获取写作提示数据
        await refetchWritingPrompts();
        
        // 从本地状态中删除
        setState(prev => ({
          ...prev,
          dbContents: prev.dbContents.filter(content => content.id !== contentId)
        }));
        return;
      }
      
      // 处理学习内容的删除
      let dbId: number;
      if (contentId.startsWith('db_dialogue_')) {
        dbId = parseInt(contentId.replace('db_dialogue_', ''));
      } else if (contentId.startsWith('db_')) {
        dbId = parseInt(contentId.replace('db_', ''));
      } else {
        throw new Error('无效的内容ID格式');
      }
      
      // 从数据库中删除
      const success = await learningContentService.deleteLearningContent(dbId);
      
      if (!success) {
        throw new Error('数据库删除操作失败');
      }
      
      // 从本地状态中删除
      setState(prev => ({
        ...prev,
        dbContents: prev.dbContents.filter(content => content.id !== contentId)
      }));
      
      console.log('内容删除成功:', contentId);
      
    } catch (error) {
      console.error('删除内容失败:', error);
      alert('删除内容失败，请重试。错误：' + (error instanceof Error ? error.message : '未知错误'));
    }
  }, [refetchWritingPrompts]);

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
                {state.dbContents.filter(content => 
                  content.supportedModules.includes('listening')
                ).map(content => (
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
                  {state.dbContents.filter(content => 
                    content.supportedModules.includes('reading')
                  ).length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground mb-4">暂无阅读练习内容</p>
                      <p className="text-sm text-muted-foreground">内容正在初始化中，请稍后刷新页面</p>
                    </div>
                  ) : (
                    state.dbContents.filter(content => 
                      content.supportedModules.includes('reading')
                    ).map(content => (
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
              
              {/* AI写作生成器入口 */}
              <div className="mb-6">
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-700">
                      <Bot className="h-5 w-5" />
                      AI 写作题目生成器
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-purple-600 mb-4">
                      使用AI智能生成个性化写作题目，包含详细的写作要求和评分标准
                    </p>
                    <Button 
                      onClick={() => {
                        // 跳转到AI写作生成器页面
                        window.location.href = '/writing-generator';
                      }}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      生成写作题目
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              {/* 加载状态 */}
              {writingLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">加载写作题目中...</span>
                </div>
              )}

              {/* 错误状态 */}
              {writingError && (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-4">加载写作题目失败: {writingError}</p>
                  <Button onClick={() => window.location.reload()}>
                    重新加载
                  </Button>
                </div>
              )}
              
              {/* 内容列表 */}
              {!writingLoading && !writingError && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {writingPrompts.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground mb-4">暂无写作练习内容</p>
                      <p className="text-sm text-muted-foreground">请使用上方的AI生成器创建写作题目</p>
                    </div>
                  ) : (
                    writingPrompts.map(prompt => (
                      <Card 
                        key={prompt.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          // 将写作提示转换为WritingPracticeContent格式
                          const writingContent: WritingPracticeContent = {
                            id: prompt.id.toString(),
                            title: prompt.title,
                            description: prompt.topic || '写作练习',
                            level: prompt.difficulty_level as EnglishLevel,
                            category: prompt.writing_type,
                            practiceType: 'essay_writing' as WritingPracticeType,
                            prompt: prompt.prompt_text,
                            wordLimit: parseInt(prompt.word_count_requirement?.match(/\d+/)?.[0] || '200'),
                            timeLimit: prompt.time_limit,
                            estimatedDuration: prompt.time_limit || 30,
                            difficulty: 3,
                            evaluationCriteria: prompt.evaluation_criteria,
                            sampleOutline: prompt.sample_outline
                          };
                          handleContentSelect(writingContent);
                        }}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg">{prompt.title}</CardTitle>
                          <div className="flex gap-2">
                            <Badge variant="outline">{prompt.difficulty_level}</Badge>
                            <Badge variant="secondary" className="capitalize">
                              {prompt.writing_type}
                            </Badge>
                            {prompt.word_count_requirement && (
                              <Badge variant="outline">{prompt.word_count_requirement}</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-3">
                            {prompt.topic && `主题: ${prompt.topic}`}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                            {prompt.prompt_text.substring(0, 100)}...
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>预计时长: {prompt.time_limit || 30} 分钟</span>
                            {prompt.is_ai_generated && (
                              <Badge variant="outline" className="text-xs">
                                <Bot className="h-3 w-3 mr-1" />
                                AI生成
                              </Badge>
                            )}
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