import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Mic, 
  MicOff,
  Play, 
  Pause,
  Volume2,
  RotateCcw,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Target,
  Waveform,
  Clock,
  MessageSquare,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  UniversalContent,
  VoiceAttempt,
  PronunciationScore,
  ContentSentence,
  ContentDialogue
} from '@/types';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useSpeech } from '@/hooks/useSpeech';

interface SpeakingPracticePanelProps {
  content: UniversalContent;
  onBack: () => void;
  onComplete: () => void;
  className?: string;
}

interface PracticeState {
  currentIndex: number;
  attempts: Map<string, VoiceAttempt[]>;
  scores: Map<string, PronunciationScore>;
  mode: 'sentence' | 'dialogue';
}

// 语音识别错误类型
const RECOGNITION_ERRORS = {
  'not-allowed': '麦克风权限被拒绝，请允许使用麦克风',
  'no-speech': '未检测到语音，请重试',
  'aborted': '录音被中断',
  'network': '网络错误，请检查网络连接',
  'not-supported': '浏览器不支持语音识别'
};

export function SpeakingPracticePanel({
  content,
  onBack,
  onComplete,
  className
}: SpeakingPracticePanelProps) {
  const [practiceState, setPracticeState] = useState<PracticeState>({
    currentIndex: 0,
    attempts: new Map(),
    scores: new Map(),
    mode: content.sentences && content.sentences.length > 0 ? 'sentence' : 'dialogue'
  });

  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [currentAttemptStart, setCurrentAttemptStart] = useState<number>(0);

  // 语音识别和合成hooks
  const {
    startRecognition,
    stopRecognition,
    isListening,
    transcript,
    confidence,
    error: recognitionError,
    clearTranscript
  } = useVoiceRecognition({
    continuous: false,
    interimResults: true,
    lang: 'en-US'
  });

  const {
    speak,
    stop: stopSpeaking,
    isSupported: speechSupported,
    isSpeaking
  } = useSpeech();

  // 获取当前练习项
  const getCurrentItem = useCallback(() => {
    if (practiceState.mode === 'sentence' && content.sentences) {
      return content.sentences[practiceState.currentIndex];
    } else if (practiceState.mode === 'dialogue' && content.conversations) {
      return content.conversations[practiceState.currentIndex];
    }
    return null;
  }, [content, practiceState.currentIndex, practiceState.mode]);

  // 获取总项目数
  const getTotalItems = useCallback(() => {
    if (practiceState.mode === 'sentence' && content.sentences) {
      return content.sentences.length;
    } else if (practiceState.mode === 'dialogue' && content.conversations) {
      return content.conversations.filter(conv => conv.speaker === 'user').length;
    }
    return 0;
  }, [content, practiceState.mode]);

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      setCurrentAttemptStart(Date.now());
      clearTranscript();
      setIsRecording(true);
      await startRecognition();
    } catch (error) {
      console.error('开始录音失败:', error);
      setIsRecording(false);
    }
  }, [startRecognition, clearTranscript]);

  // 停止录音
  const stopRecording = useCallback(() => {
    setIsRecording(false);
    stopRecognition();
  }, [stopRecognition]);

  // 播放范例音频
  const playExample = useCallback((text: string) => {
    if (speechSupported) {
      speak(text, { rate: 0.8, pitch: 1.0 });
    }
  }, [speak, speechSupported]);

  // 评估发音
  const evaluatePronunciation = useCallback((originalText: string, spokenText: string): PronunciationScore => {
    // 简单的发音评分算法（实际应用中应该使用更复杂的算法）
    const original = originalText.toLowerCase().replace(/[^\w\s]/g, '');
    const spoken = spokenText.toLowerCase().replace(/[^\w\s]/g, '');
    
    // 计算相似度
    const originalWords = original.split(' ');
    const spokenWords = spoken.split(' ');
    
    let correctWords = 0;
    const totalWords = originalWords.length;
    
    originalWords.forEach((word, index) => {
      if (spokenWords[index] && 
          (spokenWords[index] === word || 
           spokenWords[index].includes(word) ||
           word.includes(spokenWords[index]))) {
        correctWords++;
      }
    });

    const accuracy = totalWords > 0 ? (correctWords / totalWords) * 100 : 0;
    const overallScore = Math.min(100, accuracy + (confidence * 20)); // 加入识别置信度

    return {
      overallScore: Math.round(overallScore),
      accuracyScore: Math.round(accuracy),
      fluencyScore: Math.round(confidence * 100),
      pronunciationScore: Math.round(overallScore * 0.9), // 稍微降低发音分数
      feedback: generateFeedback(overallScore, accuracy, confidence),
      mistakes: findMistakes(originalWords, spokenWords)
    };
  }, [confidence]);

  // 生成反馈
  const generateFeedback = (overall: number, accuracy: number, confidence: number): string => {
    if (overall >= 90) return '优秀！发音非常准确，语调自然流畅。';
    if (overall >= 80) return '很好！发音基本准确，继续保持。';
    if (overall >= 70) return '不错！发音还可以，注意个别单词的读音。';
    if (overall >= 60) return '需要改进。多练习单词发音，注意语调。';
    return '需要多加练习。建议先听范例，然后慢慢跟读。';
  };

  // 找出发音错误
  const findMistakes = (originalWords: string[], spokenWords: string[]) => {
    const mistakes = [];
    for (let i = 0; i < originalWords.length; i++) {
      const original = originalWords[i];
      const spoken = spokenWords[i];
      
      if (!spoken || (!spoken.includes(original) && !original.includes(spoken))) {
        mistakes.push({
          word: original,
          expected: original,
          actual: spoken || '[未识别]',
          suggestion: `请重点练习 "${original}" 的发音`
        });
      }
    }
    return mistakes.slice(0, 3); // 最多显示3个错误
  };

  // 处理录音完成
  useEffect(() => {
    if (!isRecording && transcript && currentAttemptStart > 0) {
      const currentItem = getCurrentItem();
      if (!currentItem) return;

      const originalText = 'text' in currentItem ? currentItem.text : currentItem.expectedResponse || '';
      
      // 创建尝试记录
      const attempt: VoiceAttempt = {
        id: Date.now().toString(),
        sentenceId: currentItem.id,
        originalText,
        spokenText: transcript,
        similarity: confidence * 100,
        timestamp: new Date(),
        pronunciationScore: evaluatePronunciation(originalText, transcript)
      };

      // 更新状态
      setPracticeState(prev => {
        const newAttempts = new Map(prev.attempts);
        const itemAttempts = newAttempts.get(currentItem.id) || [];
        newAttempts.set(currentItem.id, [...itemAttempts, attempt]);

        const newScores = new Map(prev.scores);
        newScores.set(currentItem.id, attempt.pronunciationScore!);

        return {
          ...prev,
          attempts: newAttempts,
          scores: newScores
        };
      });

      setShowFeedback(true);
    }
  }, [isRecording, transcript, confidence, currentAttemptStart, getCurrentItem, evaluatePronunciation]);

  // 下一个项目
  const nextItem = useCallback(() => {
    const totalItems = getTotalItems();
    if (practiceState.currentIndex < totalItems - 1) {
      setPracticeState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1
      }));
      setShowFeedback(false);
      clearTranscript();
    }
  }, [practiceState.currentIndex, getTotalItems, clearTranscript]);

  // 上一个项目
  const previousItem = useCallback(() => {
    if (practiceState.currentIndex > 0) {
      setPracticeState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1
      }));
      setShowFeedback(false);
      clearTranscript();
    }
  }, [practiceState.currentIndex, clearTranscript]);

  // 重试当前项目
  const retryItem = useCallback(() => {
    setShowFeedback(false);
    clearTranscript();
  }, [clearTranscript]);

  // 计算总体得分
  const calculateOverallScore = useCallback(() => {
    const scores = Array.from(practiceState.scores.values());
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((sum, score) => sum + score.overallScore, 0) / scores.length);
  }, [practiceState.scores]);

  // 渲染句子练习
  const renderSentencePractice = () => {
    const sentence = getCurrentItem() as ContentSentence;
    if (!sentence) return null;

    const currentScore = practiceState.scores.get(sentence.id);
    const attempts = practiceState.attempts.get(sentence.id) || [];

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              句子跟读练习
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {practiceState.currentIndex + 1} / {content.sentences?.length || 0}
              </Badge>
              {currentScore && (
                <Badge variant={currentScore.overallScore >= 80 ? "default" : "secondary"}>
                  {currentScore.overallScore}分
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 目标文本 */}
          <div className="text-center">
            <div className="p-6 bg-primary/5 rounded-lg border-2 border-dashed border-primary/20">
              <p className="text-xl font-medium text-primary mb-2">
                {sentence.text}
              </p>
              {sentence.translation && (
                <p className="text-sm text-muted-foreground">
                  {sentence.translation}
                </p>
              )}
            </div>
            {sentence.phonetic && (
              <p className="text-sm text-muted-foreground mt-2">
                音标: {sentence.phonetic}
              </p>
            )}
          </div>

          {/* 音频和提示 */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => playExample(sentence.text)}
              disabled={isSpeaking || !speechSupported}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              听范例
            </Button>
            {sentence.tips && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                {sentence.tips}
              </div>
            )}
          </div>

          {/* 录音控件 */}
          <div className="text-center space-y-4">
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isListening && !isRecording}
              className="h-16 w-16 rounded-full"
            >
              {isRecording ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
            
            <div className="space-y-2">
              {isRecording && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  正在录音...
                </div>
              )}
              
              {transcript && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>您说的：</strong>{transcript}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 错误提示 */}
          {recognitionError && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {RECOGNITION_ERRORS[recognitionError as keyof typeof RECOGNITION_ERRORS] || recognitionError}
            </div>
          )}

          {/* 反馈结果 */}
          {showFeedback && currentScore && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  发音评估
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 分数显示 */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {currentScore.overallScore}
                    </div>
                    <div className="text-sm text-muted-foreground">总分</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {currentScore.accuracyScore}
                    </div>
                    <div className="text-sm text-muted-foreground">准确度</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {currentScore.fluencyScore}
                    </div>
                    <div className="text-sm text-muted-foreground">流利度</div>
                  </div>
                </div>

                {/* 反馈文本 */}
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{currentScore.feedback}</p>
                </div>

                {/* 发音错误 */}
                {currentScore.mistakes && currentScore.mistakes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">需要注意的发音：</p>
                    {currentScore.mistakes.map((mistake, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                        <span className="text-sm">
                          <strong>{mistake.word}</strong> → {mistake.actual}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {mistake.suggestion}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={retryItem} className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    重试
                  </Button>
                  {practiceState.currentIndex < (content.sentences?.length || 0) - 1 ? (
                    <Button onClick={nextItem} className="flex-1">
                      下一句
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={onComplete} className="flex-1">
                      完成练习
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 历史尝试 */}
          {attempts.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">练习历史 ({attempts.length} 次尝试)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attempts.slice(-3).map((attempt, index) => (
                    <div key={attempt.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                      <span>尝试 {attempts.length - 2 + index}</span>
                      <span className="font-medium">
                        {attempt.pronunciationScore?.overallScore || 0}分
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    );
  };

  // 渲染对话练习
  const renderDialoguePractice = () => {
    const conversations = content.conversations || [];
    const userConversations = conversations.filter(conv => conv.speaker === 'user');
    const currentUserConv = userConversations[practiceState.currentIndex];
    
    if (!currentUserConv) return null;

    const currentScore = practiceState.scores.get(currentUserConv.id);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              对话练习
            </CardTitle>
            <Badge variant="outline">
              {practiceState.currentIndex + 1} / {userConversations.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 对话上下文 */}
          <div className="space-y-3">
            {conversations.map((conv, index) => {
              if (conv.id === currentUserConv.id) {
                return (
                  <div key={conv.id} className="p-4 bg-primary/5 border-2 border-dashed border-primary/20 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">您的回答：</div>
                    <p className="font-medium text-primary">
                      {conv.expectedResponse || '请根据上下文回答'}
                    </p>
                    {conv.translation && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {conv.translation}
                      </p>
                    )}
                  </div>
                );
              } else if (Math.abs(conversations.indexOf(conv) - conversations.indexOf(currentUserConv)) <= 1) {
                return (
                  <div key={conv.id} className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      {conv.speakerName || (conv.speaker === 'system' ? '系统' : '用户')}：
                    </div>
                    <p>{conv.text}</p>
                    {conv.translation && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {conv.translation}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* 提示信息 */}
          {currentUserConv.hints && currentUserConv.hints.length > 0 && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium mb-2">💡 提示：</p>
              <ul className="text-sm space-y-1">
                {currentUserConv.hints.map((hint, index) => (
                  <li key={index}>• {hint}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 录音和反馈区域 */}
          <div className="text-center space-y-4">
            <Button
              size="lg"
              variant={isRecording ? "destructive" : "default"}
              onClick={isRecording ? stopRecording : startRecording}
              className="h-16 w-16 rounded-full"
            >
              {isRecording ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>

            {transcript && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>您说的：</strong>{transcript}
                </p>
              </div>
            )}
          </div>

          {/* 反馈结果 */}
          {showFeedback && currentScore && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle>回答评估</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {currentScore.overallScore}分
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentScore.feedback}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={retryItem} className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    重试
                  </Button>
                  {practiceState.currentIndex < userConversations.length - 1 ? (
                    <Button onClick={nextItem} className="flex-1">
                      下一个对话
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={onComplete} className="flex-1">
                      完成练习
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("max-w-4xl mx-auto p-4 space-y-6", className)}>
      {/* 返回按钮 */}
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      {/* 头部信息 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{content.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{content.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {calculateOverallScore()}
              </div>
              <div className="text-sm text-muted-foreground">平均得分</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 进度条 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>练习进度</span>
          <span>{practiceState.scores.size} / {getTotalItems()}</span>
        </div>
        <Progress 
          value={(practiceState.scores.size / getTotalItems()) * 100}
          className="w-full"
        />
      </div>

      {/* 练习内容 */}
      {practiceState.mode === 'sentence' ? renderSentencePractice() : renderDialoguePractice()}

      {/* 导航按钮 */}
      {getTotalItems() > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={previousItem}
            disabled={practiceState.currentIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            上一个
          </Button>
          <Button
            variant="outline"
            onClick={nextItem}
            disabled={practiceState.currentIndex === getTotalItems() - 1}
          >
            下一个
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* 浏览器兼容性提示 */}
      {!speechSupported && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                您的浏览器不完全支持语音功能，建议使用Chrome浏览器以获得最佳体验。
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}