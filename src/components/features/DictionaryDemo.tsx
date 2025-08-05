import { useState } from 'react';
import { Search, BookOpen, Settings, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { WordPopover } from './WordPopover';
import { DictionaryConfig } from './DictionaryConfig';
import { useDictionary, useWordbook } from '@/hooks';
import { WordDefinition } from '@/types';
import { cn } from '@/lib/utils';

interface DictionaryDemoProps {
  className?: string;
}

export function DictionaryDemo({ className }: DictionaryDemoProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WordDefinition[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [showConfig, setShowConfig] = useState(false);

  const { 
    searchWords, 
    getWordPronunciation,
    isConfigured, 
    queryState 
  } = useDictionary();

  const { addWord } = useWordbook();

  // 示例文本
  const sampleText = `
    Learning English can be challenging but rewarding. Reading comprehension is essential 
    for academic success. Students should practice vocabulary regularly to improve their 
    language skills. Dictionary tools help learners understand unfamiliar words quickly.
  `;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const results = await searchWords(searchQuery.trim(), 5);
      setSearchResults(results);
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    }
  };

  const handleWordClick = (word: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 5,
    });
    setSelectedWord(word);
  };

  const handleAddToWordbook = async (word: string, definition: WordDefinition) => {
    try {
      // 将词典定义转换为简单的字符串格式
      const definitionText = definition.definitions
        .map(def => `${def.partOfSpeech}: ${def.meaning}`)
        .join('; ');
      
      // 获取发音信息
      const pronunciation = definition.phonetic || definition.pronunciation;
      
      // 添加到单词本，标记为翻译查询
      await addWord(word, definitionText, 'translation_lookup', pronunciation);
    } catch (error) {
      console.error('添加单词到单词本失败:', error);
      throw error; // 重新抛出错误，让WordPopover处理
    }
  };

  const playPronunciation = async (word: string) => {
    try {
      const pronunciationUrl = await getWordPronunciation(word);
      if (pronunciationUrl) {
        const audio = new Audio(pronunciationUrl);
        audio.play();
      } else {
        // 回退到TTS
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(word);
          utterance.lang = 'en-US';
          speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      console.error('播放发音失败:', error);
    }
  };

  // 将文本分割为可点击的单词
  const renderClickableText = (text: string) => {
    const words = text.split(/(\s+|[.,!?;:])/);
    
    return words.map((part, index) => {
      const isWord = /^[a-zA-Z]+$/.test(part);
      
      if (isWord) {
        return (
          <span
            key={index}
            className="cursor-pointer hover:bg-primary/10 hover:text-primary rounded px-0.5 transition-colors"
            onClick={(e) => handleWordClick(part.toLowerCase(), e)}
            title={`点击查询 "${part}"`}
          >
            {part}
          </span>
        );
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  if (showConfig) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">词典服务配置</h2>
          <Button
            variant="outline"
            onClick={() => setShowConfig(false)}
          >
            返回演示
          </Button>
        </div>
        <DictionaryConfig />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <span>词典服务演示</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            体验单词查询、发音播放和单词本管理功能
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={isConfigured ? "default" : "secondary"}>
            {isConfigured ? "词典服务已启用" : "服务未配置"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(true)}
          >
            <Settings className="h-4 w-4 mr-1" />
            配置
          </Button>
        </div>
      </div>

      {/* 搜索功能 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">单词搜索</CardTitle>
          <CardDescription>
            搜索单词并查看释义
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="输入要搜索的单词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch}
              disabled={!searchQuery.trim() || queryState.status === 'loading'}
            >
              <Search className="h-4 w-4 mr-1" />
              搜索
            </Button>
          </div>

          {/* 搜索结果 */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">搜索结果：</h4>
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{result.word}</span>
                        {result.phonetic && (
                          <span className="text-sm text-muted-foreground">
                            {result.phonetic}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playPronunciation(result.word)}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {result.definitions.slice(0, 2).map((def, defIndex) => (
                        <div key={defIndex} className="text-sm">
                          <Badge variant="outline" className="mr-2">
                            {def.partOfSpeech}
                          </Badge>
                          <span>{def.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 交互式文本 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">交互式阅读</CardTitle>
          <CardDescription>
            点击文本中的单词查看释义
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="leading-relaxed text-foreground">
              {renderClickableText(sampleText)}
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 提示：点击文本中的任意单词查看详细释义。{isConfigured ? "当前使用免费词典API，提供真实的英语词典查询。" : "请先配置词典服务。"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">功能特性</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">✨ 核心功能</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 实时单词查询</li>
                <li>• 音标和发音播放</li>
                <li>• 多种词性释义</li>
                <li>• 例句展示</li>
                <li>• 查询历史记录</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">🔧 技术特性</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 智能缓存机制</li>
                <li>• 网络错误处理</li>
                <li>• 配置验证</li>
                <li>• 响应式设计</li>
                <li>• TypeScript 支持</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 单词弹窗 */}
      {selectedWord && (
        <WordPopover
          word={selectedWord}
          position={popoverPosition}
          onClose={() => setSelectedWord(null)}
          onAddToWordbook={handleAddToWordbook}
        />
      )}
    </div>
  );
}