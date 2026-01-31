import { useState } from 'react';

const API_KEY_STORAGE = 'google_fonts_api_key';

export const useGoogleFontsApiKey = () => {
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem(API_KEY_STORAGE) || '';
  });

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(API_KEY_STORAGE, key);
  };

  const clearApiKey = () => {
    setApiKey('');
    localStorage.removeItem(API_KEY_STORAGE);
  };

  return {
    apiKey,
    setApiKey: saveApiKey,
    clearApiKey,
  };
};
