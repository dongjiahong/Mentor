import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2 } from 'lucide-react';
import { useSpeech } from '@/hooks/useSpeech';
import { SpeechOptions, AppError } from '@/types';
import { cn } from '@/lib/utils';

export interface PlayButtonProps {
  className?: string;
  text: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  options?: SpeechOptions;
  onError?: (error: AppError) => void;
  children?: React.ReactNode;
}

/**
 * 播放按钮组件
 * 用于快速播放文本内容
 */
export function PlayButton({
  className,
  text,
  variant = 'ghost',
  size = 'sm',
  disabled = false,
  options,
  onError,
  children
}: PlayButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    playbackState,
    speak,
    pause,
    resume,
    stop,
    isSupported
  } = useSpeech({ onError });

  // 检查是否正在播放当前文本
  const isPlayingCurrentText = playbackState.isPlaying && playbackState.currentText === text;

  const handleClick = async () => {
    if (!text.trim() || disabled || !isSupported) return;

    try {
      if (isPlayingCurrentText) {
        if (playbackState.isPaused) {
          resume();
        } else {
          pause();
        }
      } else {
        // 如果正在播放其他内容，先停止
        if (playbackState.isPlaying) {
          stop();
        }
        
        setIsLoading(true);
        await speak(text, options);
      }
    } catch (error) {
      // 错误已在useSpeech中处理
    } finally {
      setIsLoading(false);
    }
  };

  // 如果不支持语音功能，不显示按钮
  if (!isSupported) {
    return null;
  }

  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (isPlayingCurrentText && !playbackState.isPaused) {
      return <Pause className="h-4 w-4" />;
    }
    
    return <Play className="h-4 w-4" />;
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || !text.trim()}
      className={cn(className)}
      title={isPlayingCurrentText && !playbackState.isPaused ? '暂停' : '播放'}
    >
      {getIcon()}
      {children}
    </Button>
  );
}

/**
 * 单词播放按钮
 */
export function WordPlayButton(props: Omit<PlayButtonProps, 'options'>) {
  const wordOptions: SpeechOptions = {
    rate: 0.8, // 单词播放稍慢一些
  };

  return <PlayButton {...props} options={wordOptions} />;
}

/**
 * 句子播放按钮
 */
export function SentencePlayButton(props: PlayButtonProps) {
  return <PlayButton {...props} />;
}

/**
 * 文章播放按钮
 */
export function ArticlePlayButton(props: PlayButtonProps) {
  return <PlayButton {...props} variant="default" size="default" />;
}