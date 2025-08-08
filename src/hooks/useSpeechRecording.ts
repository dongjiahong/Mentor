import { useState, useCallback } from 'react';
import { useVoiceRecognition } from './useVoiceRecognition';

export interface SpeechRecordingState {
  isRecording: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  isListening: boolean;
}

export function useSpeechRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentAttemptStart, setCurrentAttemptStart] = useState<number>(0);

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

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    stopRecognition();
  }, [stopRecognition]);

  const resetRecording = useCallback(() => {
    setIsRecording(false);
    setCurrentAttemptStart(0);
    clearTranscript();
  }, [clearTranscript]);

  return {
    // State
    isRecording,
    transcript,
    confidence,
    error: recognitionError,
    isListening,
    currentAttemptStart,
    
    // Actions
    startRecording,
    stopRecording,
    resetRecording,
    clearTranscript
  };
}