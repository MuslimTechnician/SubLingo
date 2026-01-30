import { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { processVideoWithGemini } from '@/services/geminiService';

const API_KEY_STORAGE = 'gemini_api_key';

export const useVideoProcessing = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE, key);
  };

  const processVideo = async (file: File, selectedLangCode: string, enableTranslation: boolean = true) => {
    if (!apiKey) {
      throw new Error('Please enter your Gemini API Key in settings to proceed.');
    }

    setIsProcessing(true);
    setError(null);

    try {
      const langName = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLangCode)?.name || 'English';
      const result = await processVideoWithGemini(file, langName, apiKey, enableTranslation);
      return result;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process video.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    apiKey,
    setApiKey: saveApiKey,
    isProcessing,
    error,
    setError,
    processVideo,
  };
};
