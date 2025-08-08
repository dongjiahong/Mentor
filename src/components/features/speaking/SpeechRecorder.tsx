import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// 语音识别错误类型
const RECOGNITION_ERRORS = {
  'not-allowed': '麦克风权限被拒绝，请允许使用麦克风',
  'no-speech': '未检测到语音，请重试',
  'aborted': '录音被中断',
  'network': '网络错误，请检查网络连接',
  'not-supported': '浏览器不支持语音识别'
};

interface SpeechRecorderProps {
  isRecording: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  className?: string;
}

export function SpeechRecorder({
  isRecording,
  isListening,
  transcript,
  error,
  onStartRecording,
  onStopRecording,
  className
}: SpeechRecorderProps) {
  return (
    <div className={cn("text-center space-y-4", className)}>
      {/* 录音按钮 */}
      <Button
        size="lg"
        variant={isRecording ? "destructive" : "default"}
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={isListening && !isRecording}
        className="h-16 w-16 rounded-full"
      >
        {isRecording ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>
      
      {/* 录音状态和转录文本 */}
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

      {/* 错误提示 */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
          {RECOGNITION_ERRORS[error as keyof typeof RECOGNITION_ERRORS] || error}
        </div>
      )}
    </div>
  );
}