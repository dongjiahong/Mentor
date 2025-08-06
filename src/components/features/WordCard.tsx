import React, { useState } from 'react';
import {
  Play,
  Volume2,
  Edit3,
  Trash2,
  Clock,
  Mic,
  Eye,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Word, WordAddReason, PROFICIENCY_LEVELS } from '@/types';
import { useSpeech } from '@/hooks';

interface WordCardProps {
  word: Word;
  onProficiencyUpdate?: (wordId: number, level: number) => void;
  onRemove?: (wordId: number) => void;
  onEdit?: (wordId: number, updates: { definition?: string; pronunciation?: string }) => void;
  onPlay?: (text: string) => void;
  isSelected?: boolean;
  onSelect?: (wordId: number, selected: boolean) => void;
  showCheckbox?: boolean;
}

// 添加原因的显示配置
const ADD_REASON_CONFIG: Record<WordAddReason, {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  'translation_lookup': {
    label: '翻译查询',
    icon: <Eye className="h-3 w-3" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  'pronunciation_error': {
    label: '发音错误',
    icon: <Mic className="h-3 w-3" />,
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  },
  'listening_difficulty': {
    label: '听力困难',
    icon: <Volume2 className="h-3 w-3" />,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
  }
};

export function WordCard({
  word,
  onProficiencyUpdate,
  onRemove,
  onEdit,
  onPlay,
  isSelected = false,
  onSelect,
  showCheckbox = false
}: WordCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editDefinition, setEditDefinition] = useState(word.definition);
  const [editPronunciation, setEditPronunciation] = useState(word.pronunciation || '');

  const { speak } = useSpeech();

  // 计算熟练度百分比
  const proficiencyPercentage = (word.proficiencyLevel / 5) * 100;

  // 获取添加原因配置，提供默认值
  const reasonConfig = ADD_REASON_CONFIG[word.addReason] || {
    label: '其他',
    icon: <Eye className="h-3 w-3" />,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  };

  // 格式化日期时间
  const formatDate = (date?: Date) => {
    if (!date) return '未设置';
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 计算是否需要复习
  const needsReview = word.nextReviewAt ? new Date(word.nextReviewAt) <= new Date() : true;

  // 处理播放单词发音
  const handlePlay = async () => {
    if (onPlay) {
      onPlay(word.word);
    } else {
      await speak(word.word, { lang: 'en-US' });
    }
  };

  // 处理熟练度更新
  const handleProficiencyUpdate = (level: number) => {
    if (onProficiencyUpdate) {
      onProficiencyUpdate(word.id, level);
    }
  };

  // 处理编辑保存
  const handleEditSave = () => {
    if (onEdit) {
      const updates: { definition?: string; pronunciation?: string } = {};
      if (editDefinition !== word.definition) {
        updates.definition = editDefinition;
      }
      if (editPronunciation !== word.pronunciation) {
        updates.pronunciation = editPronunciation;
      }

      if (Object.keys(updates).length > 0) {
        onEdit(word.id, updates);
      }
    }
    setShowEditDialog(false);
  };

  // 处理删除确认
  const handleDeleteConfirm = () => {
    if (onRemove) {
      onRemove(word.id);
    }
    setShowDeleteDialog(false);
  };

  // 处理选择状态变化
  const handleSelectChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(word.id, checked);
    }
  };

  return (
    <>
      <Card className={`transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''
        }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {showCheckbox && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSelectChange(e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
              )}

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {word.word}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlay}
                    className="h-6 w-6 p-0"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  {word.pronunciation && (
                    <span className="text-sm text-muted-foreground">
                      [{word.pronunciation}]
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 mb-2">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${reasonConfig.color}`}
                  >
                    {reasonConfig.icon}
                    <span className="ml-1">{reasonConfig.label}</span>
                  </Badge>

                  {needsReview && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      需要复习
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePlay}>
                  <Volume2 className="h-4 w-4 mr-2" />
                  播放发音
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* 单词释义 */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">释义</p>
              <div className="max-h-20 overflow-y-auto scrollbar-thin">
                <p className="text-sm text-foreground pr-2">{word.definition}</p>
              </div>
            </div>

            {/* 熟练度 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">
                  熟练度: {PROFICIENCY_LEVELS[word.proficiencyLevel as keyof typeof PROFICIENCY_LEVELS] || '未知等级'}
                </p>
                <span className="text-xs text-muted-foreground">
                  {word.proficiencyLevel}/5
                </span>
              </div>
              <Progress value={proficiencyPercentage} className="h-2" />

              {/* 熟练度快速调整按钮 */}
              <div className="flex items-center space-x-1 mt-2">
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    variant={word.proficiencyLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleProficiencyUpdate(level)}
                    className="h-6 w-6 p-0 text-xs"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* 学习统计 */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>复习次数: {word.reviewCount}</span>
              <span>下次复习: {formatDate(word.nextReviewAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑单词</DialogTitle>
            <DialogDescription>
              修改单词的释义和发音信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="word">单词</Label>
              <Input
                id="word"
                value={word.word}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="definition">释义</Label>
              <Textarea
                id="definition"
                value={editDefinition}
                onChange={(e) => setEditDefinition(e.target.value)}
                placeholder="输入单词释义..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="pronunciation">发音</Label>
              <Input
                id="pronunciation"
                value={editPronunciation}
                onChange={(e) => setEditPronunciation(e.target.value)}
                placeholder="输入音标或发音..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleEditSave}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除单词 "{word.word}" 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}