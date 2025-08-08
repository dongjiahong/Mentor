import React from 'react';
import { AppError } from './core';
import { LearningContent, Word } from './learning';
import { PronunciationScore } from './practice';

// ============================================================================
// 组件Props接口
// ============================================================================

// 通用组件Props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 内容显示组件Props
export interface ContentDisplayProps extends BaseComponentProps {
  content: LearningContent;
  showTranslation?: boolean;
  onWordClick?: (word: string) => void;
  onSentencePlay?: (sentence: string) => void;
}

// 音频控制组件Props
export interface AudioControlsProps extends BaseComponentProps {
  text: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
}

// 语音录制组件Props
export interface VoiceRecorderProps extends BaseComponentProps {
  targetText: string;
  onRecordingComplete?: (result: string, score?: PronunciationScore) => void;
  onError?: (error: AppError) => void;
}

// 单词卡片组件Props
export interface WordCardProps extends BaseComponentProps {
  word: Word;
  onProficiencyUpdate?: (wordId: number, level: number) => void;
  onRemove?: (wordId: number) => void;
  onPlay?: (word: string) => void;
}