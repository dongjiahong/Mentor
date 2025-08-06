import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface VoiceVisualizerProps {
  isRecording: boolean;
  className?: string;
  barCount?: number;
  variant?: 'bars' | 'circle' | 'wave';
  color?: 'primary' | 'red' | 'green' | 'blue';
}

export function VoiceVisualizer({
  isRecording,
  className,
  barCount = 5,
  variant = 'bars',
  color = 'primary'
}: VoiceVisualizerProps) {
  const [animationKey, setAnimationKey] = useState(0);

  // 重新触发动画
  useEffect(() => {
    if (isRecording) {
      setAnimationKey(prev => prev + 1);
    }
  }, [isRecording]);

  const colorClasses = {
    primary: 'text-primary',
    red: 'text-red-500',
    green: 'text-green-500',
    blue: 'text-blue-500'
  };

  if (variant === 'circle') {
    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <div 
          className={cn(
            "w-12 h-12 rounded-full border-2 flex items-center justify-center",
            colorClasses[color],
            isRecording ? "pulse-glow border-current" : "border-muted"
          )}
        >
          <div className={cn(
            "w-6 h-6 rounded-full",
            isRecording ? "bg-current animate-pulse" : "bg-muted"
          )} />
        </div>
        
        {isRecording && (
          <>
            <div className={cn(
              "absolute w-16 h-16 rounded-full border opacity-30 animate-ping",
              `border-${color}-500`
            )} />
            <div className={cn(
              "absolute w-20 h-20 rounded-full border opacity-20 animate-ping",
              `border-${color}-500`
            )} 
            style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={cn(
        "flex items-center gap-1 h-8",
        colorClasses[color],
        className
      )}>
        {Array.from({ length: barCount }).map((_, index) => (
          <div
            key={`${animationKey}-${index}`}
            className={cn(
              "voice-wave",
              isRecording ? "animate-pulse" : ""
            )}
            style={{
              animationDelay: `${index * 0.1}s`,
              backgroundColor: 'currentColor'
            }}
          />
        ))}
      </div>
    );
  }

  // Default bars variant
  return (
    <div className={cn(
      "flex items-end gap-1 h-8",
      colorClasses[color],
      className
    )}>
      {Array.from({ length: barCount }).map((_, index) => {
        const heights = ['h-2', 'h-4', 'h-6', 'h-4', 'h-3'];
        const delays = ['0ms', '150ms', '300ms', '450ms', '600ms'];
        
        return (
          <div
            key={`${animationKey}-${index}`}
            className={cn(
              "w-1 bg-current rounded-full transition-all duration-300",
              heights[index % heights.length],
              isRecording ? "animate-pulse" : "opacity-30"
            )}
            style={{
              animationDelay: delays[index % delays.length],
              height: isRecording ? undefined : '8px'
            }}
          />
        );
      })}
    </div>
  );
}

// 语音活动指示器组件
interface VoiceActivityIndicatorProps {
  isActive: boolean;
  level?: number; // 0-100
  className?: string;
}

export function VoiceActivityIndicator({
  isActive,
  level = 0,
  className
}: VoiceActivityIndicatorProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300",
      isActive 
        ? "bg-red-50 border-red-200 text-red-700" 
        : "bg-muted border-border text-muted-foreground",
      className
    )}>
      <div className={cn(
        "w-2 h-2 rounded-full transition-all duration-300",
        isActive ? "bg-red-500 animate-pulse" : "bg-muted-foreground"
      )} />
      
      <VoiceVisualizer 
        isRecording={isActive}
        barCount={3}
        variant="bars"
        color={isActive ? "red" : "primary"}
        className="scale-75"
      />
      
      <span className="text-xs font-medium">
        {isActive ? '录音中' : '待机中'}
      </span>
      
      {isActive && level > 0 && (
        <div className="flex-1 min-w-12 max-w-16 bg-background rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-red-500 transition-all duration-150 rounded-full"
            style={{ width: `${level}%` }}
          />
        </div>
      )}
    </div>
  );
}

// 语音状态徽章
interface VoiceStatusBadgeProps {
  status: 'idle' | 'listening' | 'processing' | 'success' | 'error';
  message?: string;
  className?: string;
}

export function VoiceStatusBadge({
  status,
  message,
  className
}: VoiceStatusBadgeProps) {
  const statusConfig = {
    idle: {
      color: 'bg-muted text-muted-foreground',
      icon: '⏸️',
      defaultMessage: '待机中'
    },
    listening: {
      color: 'bg-red-100 text-red-700 border border-red-200',
      icon: '🎤',
      defaultMessage: '正在监听'
    },
    processing: {
      color: 'bg-blue-100 text-blue-700 border border-blue-200',
      icon: '⚡',
      defaultMessage: '处理中'
    },
    success: {
      color: 'bg-green-100 text-green-700 border border-green-200',
      icon: '✅',
      defaultMessage: '成功'
    },
    error: {
      color: 'bg-red-100 text-red-700 border border-red-200',
      icon: '❌',
      defaultMessage: '出错了'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
      config.color,
      status === 'listening' && "pulse-glow",
      status === 'processing' && "animate-pulse",
      className
    )}>
      <span className="text-sm">{config.icon}</span>
      <span>{message || config.defaultMessage}</span>
      
      {status === 'processing' && (
        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      )}
    </div>
  );
}