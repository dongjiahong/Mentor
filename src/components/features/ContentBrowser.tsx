import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Search, 
  Clock, 
  BookOpen,
  Headphones,
  Mic,
  PenTool,
  Archive,
  Volume2,
  Image,
  Video,
  FileText,
  MessageSquare,
  X,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  UniversalContent, 
  LearningModule, 
  ContentType, 
  EnglishLevel,
  LEARNING_MODULE_DESCRIPTIONS,
  ENGLISH_LEVEL_DESCRIPTIONS
} from '@/types';

interface ContentBrowserProps {
  contents: UniversalContent[];
  onContentSelect: (content: UniversalContent) => void;
  onContentDelete?: (contentId: string) => void | Promise<void>;
  onModuleSelect?: (module: LearningModule) => void;
  onContentClick?: (content: UniversalContent, defaultModule?: LearningModule) => void;
  className?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showModuleTabs?: boolean;
  showDeleteButton?: boolean;
  itemsPerPage?: number;
}

interface FilterState {
  search: string;
  contentType: ContentType | 'all';
  level: EnglishLevel | 'all';
  category: string | 'all';
  modules: LearningModule[];
}

// 内容类型图标映射
const contentTypeIcons = {
  article: FileText,
  dialogue: MessageSquare,
  audio: Volume2,
  video: Video,
  image: Image,
  mixed: Archive
};

// 内容类型颜色映射
const contentTypeColors = {
  article: 'from-blue-500 to-blue-600',
  dialogue: 'from-green-500 to-green-600',
  audio: 'from-yellow-500 to-yellow-600',
  video: 'from-purple-500 to-purple-600',
  image: 'from-pink-500 to-pink-600',
  mixed: 'from-indigo-500 to-indigo-600'
};

// 学习模块图标映射
const moduleIcons = {
  content: Archive,
  listening: Headphones,
  speaking: Mic,
  reading: BookOpen,
  writing: PenTool
};

