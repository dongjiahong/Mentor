import { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WordPopover } from './WordPopover';
import { useDictionary } from '@/hooks';
import { WordDefinition } from '@/types';
import { cn } from '@/lib/utils';

interface SimpleDictionaryDemoProps {
  className?: string;
}

export function SimpleDictionaryDemo({ className }: SimpleDictionaryDemoProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WordDefinition[]>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });

  const { 
    searchWords, 
    isConfigured, 
    queryState 
  } = useDictionary();

  // 示例文本
  const sampleText = `
    Learning English can be challenging but rewarding. Reading comprehension is essential 
    for academic success. Students should practice vocabulary regularly to improve their 
    language skills. Dictionary tools help learners understand unfamiliar words quickly.
  `;

  const handleSearch = async () => {
    if (!searchQuery.trim() || !isConfigured) return;

    try {
      const results = await searchWords(searchQuery.trim(), 5);
      setSearchResults(results);
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    }
  };

  const handleWordClick = (word: string, event: React.MouseEvent) => {
    if (!isConfigured) {
      alert('请先配置词典服务');
      return;
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 5,
    });
    setSelectedWord(word);
  };

  const handleAddToWordbook = async (word: string, definition: WordDefinition) => {
    console.log('添加到单词本:', { word, definition });
    await new Promise(resolve => setTimeout(resolve, 500));
    alert(`单词 "${word}" 已添加到单词本！`);
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
            className={cn(
              "cursor-pointer hover:bg-blue-100 hover:text-blue-600 rounded px-0.5 transition-colors",
              !isConfigured && "cursor-not-allowed opacity-50"
            )}
            onClick={(e) => handleWordClick(part.toLowerCase(), e)}
            title={isConfigured ? `点击查询 "${part}"` : "请先配置词典服务"}
          >
            {part}
          </span>
        );
      }
      
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={cn("space-y-6 max-w-4xl mx-auto p-6", className)}>
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <span>词典服务演示</span>
          </h2>
          <p className="text-gray-600 mt-1">
            体验单词查询功能
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={isConfigured ? "default" : "secondary"}>
            {isConfigured ? "已配置" : "未配置"}
          </Badge>
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
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              disabled={!isConfigured}
            />
            <Button 
              onClick={handleSearch}
              disabled={!searchQuery.trim() || !isConfigured || queryState.status === 'loading'}
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
                          <span className="text-sm text-gray-500">
                            {result.phonetic}
                          </span>
                        )}
                      </div>
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
            点击文本中的单词查看释义（需要先配置词典服务）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="leading-relaxed text-gray-800">
              {renderClickableText(sampleText)}
            </p>
          </div>
          
          {!isConfigured && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                💡 提示：配置词典服务后，您可以点击文本中的任意单词查看详细释义。
              </p>
            </div>
          )}
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