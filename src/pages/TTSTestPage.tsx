import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AudioControls, WordPlayButton, SentencePlayButton, ArticlePlayButton } from '@/components/features';
import { useSpeech } from '@/hooks/useSpeech';
import { AppError } from '@/types';

/**
 * TTS功能测试页面
 */
export function TTSTestPage() {
  const [testText, setTestText] = useState(
    "Hello, this is a test of the Text-to-Speech functionality. " +
    "The system can read entire articles, individual sentences, or single words. " +
    "You can control the playback speed, volume, and voice selection."
  );
  const [error, setError] = useState<AppError | null>(null);

  const { isSupported, isRecognitionSupported, englishVoices } = useSpeech({
    onError: setError
  });

  const handleError = (error: AppError) => {
    setError(error);
    console.error('TTS Error:', error);
  };

  const clearError = () => {
    setError(null);
  };

  // 测试用的单词和句子
  const testWords = ['Hello', 'World', 'Speech', 'Synthesis', 'Technology'];
  const testSentences = [
    'This is a simple sentence.',
    'How are you doing today?',
    'The weather is beautiful outside.',
    'Learning English can be fun and rewarding.'
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">TTS功能测试</h1>
        <p className="text-muted-foreground">
          测试文本转语音功能，包括整篇文章、句子和单词播放
        </p>
      </div>

      {/* 浏览器支持状态 */}
      <Card>
        <CardHeader>
          <CardTitle>浏览器支持状态</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span>语音合成 (TTS):</span>
            <Badge variant={isSupported ? 'default' : 'destructive'}>
              {isSupported ? '支持' : '不支持'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span>语音识别 (STT):</span>
            <Badge variant={isRecognitionSupported ? 'default' : 'destructive'}>
              {isRecognitionSupported ? '支持' : '不支持'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span>可用英语语音:</span>
            <Badge variant="outline">
              {englishVoices.length} 个
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 错误显示 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">错误: {error.type}</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
              <Button variant="outline" size="sm" onClick={clearError}>
                清除
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主要音频控制器 */}
      <Card>
        <CardHeader>
          <CardTitle>完整音频控制器</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="输入要朗读的文本..."
            rows={4}
          />
          <AudioControls
            text={testText}
            onError={handleError}
            showProgress={true}
            showVolumeControl={true}
            showSpeedControl={true}
            showVoiceSelection={true}
          />
        </CardContent>
      </Card>

      {/* 快速播放按钮测试 */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* 单词播放测试 */}
        <Card>
          <CardHeader>
            <CardTitle>单词播放测试</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              点击单词旁边的播放按钮来听发音
            </p>
            <div className="space-y-2">
              {testWords.map((word, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <span className="font-medium">{word}</span>
                  <WordPlayButton text={word} onError={handleError} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 句子播放测试 */}
        <Card>
          <CardHeader>
            <CardTitle>句子播放测试</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              点击句子旁边的播放按钮来听朗读
            </p>
            <div className="space-y-2">
              {testSentences.map((sentence, index) => (
                <div key={index} className="flex items-start gap-2 p-2 border rounded">
                  <span className="flex-1">{sentence}</span>
                  <SentencePlayButton text={sentence} onError={handleError} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 文章播放测试 */}
      <Card>
        <CardHeader>
          <CardTitle>文章播放测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Sample Article</h3>
            <p className="mb-2">
              Text-to-speech (TTS) technology has revolutionized the way we interact with digital content. 
              It enables computers to convert written text into spoken words, making information more accessible 
              to people with visual impairments and providing a convenient way to consume content while multitasking.
            </p>
            <p className="mb-2">
              Modern TTS systems use advanced algorithms and neural networks to produce natural-sounding speech. 
              They can adjust pronunciation, intonation, and speaking rate to create a more human-like experience.
            </p>
            <p>
              In educational applications, TTS helps students with reading difficulties and supports language learning 
              by providing correct pronunciation examples.
            </p>
          </div>
          <div className="flex justify-center">
            <ArticlePlayButton 
              text="Text-to-speech (TTS) technology has revolutionized the way we interact with digital content. It enables computers to convert written text into spoken words, making information more accessible to people with visual impairments and providing a convenient way to consume content while multitasking. Modern TTS systems use advanced algorithms and neural networks to produce natural-sounding speech. They can adjust pronunciation, intonation, and speaking rate to create a more human-like experience. In educational applications, TTS helps students with reading difficulties and supports language learning by providing correct pronunciation examples."
              onError={handleError}
            >
              播放文章
            </ArticlePlayButton>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">功能特性:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>支持整篇文章、句子和单词的语音播放</li>
              <li>可调节语速、音调和音量</li>
              <li>支持多种英语语音选择</li>
              <li>播放进度显示和控制</li>
              <li>播放、暂停、停止控制</li>
              <li>错误处理和用户反馈</li>
            </ul>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">浏览器兼容性:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Chrome 33+ (推荐)</li>
              <li>Firefox 49+</li>
              <li>Safari 7+</li>
              <li>Edge 14+</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}