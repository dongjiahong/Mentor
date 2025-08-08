import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Headphones
} from 'lucide-react';

interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isLoading: boolean;
  error: string | null;
  progress: number;
}

interface AudioPlayerProps {
  audioState: AudioState;
  onPlayPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  className?: string;
}

// 播放速度选项
const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5];

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export function AudioPlayer({
  audioState,
  onPlayPause,
  onStop,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
  className
}: AudioPlayerProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Headphones className="h-5 w-5" />
          音频播放器
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 错误状态 */}
        {audioState.error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg">
            {audioState.error}
          </div>
        )}

        {/* 播放进度 */}
        <div className="space-y-2">
          <Progress 
            value={audioState.progress}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatTime(audioState.currentTime)}</span>
            <span>{formatTime(audioState.duration)}</span>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            使用 TTS 语音播放，不支持跳转功能
          </div>
        </div>

        {/* 播放控件 */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSeek(Math.max(0, audioState.currentTime - 10))}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={onPlayPause}
            disabled={audioState.isLoading}
            className="h-12 w-12"
          >
            {audioState.isPlaying ? 
              <Pause className="h-5 w-5" /> : 
              <Play className="h-5 w-5" />
            }
          </Button>
          
          <Button variant="outline" size="sm" onClick={onStop}>
            <Square className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSeek(Math.min(audioState.duration, audioState.currentTime + 10))}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* 播放设置 */}
        <div className="flex items-center justify-between gap-4">
          {/* 音量控制 */}
          <div className="flex items-center gap-2 flex-1">
            {audioState.volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            <Slider
              value={[audioState.volume * 100]}
              onValueChange={([value]) => onVolumeChange(value)}
              max={100}
              step={1}
              className="flex-1"
            />
          </div>

          {/* 播放速度 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">速度:</span>
            {playbackSpeeds.map(speed => (
              <Button
                key={speed}
                variant={audioState.playbackRate === speed ? "default" : "outline"}
                size="sm"
                onClick={() => onPlaybackRateChange(speed)}
              >
                {speed}x
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}