export function ContentBrowser({
  contents,
  onContentSelect,
  onContentDelete,
  onModuleSelect,
  onContentClick,
  className,
  showSearch = true,
  showFilters = true,
  showModuleTabs = true,
  showDeleteButton = true,
  itemsPerPage = 12
}: ContentBrowserProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    contentType: 'all',
    level: 'all',
    category: 'all',
    modules: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedModule, setSelectedModule] = useState<LearningModule | 'all'>('all');
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    content: UniversalContent | null;
  }>({
    open: false,
    content: null
  });

  // 获取所有可用的分类
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    contents.forEach(content => categorySet.add(content.category));
    return Array.from(categorySet).sort();
  }, [contents]);

  // 过滤内容
  const filteredContents = useMemo(() => {
    let filtered = contents;

    // 文本搜索
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(content => 
        content.title.toLowerCase().includes(query) ||
        content.description.toLowerCase().includes(query) ||
        content.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 按内容类型过滤
    if (filters.contentType !== 'all') {
      filtered = filtered.filter(content => content.contentType === filters.contentType);
    }

    // 按难度等级过滤
    if (filters.level !== 'all') {
      filtered = filtered.filter(content => content.level === filters.level);
    }

    // 按分类过滤
    if (filters.category !== 'all') {
      filtered = filtered.filter(content => content.category === filters.category);
    }

    // 按学习模块过滤
    if (selectedModule !== 'all') {
      filtered = filtered.filter(content => 
        content.supportedModules.includes(selectedModule)
      );
    }

    return filtered;
  }, [contents, filters, selectedModule]);

  // 分页数据
  const paginatedContents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredContents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredContents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredContents.length / itemsPerPage);

  // 重置页码当过滤条件改变时
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, selectedModule]);

  // 处理搜索
  const handleSearch = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  }, []);

  // 处理过滤器更改
  const handleFilterChange = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // 清除所有过滤器
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      contentType: 'all',
      level: 'all',
      category: 'all',
      modules: []
    });
    setSelectedModule('all');
  }, []);

  // 处理模块选择
  const handleModuleSelect = useCallback((module: LearningModule | 'all') => {
    setSelectedModule(module);
    if (module !== 'all' && onModuleSelect) {
      onModuleSelect(module);
    }
  }, [onModuleSelect]);

  // 处理模块图标点击，跳转到对应模块
  const handleModuleIconClick = useCallback((module: LearningModule, content: UniversalContent, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发内容选择
    
    if (onContentClick) {
      // 使用新的处理函数，直接跳转到指定模块的练习页面
      onContentClick(content, module);
    } else if (onModuleSelect) {
      // 兼容旧的处理方式
      onContentSelect(content);
      onModuleSelect(module);
    }
  }, [onContentSelect, onModuleSelect, onContentClick]);

  // 处理删除按钮点击
  const handleDeleteClick = useCallback((content: UniversalContent, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发内容选择
    setDeleteDialog({
      open: true,
      content
    });
  }, []);

  // 确认删除
  const handleDeleteConfirm = useCallback(async () => {
    if (deleteDialog.content && onContentDelete) {
      try {
        await onContentDelete(deleteDialog.content.id);
        setDeleteDialog({ open: false, content: null });
      } catch (error) {
        console.error('删除失败:', error);
        // 保持对话框打开，让用户知道删除失败
      }
    }
  }, [deleteDialog.content, onContentDelete]);

  // 取消删除
  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog({ open: false, content: null });
  }, []);

  // 渲染内容条目（紧凑的列表布局）
  const renderContentItem = (content: UniversalContent) => {
    const ContentTypeIcon = contentTypeIcons[content.contentType];
    const typeColor = contentTypeColors[content.contentType];

    return (
      <div 
        key={content.id}
        className="group cursor-pointer hover:bg-accent/50 border rounded-lg p-3 transition-all hover:border-primary/50"
        onClick={() => {
          if (onContentClick) {
            // 优先使用新的处理函数，默认跳转到阅读模块
            onContentClick(content, 'reading');
          } else {
            // 保持向后兼容性
            onContentSelect(content);
          }
        }}
      >
        <div className="flex items-center gap-3">
          {/* 内容类型图标 */}
          <div className={cn(
            "p-1.5 rounded-md bg-gradient-to-br text-white flex-shrink-0",
            typeColor
          )}>
            <ContentTypeIcon className="h-3.5 w-3.5" />
          </div>

          {/* 主要内容信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {content.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {content.description}
                </p>
              </div>

              {/* 右侧信息 - 水平布局 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* 难度等级 */}
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  {content.level}
                </Badge>
                
                {/* 时长 */}
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-0.5" />
                  {content.estimatedDuration}min
                </div>

                {/* 媒体类型指示器 */}
                <div className="flex items-center gap-1">
                  {content.audioUrl && <Volume2 className="h-3 w-3 text-green-600" />}
                  {content.videoUrl && <Video className="h-3 w-3 text-purple-600" />}
                  {content.imageUrl && <Image className="h-3 w-3 text-pink-600" />}
                </div>

                {/* 支持的模块 */}
                <div className="flex items-center gap-1">
                  {content.supportedModules.map(module => {
                    const ModuleIcon = moduleIcons[module];
                    return (
                      <button
                        key={module}
                        className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 transition-all border border-primary/20 hover:border-primary/40"
                        title={`跳转到${LEARNING_MODULE_DESCRIPTIONS[module].title}`}
                        onClick={(e) => handleModuleIconClick(module, content, e)}
                      >
                        <ModuleIcon className="h-3.5 w-3.5" />
                      </button>
                    );
                  })}
                </div>

                {/* 删除按钮 */}
                {showDeleteButton && onContentDelete && (
                  <button
                    className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="删除内容"
                    onClick={(e) => handleDeleteClick(content, e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* 学习模块标签页 */}
      {showModuleTabs && (
        <div className="bg-card rounded-lg border">
          <div className="flex flex-wrap gap-2 p-4">
            <Button
              variant={selectedModule === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModuleSelect('all')}
              className="transition-all"
            >
              全部内容
            </Button>
            {(['content', 'listening', 'speaking', 'reading', 'writing'] as LearningModule[]).map(module => {
              const ModuleIcon = moduleIcons[module];
              const moduleInfo = LEARNING_MODULE_DESCRIPTIONS[module];
              return (
                <Button
                  key={module}
                  variant={selectedModule === module ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModuleSelect(module)}
                  className="transition-all"
                >
                  <ModuleIcon className="h-4 w-4 mr-2" />
                  {moduleInfo.title}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* 搜索和过滤器 */}
      {(showSearch || showFilters) && (
        <div className="bg-card rounded-lg border p-4 space-y-4">
          {/* 搜索栏 */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索内容、标签或关键词..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* 过滤器 */}
          {showFilters && (
            <div className="flex flex-wrap gap-4 items-center">
              <Select 
                value={filters.contentType} 
                onValueChange={(value: ContentType | 'all') => handleFilterChange('contentType', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="内容类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="article">文章</SelectItem>
                  <SelectItem value="dialogue">对话</SelectItem>
                  <SelectItem value="audio">音频</SelectItem>
                  <SelectItem value="video">视频</SelectItem>
                  <SelectItem value="mixed">混合</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.level} 
                onValueChange={(value: EnglishLevel | 'all') => handleFilterChange('level', value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="难度等级" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部等级</SelectItem>
                  {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as EnglishLevel[]).map(level => (
                    <SelectItem key={level} value={level}>
                      {ENGLISH_LEVEL_DESCRIPTIONS[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.category} 
                onValueChange={(value: string) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="内容分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 清除过滤器按钮 */}
              {(filters.search || filters.contentType !== 'all' || filters.level !== 'all' || 
                filters.category !== 'all' || selectedModule !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  清除筛选
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 结果统计 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          找到 {filteredContents.length} 个内容
          {selectedModule !== 'all' && ` - ${LEARNING_MODULE_DESCRIPTIONS[selectedModule].title}`}
        </p>
        {totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            第 {currentPage} 页，共 {totalPages} 页
          </p>
        )}
      </div>

      {/* 内容列表 */}
      {paginatedContents.length > 0 ? (
        <div className="space-y-3">
          {paginatedContents.map(renderContentItem)}
        </div>
      ) : (
        <div className="text-center py-12">
          <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            没有找到匹配的内容
          </h3>
          <p className="text-muted-foreground mb-4">
            尝试调整搜索条件或过滤器设置
          </p>
          <Button variant="outline" onClick={clearFilters}>
            清除所有筛选
          </Button>
        </div>
      )}

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            上一页
          </Button>
          
          {/* 页码按钮 */}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除内容 &quot;{deleteDialog.content?.title}&quot; 吗？
              <br />
              删除后无法恢复，请确认您的选择。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}