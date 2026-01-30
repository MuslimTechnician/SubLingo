import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'theme';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    return storedTheme || 'dark';
  });

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    if (theme === 'dark') {
      document.body.className = 'bg-zinc-950 text-zinc-100';
    } else {
      document.body.className = 'bg-zinc-50 text-zinc-900';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };
};
