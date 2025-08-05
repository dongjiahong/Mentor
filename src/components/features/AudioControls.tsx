
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX,
  Settings
} from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSpeech } from '@/hooks/useSpeech';
import { AppError } from '@/types';
import { cn } from '@/lib/utils';

export interface AudioControlsProps {
  className?: string;
  text: string;
  showProgress?: boolean;
  showVolumeControl?: boolean;
  showSpeedControl?: boolean;
  showVoiceSelection?: boolean;
  onError?: (error: AppError) => void;
}

/**
 * 音频控制组件
 * 提供播放、暂停、停止、音量、语速等控制功能
 */
export function AudioControls({
  className,
  text,
  showProgress = true,
  showVolumeControl = true,
  showSpeedControl = true,
  showVoiceSelection = true,
  onError
}: AudioControlsProps) {
  const {
    playbackState,
    speechOptions,
    setSpeechOptions,
    englishVoices,
    speak,
    pause,
    resume,
    stop,
    estimateDuration,
    isSupported
  } = useSpeech({ onError });

  // 如果不支持语音功能，显示提示
  if (!isSupported) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            当前浏览器不支持语音合成功能
          </div>
        </CardContent>
      </Card>
    );
  }

  // 播放控制函数
  const handlePlay = async () => {
    if (!text.trim()) return;
    try {
      await speak(text);
    } catch (error) {
      // 错误已在useSpeech中处理
    }
  };

  // 音量控制
  const handleVolumeChange = (value: number[]) => {
    const volume = value[0];
    setSpeechOptions({ ...speechOptions, volume });
  };

  const handleMuteToggle = () => {
    const newVolume = (speechOptions.volume || 0) > 0 ? 0 : 1.0;
    setSpeechOptions({ ...speechOptions, volume: newVolume });
  };

  // 语速控制
  const handleRateChange = (value: number[]) => {
    const rate = value[0];
    setSpeechOptions({ ...speechOptions, rate });
  };

  // 音调控制
  const handlePitchChange = (value: number[]) => {
    const pitch = value[0];
    setSpeechOptions({ ...speechOptions, pitch });
  };

  // 语音选择
  const handleVoiceChange = (voiceURI: string) => {
    const voice = englishVoices.find(v => v.voiceURI === voiceURI);
    if (voice) {
      setSpeechOptions({ ...speechOptions, voice });
    }
  };

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 估算总时长
  const estimatedDuration = estimateDuration(text);
  const estimatedSeconds = Math.floor(estimatedDuration / 1000);
  const currentSeconds = Math.floor((playbackState.progress / 100) * estimatedSeconds);

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* 主控制按钮 */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={stop}
              disabled={!playbackState.isPlaying && !playbackState.isPaused}
            >
              <Square className="h-4 w-4" />
            </Button>

            {playbackState.isPlaying && !playbackState.isPaused ? (
              <Button onClick={pause} size="lg">
                <Pause className="h-5 w-5" />
              </Button>
            ) : playbackState.isPaused ? (
              <Button onClick={resume} size="lg">
                <Play className="h-5 w-5" />
              </Button>
            ) : (
              <Button onClick={handlePlay} size="lg" disabled={!text.trim()}>
                <Play className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* 进度条 */}
          {showProgress && (
            <div className="space-y-2">
              <Progress value={playbackState.progress} className="w-full" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentSeconds)}</span>
                <span>{formatTime(estimatedSeconds)}</span>
              </div>
            </div>
          )}

          {/* 控制面板 */}
          <div className="flex items-center justify-between">
            {/* 音量控制 */}
            {showVolumeControl && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMuteToggle}
                >
                  {(speechOptions.volume || 0) === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <div className="w-20">
                  <Slider
                    value={[speechOptions.volume || 1.0]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* 设置按钮 */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">语音设置</h4>
                  
                  {/* 语速控制 */}
                  {showSpeedControl && (
                    <div className="space-y-2">
                      <Label>语速: {speechOptions.rate?.toFixed(1)}x</Label>
                      <Slider
                        value={[speechOptions.rate || 1.0]}
                        onValueChange={handleRateChange}
                        max={2}
                        min={0.5}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* 音调控制 */}
                  <div className="space-y-2">
                    <Label>音调: {speechOptions.pitch?.toFixed(1)}</Label>
                    <Slider
                      value={[speechOptions.pitch || 1.0]}
                      onValueChange={handlePitchChange}
                      max={2}
                      min={0.5}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  {/* 语音选择 */}
                  {showVoiceSelection && englishVoices.length > 0 && (
                    <div className="space-y-2">
                      <Label>语音</Label>
                      <Select
                        value={speechOptions.voice?.voiceURI || ''}
                        onValueChange={handleVoiceChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择语音" />
                        </SelectTrigger>
                        <SelectContent>
                          {englishVoices.map((voice) => (
                            <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                              {voice.name} ({voice.lang})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* 状态显示 */}
          {playbackState.isPlaying && (
            <div className="text-center text-sm text-muted-foreground">
              {playbackState.isPaused ? '已暂停' : '正在播放...'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}