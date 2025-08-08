/**
 * 写作相关的工具函数
 */

/**
 * 格式化时间（秒转分:秒）
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * 计算字数
 */
export function getWordCount(content: string): number {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

/**
 * 根据字数限制获取字数状态颜色
 */
export function getWordCountColor(currentCount: number, wordLimit?: number): string {
  if (!wordLimit) return 'text-muted-foreground';
  
  const ratio = currentCount / wordLimit;
  if (ratio < 0.7) return 'text-red-600';
  if (ratio > 1.2) return 'text-orange-600';
  if (ratio >= 0.9 && ratio <= 1.1) return 'text-green-600';
  return 'text-blue-600';
}

/**
 * 计算写作进度百分比
 */
export function getWritingProgress(currentCount: number, wordLimit?: number): number {
  if (!wordLimit) return 0;
  return Math.min(100, (currentCount / wordLimit) * 100);
}

/**
 * 获取写作状态的显示文本
 */
export function getStatusText(status: 'draft' | 'submitted' | 'graded'): string {
  switch (status) {
    case 'draft':
      return '草稿';
    case 'submitted':
      return '已提交';
    case 'graded':
      return '已评分';
    default:
      return '未知';
  }
}