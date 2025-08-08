import { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { 
  LearningModeSelector, 
  VoiceLearningPanel
} from '@/components/features';

import { 
  VoiceLearningMode, 
  VoicePracticeContent, 
  DialoguePracticeScenario
} from '@/types';

// 移除内存数据导入，统一使用数据库数据源
// import { 
//   followAlongPractices, 
//   dialoguePracticeScenarios, 
//   wordPronunciationPractices,
//   listeningComprehensionPractices,
//   getPracticeDataByMode 
// } from '@/data/voicePracticeData';

import { useLearningContent } from '@/hooks/useLearningContent';
import { convertToVoicePracticeContent, convertToDialoguePracticeScenario } from '@/utils/contentConverter';


interface LearningPageState {
  selectedMode: VoiceLearningMode | null;
  selectedContent: VoicePracticeContent | DialoguePracticeScenario | null;
  currentView: 'mode_selection' | 'content_selection' | 'learning';
  currentPage: number;
  itemsPerPage: number;
}

export function NewLearningPage() {
  const [state, setState] = useState<LearningPageState>({
    selectedMode: null,
    selectedContent: null,
    currentView: 'mode_selection',
    currentPage: 1,
    itemsPerPage: 6 // 每页显示6个内容
  });

  // 从数据库获取学习内容
  const { content: dbContent, loading: dbLoading, error: dbError } = useLearningContent();
  
  // 处理URL参数，支持从AI生成器跳转过来
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode') as VoiceLearningMode | null;
    // const contentId = urlParams.get('contentId'); // 暂时不使用，后续可能需要
    
    if (mode && ['follow_along', 'dialogue_practice', 'listening_comprehension'].includes(mode)) {
      // 设置模式
      setState(prev => ({
        ...prev,
        selectedMode: mode,
        currentView: 'content_selection'
      }));
      
      // 清除URL参数，避免页面刷新时重复跳转
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // 处理模式选择
  const handleModeSelect = useCallback((mode: VoiceLearningMode) => {
    setState(prev => ({
      ...prev,
      selectedMode: mode,
      currentView: mode === 'reading' ? 'content_selection' : 'content_selection',
      currentPage: 1 // 重置页码
    }));
  }, []);

  // 处理内容选择
  const handleContentSelect = useCallback((content: VoicePracticeContent | DialoguePracticeScenario) => {
    setState(prev => ({
      ...prev,
      selectedContent: content,
      currentView: 'learning'
    }));
  }, []);

  // 返回到模式选择
  const handleBackToModeSelection = useCallback(() => {
    setState({
      selectedMode: null,
      selectedContent: null,
      currentView: 'mode_selection',
      currentPage: 1,
      itemsPerPage: 6
    });
  }, []);

  // 返回到内容选择
  const handleBackToContentSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedContent: null,
      currentView: 'content_selection',
      currentPage: 1 // 重置页码
    }));
  }, []);

  // 获取内容数据
  const getContentOptions = useCallback(() => {
    if (!state.selectedMode) return [];
    
    switch (state.selectedMode) {
      case 'reading': {
        // 将数据库内容转换为阅读练习格式
        const readingContents: VoicePracticeContent[] = [];
        
        dbContent.forEach(item => {
          if (item.content_type === 'article' || item.content_type === 'mixed') {
            const converted = convertToVoicePracticeContent(item);
            if (converted) {
              readingContents.push(converted);
            }
          }
        });
        
        return readingContents;
      }
      case 'dialogue_practice': {
        // 将数据库内容转换为对话练习格式
        const dialogueContents: DialoguePracticeScenario[] = [];
        
        dbContent.forEach(item => {
          if (item.content_type === 'dialogue') {
            const converted = convertToDialoguePracticeScenario(item);
            if (converted) {
              dialogueContents.push(converted);
            }
          }
        });
        
        return dialogueContents;
      }
      case 'follow_along': {
        // 跟读练习：使用数据库中的文章和混合内容
        const followContents: VoicePracticeContent[] = [];
        
        dbContent.forEach(item => {
          if (item.content_type === 'article' || item.content_type === 'mixed') {
            const converted = convertToVoicePracticeContent(item);
            if (converted) {
              followContents.push(converted);
            }
          }
        });
        
        return followContents;
      }
      case 'listening_comprehension': {
        // 听力理解：使用数据库中的所有内容
        const listeningContents: VoicePracticeContent[] = [];
        
        dbContent.forEach(item => {
          const converted = convertToVoicePracticeContent(item);
          if (converted) {
            listeningContents.push(converted);
          }
        });
        
        return listeningContents;
      }
      default: {
        // 默认返回跟读练习内容
        const defaultContents: VoicePracticeContent[] = [];
        
        dbContent.forEach(item => {
          if (item.content_type === 'article' || item.content_type === 'mixed') {
            const converted = convertToVoicePracticeContent(item);
            if (converted) {
              defaultContents.push(converted);
            }
          }
        });
        
        return defaultContents;
      }
    }
  }, [state.selectedMode, dbContent]);

  // 分页数据计算
  const paginationData = useMemo(() => {
    const contentOptions = getContentOptions();
    const totalItems = contentOptions.length;
    const totalPages = Math.ceil(totalItems / state.itemsPerPage);
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const paginatedContent = contentOptions.slice(startIndex, startIndex + state.itemsPerPage);

    return {
      contentOptions,
      totalItems,
      totalPages,
      paginatedContent,
      startIndex
    };
  }, [getContentOptions, state.currentPage, state.itemsPerPage]);

  // 处理页码变更
  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      currentPage: page
    }));
  }, []);


  // 渲染模式选择页面
  if (state.currentView === 'mode_selection') {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <LearningModeSelector 
          selectedMode={state.selectedMode}
          onModeSelect={handleModeSelect}
          showDetails={true}
        />
      </div>
    );
  }

  // 渲染内容选择页面
  if (state.currentView === 'content_selection') {
    const { totalItems, totalPages, paginatedContent, startIndex } = paginationData;
    
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToModeSelection}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回模式选择
          </Button>
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              选择学习内容
            </h1>
            <p className="text-muted-foreground">
              选择一个适合你当前水平的练习内容
            </p>
          </div>
        </div>

        {/* 加载状态 */}
        {dbLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">加载学习内容中...</span>
          </div>
        )}

        {/* 错误状态 */}
        {dbError && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">加载学习内容失败: {dbError}</p>
            <Button onClick={() => window.location.reload()}>
              重新加载
            </Button>
          </div>
        )}

        {/* 内容列表 */}
        {!dbLoading && !dbError && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {paginatedContent.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground mb-4">暂无{state.selectedMode === 'reading' ? '阅读' : '对话'}练习内容</p>
                <p className="text-sm text-muted-foreground">请尝试选择其他学习模式</p>
              </div>
            ) : (
              paginatedContent.map((content, index) => (
            <Card 
              key={content.id || index}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
              onClick={() => handleContentSelect(content)}
            >
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{content.title}</h3>
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary">
                        {'level' in content ? content.level : ('difficultyLevel' in content ? (content as any).difficultyLevel : 'B1')}
                      </div>
                      {('category' in content) && (
                        <div className="text-xs text-muted-foreground">
                          {content.category}
                        </div>
                      )}
                      {('topic' in content) && (
                        <div className="text-xs text-muted-foreground">
                          {content.topic}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {content.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {('sentences' in content) ? `${content.sentences.length} 个句子` :
                       ('conversations' in content) ? `${content.conversations.length} 轮对话` :
                       '传统阅读模式'}
                    </span>
                    <span>
                      {('estimatedDuration' in content) ? `${content.estimatedDuration} 分钟` :
                       ('estimatedReadingTime' in content) ? `${content.estimatedReadingTime} 分钟` :
                       '5-10 分钟'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
              ))
            )}
          </div>
        )}

        {/* 分页控件 */}
        {!dbLoading && !dbError && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              显示 {startIndex + 1}-{Math.min(startIndex + state.itemsPerPage, totalItems)} / {totalItems} 个内容
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(state.currentPage - 1)}
                disabled={state.currentPage === 1}
              >
                上一页
              </Button>
              
              {/* 页码按钮 */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (state.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (state.currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = state.currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={state.currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-10 h-8"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(state.currentPage + 1)}
                disabled={state.currentPage === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 渲染学习页面
  if (state.currentView === 'learning' && state.selectedMode && state.selectedContent) {
    // 所有模式都使用语音学习面板，确保统一体验
    return (
      <div className="min-h-screen bg-background p-4">
        <VoiceLearningPanel
          mode={state.selectedMode}
          content={state.selectedContent as VoicePracticeContent | DialoguePracticeScenario}
          onBack={handleBackToContentSelection}
          onComplete={() => {
            console.log('学习完成');
            // 可以显示完成页面或返回内容选择
            handleBackToContentSelection();
          }}
        />
      </div>
    );
  }

  // 默认返回模式选择
  return (
    <div className="max-w-6xl mx-auto p-4">
      <LearningModeSelector 
        selectedMode={state.selectedMode}
        onModeSelect={handleModeSelect}
        showDetails={true}
      />
    </div>
  );
}