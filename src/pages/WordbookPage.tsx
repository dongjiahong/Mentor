import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  BookOpen, 
  SortAsc, 
  SortDesc,
  Trash2,
  CheckSquare,
  Square,
  RotateCcw,
  Star,
  Clock,
  Eye,
  Mic,
  Volume2,

} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WordCard } from '@/components/features/WordCard';
import { useWordbook } from '@/hooks';
import { WordAddReason, WordQueryParams, PROFICIENCY_LEVELS } from '@/types';

// 排序选项
type SortOption = 'created_at' | 'word' | 'proficiency_level' | 'review_count' | 'next_review_at';
type SortOrder = 'asc' | 'desc';

// 筛选选项
interface FilterOptions {
  addReason?: WordAddReason;
  proficiencyLevel?: number;
  needReview?: boolean;
}

export function WordbookPage() {
  const navigate = useNavigate();
  const {
    words,
    stats,
    loading,
    error,
    loadWords,
    removeWord,
    updateWordDefinition,
    updateWordPronunciation,
    setWordProficiency,
    clearError,
    refresh
  } = useWordbook();

  // 本地状态
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  // 初始化加载数据
  useEffect(() => {
    loadWords();
  }, [loadWords]);

  // 构建查询参数
  const queryParams = useMemo((): WordQueryParams => {
    const params: WordQueryParams = {
      limit: 100, // 暂时设置较大的限制
    };

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (filters.addReason) {
      params.addReason = filters.addReason;
    }

    if (filters.proficiencyLevel !== undefined) {
      params.proficiencyLevel = filters.proficiencyLevel;
    }

    if (filters.needReview) {
      params.needReview = true;
    }

    return params;
  }, [searchQuery, filters]);

  // 过滤和排序单词
  const filteredAndSortedWords = useMemo(() => {
    const result = [...words];

    // 客户端排序
    result.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'word':
          aValue = a.word.toLowerCase();
          bValue = b.word.toLowerCase();
          break;
        case 'proficiency_level':
          aValue = a.proficiencyLevel;
          bValue = b.proficiencyLevel;
          break;
        case 'review_count':
          aValue = a.reviewCount;
          bValue = b.reviewCount;
          break;
        case 'next_review_at':
          aValue = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0;
          bValue = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0;
          break;
        case 'created_at':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [words, sortBy, sortOrder]);

  // 重新加载数据
  useEffect(() => {
    loadWords(queryParams);
  }, [queryParams, loadWords]);

  // 处理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 处理排序
  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortOrder('desc');
    }
  };

  // 处理筛选
  const handleFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setShowFilterDialog(false);
  };

  // 清除筛选
  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  // 处理单词选择
  const handleWordSelect = (wordId: number, selected: boolean) => {
    const newSelected = new Set(selectedWords);
    if (selected) {
      newSelected.add(wordId);
    } else {
      newSelected.delete(wordId);
    }
    setSelectedWords(newSelected);
    setShowBatchActions(newSelected.size > 0);
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedWords.size === filteredAndSortedWords.length) {
      setSelectedWords(new Set());
      setShowBatchActions(false);
    } else {
      const allIds = new Set(filteredAndSortedWords.map(w => w.id));
      setSelectedWords(allIds);
      setShowBatchActions(true);
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    for (const wordId of selectedWords) {
      await removeWord(wordId);
    }
    setSelectedWords(new Set());
    setShowBatchActions(false);
    setShowDeleteDialog(false);
  };

  // 批量设置熟练度
  const handleBatchSetProficiency = async (level: number) => {
    for (const wordId of selectedWords) {
      await setWordProficiency(wordId, level);
    }
    setSelectedWords(new Set());
    setShowBatchActions(false);
  };

  // 处理单词编辑
  const handleWordEdit = async (wordId: number, updates: { definition?: string; pronunciation?: string }) => {
    if (updates.definition) {
      await updateWordDefinition(wordId, updates.definition);
    }
    if (updates.pronunciation) {
      await updateWordPronunciation(wordId, updates.pronunciation);
    }
  };

  // 处理熟练度更新
  const handleProficiencyUpdate = async (wordId: number, level: number) => {
    await setWordProficiency(wordId, level);
  };

  // 处理单词删除
  const handleWordRemove = async (wordId: number) => {
    await removeWord(wordId);
  };

  // 获取活跃筛选器数量
  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined).length + (searchQuery ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto">
      {/* 错误提示 */}
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertDescription>
            {error.message}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearError}
              className="ml-2"
            >
              关闭
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 页面头部 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">我的单词本</h1>
          <p className="text-muted-foreground">
            管理您的学习单词，跟踪掌握进度
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-4">
          {stats && (
            <div className="text-sm text-muted-foreground">
              总计: <span className="font-semibold text-foreground">{stats.totalWords}</span> 个单词
              {stats.needReviewWords > 0 && (
                <span className="ml-2">
                  需复习: <span className="font-semibold text-orange-600">{stats.needReviewWords}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总单词数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWords}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">已掌握</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.masteredWords}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">需复习</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.needReviewWords}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">掌握率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalWords > 0 ? Math.round((stats.masteredWords / stats.totalWords) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索和操作栏 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索单词或释义..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 筛选按钮 */}
          <Button
            variant="outline"
            onClick={() => setShowFilterDialog(true)}
            className="relative"
          >
            <Filter className="h-4 w-4 mr-2" />
            筛选
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* 排序按钮 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
                排序
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleSort('created_at')}>
                按添加时间 {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('word')}>
                按字母顺序 {sortBy === 'word' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('proficiency_level')}>
                按熟练度 {sortBy === 'proficiency_level' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('review_count')}>
                按复习次数 {sortBy === 'review_count' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('next_review_at')}>
                按复习时间 {sortBy === 'next_review_at' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 批量操作按钮 */}
          <Button
            variant="outline"
            onClick={handleSelectAll}
            className={selectedWords.size > 0 ? 'bg-primary/10' : ''}
          >
            {selectedWords.size === filteredAndSortedWords.length ? (
              <CheckSquare className="h-4 w-4 mr-2" />
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            {selectedWords.size > 0 ? `已选 ${selectedWords.size}` : '全选'}
          </Button>

          {/* 刷新按钮 */}
          <Button
            variant="outline"
            onClick={refresh}
            disabled={loading}
          >
            <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {showBatchActions && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              已选择 {selectedWords.size} 个单词
            </span>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    设置熟练度
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {Object.entries(PROFICIENCY_LEVELS).map(([level, label]) => (
                    <DropdownMenuItem
                      key={level}
                      onClick={() => handleBatchSetProficiency(Number(level))}
                    >
                      {label} ({level}/5)
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedWords(new Set());
                  setShowBatchActions(false);
                }}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 活跃筛选器显示 */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm text-muted-foreground">活跃筛选器:</span>
          {searchQuery && (
            <Badge variant="secondary">
              搜索: {searchQuery}
            </Badge>
          )}
          {filters.addReason && (
            <Badge variant="secondary">
              原因: {filters.addReason === 'translation_lookup' ? '翻译查询' : 
                     filters.addReason === 'pronunciation_error' ? '发音错误' : '听力困难'}
            </Badge>
          )}
          {filters.proficiencyLevel !== undefined && (
            <Badge variant="secondary">
              熟练度: {PROFICIENCY_LEVELS[filters.proficiencyLevel as keyof typeof PROFICIENCY_LEVELS]}
            </Badge>
          )}
          {filters.needReview && (
            <Badge variant="secondary">
              需要复习
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs"
          >
            清除筛选
          </Button>
        </div>
      )}

      {/* 单词列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : filteredAndSortedWords.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {words.length === 0 ? '单词本为空' : '没有找到匹配的单词'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {words.length === 0 
              ? '开始学习内容，系统会自动将您查询的单词和发音困难的单词添加到这里'
              : '尝试调整搜索条件或清除筛选器'
            }
          </p>
          {words.length === 0 ? (
            <Button onClick={() => navigate('/')}>
              开始学习
            </Button>
          ) : (
            <Button variant="outline" onClick={clearFilters}>
              清除筛选
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedWords.map((word) => (
            <WordCard
              key={word.id}
              word={word}
              onProficiencyUpdate={handleProficiencyUpdate}
              onRemove={handleWordRemove}
              onEdit={handleWordEdit}
              isSelected={selectedWords.has(word.id)}
              onSelect={handleWordSelect}
              showCheckbox={showBatchActions}
            />
          ))}
        </div>
      )}

      {/* 筛选对话框 */}
      <FilterDialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
        filters={filters}
        onApply={handleFilter}
      />

      {/* 批量删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认批量删除</DialogTitle>
            <DialogDescription>
              确定要删除选中的 {selectedWords.size} 个单词吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleBatchDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 筛选对话框组件
interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterOptions;
  onApply: (filters: FilterOptions) => void;
}

function FilterDialog({ open, onOpenChange, filters, onApply }: FilterDialogProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>筛选单词</DialogTitle>
          <DialogDescription>
            设置筛选条件来查找特定的单词
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">添加原因</label>
            <Select
              value={localFilters.addReason || ''}
              onValueChange={(value) => 
                setLocalFilters(prev => ({ 
                  ...prev, 
                  addReason: value as WordAddReason || undefined 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择添加原因" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部</SelectItem>
                <SelectItem value="translation_lookup">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    翻译查询
                  </div>
                </SelectItem>
                <SelectItem value="pronunciation_error">
                  <div className="flex items-center">
                    <Mic className="h-4 w-4 mr-2" />
                    发音错误
                  </div>
                </SelectItem>
                <SelectItem value="listening_difficulty">
                  <div className="flex items-center">
                    <Volume2 className="h-4 w-4 mr-2" />
                    听力困难
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">熟练度等级</label>
            <Select
              value={localFilters.proficiencyLevel?.toString() || ''}
              onValueChange={(value) => 
                setLocalFilters(prev => ({ 
                  ...prev, 
                  proficiencyLevel: value ? Number(value) : undefined 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择熟练度等级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部</SelectItem>
                {Object.entries(PROFICIENCY_LEVELS).map(([level, label]) => (
                  <SelectItem key={level} value={level}>
                    {label} ({level}/5)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="needReview"
              checked={localFilters.needReview || false}
              onChange={(e) => 
                setLocalFilters(prev => ({ 
                  ...prev, 
                  needReview: e.target.checked || undefined 
                }))
              }
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="needReview" className="text-sm font-medium">
              <Clock className="h-4 w-4 inline mr-1" />
              只显示需要复习的单词
            </label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleApply}>
            应用筛选
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}