import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import { 
  LearningModeSelector, 
  VoiceLearningPanel
} from '@/components/features';

import { 
  VoiceLearningMode, 
  VoicePracticeContent, 
  DialoguePracticeScenario
} from '@/types';

import { 
  followAlongPractices, 
  dialoguePracticeScenarios, 
  wordPronunciationPractices,
  listeningComprehensionPractices,
  getPracticeDataByMode 
} from '@/data/voicePracticeData';

// 文本阅读练习内容数据 - 统一格式
const readingPracticeContents: VoicePracticeContent[] = [
  {
    id: 'reading_1',
    title: '科技与生活',
    description: '了解科技如何改变我们的日常生活',
    level: 'B1',
    category: '科技话题',
    practiceType: 'reading_comprehension',
    estimatedDuration: 8,
    sentences: [
      {
        id: 'reading_1_1',
        text: 'Technology has revolutionized the way we live, work, and communicate in the modern world.',
        translation: '技术已经彻底改变了我们在现代世界中生活、工作和交流的方式。',
        difficulty: 3,
        tips: '注意 "revolutionized" 的发音和含义'
      },
      {
        id: 'reading_1_2',
        text: 'Smartphones have become essential tools that connect us to information and people instantly.',
        translation: '智能手机已成为连接我们与信息和人们的重要工具。',
        difficulty: 2,
        tips: '"essential" 表示必不可少的'
      },
      {
        id: 'reading_1_3',
        text: 'Social media platforms allow us to share experiences and stay connected with friends worldwide.',
        translation: '社交媒体平台让我们能够分享经历并与世界各地的朋友保持联系。',
        difficulty: 2,
        tips: '"platforms" 在此处指平台、载体'
      }
    ]
  },
  {
    id: 'reading_2',
    title: '环保与可持续发展',
    description: '探讨环境保护和可持续发展的重要性',
    level: 'B2',
    category: '环境话题',
    practiceType: 'reading_comprehension',
    estimatedDuration: 10,
    sentences: [
      {
        id: 'reading_2_1',
        text: 'Climate change is one of the most pressing challenges facing humanity in the 21st century.',
        translation: '气候变化是21世纪人类面临的最紧迫挑战之一。',
        difficulty: 3,
        tips: '"pressing" 表示紧急的、迫切的'
      },
      {
        id: 'reading_2_2',
        text: 'Renewable energy sources like solar and wind power offer sustainable alternatives to fossil fuels.',
        translation: '太阳能和风能等可再生能源为化石燃料提供了可持续的替代选择。',
        difficulty: 4,
        tips: '注意 "renewable" 和 "sustainable" 的区别'
      },
      {
        id: 'reading_2_3',
        text: 'Individual actions, such as recycling and reducing consumption, can make a significant impact.',
        translation: '个人行动，如回收和减少消费，可以产生重大影响。',
        difficulty: 3,
        tips: '"consumption" 指消费、使用量'
      }
    ]
  },
  {
    id: 'reading_3',
    title: '健康生活方式',
    description: '学习关于健康生活方式的英语表达',
    level: 'A2',
    category: '健康话题',
    practiceType: 'reading_comprehension',
    estimatedDuration: 6,
    sentences: [
      {
        id: 'reading_3_1',
        text: 'Regular exercise is essential for maintaining good physical and mental health.',
        translation: '定期锻炼对保持良好的身心健康至关重要。',
        difficulty: 2,
        tips: '"maintaining" 表示保持、维持'
      },
      {
        id: 'reading_3_2',
        text: 'A balanced diet with plenty of fruits and vegetables provides the nutrients our body needs.',
        translation: '富含水果和蔬菜的均衡饮食为我们的身体提供所需的营养。',
        difficulty: 2,
        tips: '"nutrients" 指营养成分'
      },
      {
        id: 'reading_3_3',
        text: 'Getting enough sleep is crucial for recovery and overall well-being.',
        translation: '充足的睡眠对恢复和整体健康至关重要。',
        difficulty: 2,
        tips: '"well-being" 表示健康、幸福感'
      }
    ]
  }
];

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
      case 'reading':
        return readingPracticeContents;
      case 'follow_along':
        return followAlongPractices;
      case 'dialogue_practice':
        return dialoguePracticeScenarios;
      case 'listening_comprehension':
        return listeningComprehensionPractices;
      default:
        return followAlongPractices;
    }
  }, [state.selectedMode]);

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

        {/* 内容列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {paginatedContent.map((content, index) => (
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
                        {'level' in content ? content.level : content.difficultyLevel}
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
          ))}
        </div>

        {/* 分页控件 */}
        {totalPages > 1 && (
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