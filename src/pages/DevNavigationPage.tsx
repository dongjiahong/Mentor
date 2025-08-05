import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Database, 
  Volume2, 
  Mic, 
  Target, 
  Settings, 
  TrendingUp,
  Search,
  TestTube,
  Wrench,
  Home,
  ExternalLink
} from 'lucide-react';

interface PageInfo {
  path: string;
  title: string;
  description: string;
  category: 'main' | 'test' | 'debug' | 'demo';
  icon: React.ReactNode;
  status: 'stable' | 'beta' | 'dev' | 'experimental';
}

const pages: PageInfo[] = [
  // 主要功能页面
  {
    path: '/',
    title: '学习页面',
    description: '主要的英语学习界面，包含内容阅读和学习功能',
    category: 'main',
    icon: <Home className="h-5 w-5" />,
    status: 'stable'
  },
  {
    path: '/wordbook',
    title: '单词本',
    description: '管理和复习收藏的单词，支持熟练度跟踪',
    category: 'main',
    icon: <BookOpen className="h-5 w-5" />,
    status: 'stable'
  },
  {
    path: '/progress',
    title: '学习进度',
    description: '查看学习统计和进度分析',
    category: 'main',
    icon: <TrendingUp className="h-5 w-5" />,
    status: 'stable'
  },
  {
    path: '/settings',
    title: '设置',
    description: '应用设置和配置管理',
    category: 'main',
    icon: <Settings className="h-5 w-5" />,
    status: 'stable'
  },
  {
    path: '/pronunciation-practice',
    title: '发音练习中心',
    description: '专业的发音练习界面，支持AI智能评估',
    category: 'main',
    icon: <Target className="h-5 w-5" />,
    status: 'beta'
  },

  // 演示页面
  {
    path: '/dictionary-demo',
    title: '词典演示',
    description: '词典服务功能演示和测试',
    category: 'demo',
    icon: <Search className="h-5 w-5" />,
    status: 'stable'
  },

  // 测试页面
  {
    path: '/database-test',
    title: '数据库测试',
    description: '测试数据库连接和基本CRUD操作',
    category: 'test',
    icon: <Database className="h-5 w-5" />,
    status: 'dev'
  },
  {
    path: '/tts-test',
    title: 'TTS测试',
    description: '文本转语音功能测试',
    category: 'test',
    icon: <Volume2 className="h-5 w-5" />,
    status: 'stable'
  },
  {
    path: '/voice-recorder-test',
    title: '语音录制测试',
    description: '语音录制和识别功能测试',
    category: 'test',
    icon: <Mic className="h-5 w-5" />,
    status: 'stable'
  },
  {
    path: '/pronunciation-test',
    title: '发音评估测试',
    description: '发音评估算法测试和调试界面',
    category: 'test',
    icon: <TestTube className="h-5 w-5" />,
    status: 'beta'
  },

  // 调试页面
  {
    path: '/tts-debug',
    title: 'TTS调试',
    description: 'TTS功能详细调试和诊断',
    category: 'debug',
    icon: <Wrench className="h-5 w-5" />,
    status: 'dev'
  },
  {
    path: '/stt-debug',
    title: 'STT调试',
    description: '语音识别功能详细调试和诊断',
    category: 'debug',
    icon: <Wrench className="h-5 w-5" />,
    status: 'dev'
  }
];

const categoryInfo = {
  main: { title: '主要功能', color: 'bg-blue-100 text-blue-800' },
  demo: { title: '功能演示', color: 'bg-green-100 text-green-800' },
  test: { title: '功能测试', color: 'bg-yellow-100 text-yellow-800' },
  debug: { title: '调试工具', color: 'bg-red-100 text-red-800' }
};

const statusInfo = {
  stable: { label: '稳定', color: 'bg-green-100 text-green-800' },
  beta: { label: '测试版', color: 'bg-blue-100 text-blue-800' },
  dev: { label: '开发中', color: 'bg-yellow-100 text-yellow-800' },
  experimental: { label: '实验性', color: 'bg-purple-100 text-purple-800' }
};

/**
 * 开发导航页面
 * 提供所有页面的快速访问入口
 */
export function DevNavigationPage() {
  const groupedPages = pages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, PageInfo[]>);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 页面标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Wrench className="h-8 w-8 text-blue-600" />
          开发导航中心
        </h1>
        <p className="text-muted-foreground">
          快速访问所有开发和测试页面
        </p>
        <div className="text-sm text-muted-foreground">
          共 {pages.length} 个页面 | 开发环境专用
        </div>
      </div>

      {/* 页面分类展示 */}
      {Object.entries(groupedPages).map(([category, categoryPages]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">
              {categoryInfo[category as keyof typeof categoryInfo].title}
            </h2>
            <Badge className={categoryInfo[category as keyof typeof categoryInfo].color}>
              {categoryPages.length} 个页面
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryPages.map((page) => (
              <Card key={page.path} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {page.icon}
                      <CardTitle className="text-lg">{page.title}</CardTitle>
                    </div>
                    <Badge className={statusInfo[page.status].color}>
                      {statusInfo[page.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {page.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {page.path}
                    </code>
                    <Link to={page.path}>
                      <Button size="sm" className="gap-1">
                        访问
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* 快速链接 */}
      <Card>
        <CardHeader>
          <CardTitle>快速链接</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {pages.filter(p => p.status === 'stable' || p.status === 'beta').map((page) => (
              <Link key={page.path} to={page.path}>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  {page.icon}
                  {page.title}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 开发说明 */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800 flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            开发说明
          </CardTitle>
        </CardHeader>
        <CardContent className="text-yellow-800 space-y-2">
          <p className="text-sm">
            <strong>注意：</strong>这是开发环境专用的导航页面，用于快速访问各个功能模块。
          </p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li><strong>主要功能</strong>：面向用户的核心功能页面</li>
            <li><strong>功能演示</strong>：展示特定功能的演示页面</li>
            <li><strong>功能测试</strong>：用于测试各个功能模块的页面</li>
            <li><strong>调试工具</strong>：开发调试专用的诊断页面</li>
          </ul>
          <p className="text-sm">
            生产环境部署时，请记得移除此页面和相关的测试/调试页面。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}