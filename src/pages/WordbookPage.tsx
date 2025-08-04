import { Search, Filter, BookOpen } from 'lucide-react';

export function WordbookPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">我的单词本</h1>
          <p className="text-muted-foreground">
            管理您的学习单词，跟踪掌握进度
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <span className="text-sm text-muted-foreground">
            总计: <span className="font-semibold text-foreground">0</span> 个单词
          </span>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索单词..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-background border border-border rounded-md hover:bg-accent transition-colors">
          <Filter className="h-4 w-4" />
          <span>筛选</span>
        </button>
      </div>

      {/* 空状态 */}
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">单词本为空</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          开始学习内容，系统会自动将您查询的单词和发音困难的单词添加到这里
        </p>
        <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors">
          开始学习
        </button>
      </div>
    </div>
  );
}