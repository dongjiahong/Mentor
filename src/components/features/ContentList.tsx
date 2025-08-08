import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Volume2,
  Video,
  Image,
  FileText,
  MessageSquare,
  Archive,
  BookOpen,
  Headphones,
  Mic,
  PenTool
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  UniversalContent, 
  LearningModule,
  WritingPracticeContent
} from '@/types';

interface ContentListProps {
  contents: (UniversalContent | WritingPracticeContent)[];
  onContentSelect: (content: UniversalContent | WritingPracticeContent) => void;
  className?: string;
  emptyMessage?: string;
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

export function ContentList({
  contents,
  onContentSelect,
  className,
  emptyMessage = "暂无内容"
}: ContentListProps) {
  
  // 渲染内容条目（条状布局）
  const renderContentItem = (content: UniversalContent | WritingPracticeContent) => {
    // 判断内容类型
    const isUniversalContent = 'contentType' in content;
    const contentType = isUniversalContent ? content.contentType : 'article';
    const supportedModules = isUniversalContent ? content.supportedModules : ['writing'] as LearningModule[];
    
    const ContentTypeIcon = contentTypeIcons[contentType];
    const typeColor = contentTypeColors[contentType];

    return (
      <div 
        key={content.id}
        className="group cursor-pointer hover:bg-accent/50 border rounded-lg p-3 transition-all hover:border-primary/50"
        onClick={() => onContentSelect(content)}
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
                  {isUniversalContent ? content.estimatedDuration : (content as WritingPracticeContent).timeLimit || 30}min
                </div>

                {/* 媒体类型指示器（仅UniversalContent有） */}
                {isUniversalContent && (
                  <div className="flex items-center gap-1">
                    {content.audioUrl && <Volume2 className="h-3 w-3 text-green-600" />}
                    {content.videoUrl && <Video className="h-3 w-3 text-purple-600" />}
                    {content.imageUrl && <Image className="h-3 w-3 text-pink-600" />}
                  </div>
                )}

                {/* 支持的模块 */}
                <div className="flex items-center gap-1">
                  {supportedModules.map(module => {
                    const ModuleIcon = moduleIcons[module];
                    return (
                      <div
                        key={module}
                        className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20"
                        title={`支持${module === 'reading' ? '阅读' : module === 'listening' ? '听力' : module === 'speaking' ? '口语' : '写作'}练习`}
                      >
                        <ModuleIcon className="h-3.5 w-3.5" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      {contents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contents.map(renderContentItem)}
        </div>
      ) : (
        <div className="text-center py-12">
          <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {emptyMessage}
          </h3>
          <p className="text-muted-foreground">
            请稍后刷新页面或联系管理员
          </p>
        </div>
      )}
    </div>
  );
}