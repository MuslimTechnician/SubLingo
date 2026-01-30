import { useEffect, useRef, useState } from 'react';
import { SubtitleSegment } from '@/types';
import { parseSRTTime } from '@/lib/utils';

export const useSubtitles = (subtitles: SubtitleSegment[] | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subtitles) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const activeSub = subtitles.find((sub) => {
        const start = parseSRTTime(sub.startTime);
        const end = parseSRTTime(sub.endTime);
        return currentTime >= start && currentTime <= end;
      });
      setCurrentSubtitle(activeSub ? activeSub.text : '');
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [subtitles]);

  const seekTo = (timestamp: string) => {
    if (videoRef.current) {
      videoRef.current.currentTime = parseSRTTime(timestamp);
      videoRef.current.play();
    }
  };

  return {
    videoRef,
    currentSubtitle,
    seekTo,
  };
};
