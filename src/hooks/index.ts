import { useState, useEffect } from 'react';

// 本地存储 Hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
};

// 媒体查询 Hook
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

// 主题管理 Hook
export { useTheme } from './useTheme';
export { useSettings } from './useSettings';
export { useDictionary, useDictionaryQuery } from './useDictionary';
export { useSpeech } from './useSpeech';
export type { UseSpeechOptions, UseSpeechReturn } from './useSpeech';
export { useVoiceRecognition } from './useVoiceRecognition';
export { useWordbook } from './useWordbook';
export type { 
  UseVoiceRecognitionOptions, 
  UseVoiceRecognitionReturn, 
  VoiceRecognitionState, 
  RecognitionResult 
} from './useVoiceRecognition';
