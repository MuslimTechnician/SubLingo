import { useState, useEffect } from 'react';
import { SubtitleStyle } from '@/types';

const isMobile = () => window.innerWidth < 640;

const DEFAULT_STYLE: SubtitleStyle = {
  backgroundColor: '#000000',
  textColor: '#FFFFFF',
  fontFamily: 'Roboto',
  fontSize: isMobile() ? 10 : 20, // 10px on mobile, 20px on desktop
  bgOpacity: 0.75,
  bottomPosition: 8, // 8% from bottom
};

export const useSubtitleStyles = () => {
  const [style, setStyle] = useState<SubtitleStyle>(() => {
    const saved = localStorage.getItem('subtitleStyle');
    return saved ? JSON.parse(saved) : DEFAULT_STYLE;
  });

  useEffect(() => {
    localStorage.setItem('subtitleStyle', JSON.stringify(style));
  }, [style]);

  const updateStyle = (updates: Partial<SubtitleStyle>) => {
    setStyle(prev => ({ ...prev, ...updates }));
  };

  const resetStyle = () => {
    setStyle(DEFAULT_STYLE);
  };

  return {
    style,
    updateStyle,
    resetStyle,
  };
};
