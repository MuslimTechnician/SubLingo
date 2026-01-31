import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Type,
  Palette,
  Rewind,
  FastForward,
  Trash2,
} from 'lucide-react';
import { SubtitleSegment, SubtitleStyle } from '@/types';
import { useSubtitleStyles } from '@/hooks/useSubtitleStyles';
import { useGoogleFonts, loadFontCSS } from '@/hooks/useGoogleFonts';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoUrl: string;
  currentSubtitle: string;
  isDark: boolean;
  subtitles: SubtitleSegment[] | null;
  onRemove: () => void;
}

export const VideoPlayer = ({
  videoRef,
  videoUrl,
  currentSubtitle,
  isDark,
  subtitles,
  onRemove,
}: VideoPlayerProps) => {
  const { fonts: googleFonts, isLoading: fontsLoading } = useGoogleFonts();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const { style: subtitleStyle, updateStyle: updateSubtitleStyle } = useSubtitleStyles();
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Refs for popup positioning
  const mobilePaletteButtonRef = useRef<HTMLButtonElement>(null);
  const mobileSettingsButtonRef = useRef<HTMLButtonElement>(null);
  const desktopPaletteButtonRef = useRef<HTMLButtonElement>(null);
  const desktopSettingsButtonRef = useRef<HTMLButtonElement>(null);

  // Popup positions
  const [palettePopupPosition, setPalettePopupPosition] = useState<{ top: number; left: number; right?: number } | null>(null);
  const [settingsPopupPosition, setSettingsPopupPosition] = useState<{ top: number; left: number; right?: number } | null>(null);

  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-500';

  // Helper function to calculate popup position
  const calculatePopupPosition = useCallback((buttonRef: React.RefObject<HTMLButtonElement | null>, alignRight = false, popupHeight = 250) => {
    const button = buttonRef.current;
    if (!button) return null;

    const rect = button.getBoundingClientRect();
    const popupWidth = alignRight ? 192 : 224; // w-48 or w-56 in pixels
    const gap = 8; // gap between button and popup
    const padding = 8; // Edge padding

    // For mobile: align center, drop down from button
    const isMobile = window.innerWidth < 640;

    if (isMobile) {
      // Start with centered position
      let left = rect.left + rect.width / 2 - popupWidth / 2;

      // Ensure popup doesn't go off right edge
      if (left + popupWidth > window.innerWidth - padding) {
        left = window.innerWidth - popupWidth - padding;
      }

      // Ensure popup doesn't go off left edge
      if (left < padding) {
        left = padding;
      }

      return {
        top: rect.bottom + gap,
        left: left,
      };
    } else {
      // Desktop: align left or right based on button position
      let left = alignRight ? rect.left : rect.left;
      let right = alignRight ? window.innerWidth - rect.right : undefined;

      // For left-aligned popups, check if they'd go off the right edge
      if (!alignRight && left + popupWidth > window.innerWidth - padding) {
        left = window.innerWidth - popupWidth - padding;
      }

      // Position popup ABOVE the button on desktop
      return {
        top: rect.top - popupHeight - gap,
        left: left,
        right: right,
      };
    }
  }, []);

  // Popup handlers with position calculation
  const handleOpenPalette = useCallback((buttonRef: React.RefObject<HTMLButtonElement | null>) => {
    const position = calculatePopupPosition(buttonRef, true, 280); // Style panel height
    setPalettePopupPosition(position);
    setShowStylePanel(true);
    setShowSettings(false);
  }, [calculatePopupPosition]);

  const handleOpenSettings = useCallback((buttonRef: React.RefObject<HTMLButtonElement | null>) => {
    const position = calculatePopupPosition(buttonRef, true, 250); // Settings panel is shorter
    setSettingsPopupPosition(position);
    setShowSettings(true);
    setShowStylePanel(false);
  }, [calculatePopupPosition]);

  const handleClosePopups = useCallback(() => {
    setShowStylePanel(false);
    setShowSettings(false);
    setPalettePopupPosition(null);
    setSettingsPopupPosition(null);
  }, []);

  // Load font dynamically when font family changes
  useEffect(() => {
    if (subtitleStyle.fontFamily) {
      loadFontCSS(subtitleStyle.fontFamily);
    }
  }, [subtitleStyle.fontFamily]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      if (!isSeeking) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setCurrentTime(video.currentTime);
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [videoRef, isSeeking]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          adjustVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          adjustVolume(-0.1);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [videoRef]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const skipBackward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  }, []);

  const skipForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
  }, []);

  const adjustVolume = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, video.volume + delta));
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    video.muted = newVolume === 0;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleProgressMouseDown = useCallback(() => {
    setIsSeeking(true);
  }, []);

  const handleProgressMouseUp = useCallback(() => {
    setIsSeeking(false);
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, []);

  const formatTime = useCallback((seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getProgress = useCallback(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  return (
    <>
    <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl overflow-hidden`}>
      {/* Video Player */}
      <div
        ref={containerRef}
        className="relative bg-black aspect-video shadow-lg select-none"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          crossOrigin="anonymous"
        />

        {/* Top Controls Overlay - Mobile Only */}
        <div className="absolute top-0 left-0 right-0 p-2 flex items-center justify-between sm:hidden">
          {/* Left: Remove & Fullscreen */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-red-600/70 transition-colors"
              title="Remove video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-zinc-700 transition-colors"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Settings & Palette */}
          <div className="flex items-center gap-1">
            <button
              ref={mobilePaletteButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPalette(mobilePaletteButtonRef);
              }}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-zinc-700 transition-colors"
              title="Subtitle Style"
            >
              <Palette className="w-4 h-4" />
            </button>

            <button
              ref={mobileSettingsButtonRef}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenSettings(mobileSettingsButtonRef);
              }}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-zinc-700 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Playback Controls - Mobile Only */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none sm:hidden">
          <div className="flex items-center gap-4 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                skipBackward();
              }}
              className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-zinc-700 transition-all active:scale-95"
              title="Skip backward 10s"
            >
              <Rewind className="w-5 h-5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="p-4 bg-black/70 backdrop-blur-sm rounded-full text-white hover:bg-zinc-700 transition-all active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                skipForward();
              }}
              className="p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-zinc-700 transition-all active:scale-95"
              title="Skip forward 10s"
            >
              <FastForward className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subtitle Overlay */}
        {currentSubtitle && (
          <div className="absolute bottom-16 left-4 right-4 flex justify-center pointer-events-none sm:bottom-8">
            <div
              className="text-center font-medium px-4 py-2 rounded shadow-lg"
              style={{
                backgroundColor: subtitleStyle.backgroundColor + Math.round(subtitleStyle.bgOpacity * 255).toString(16).padStart(2, '0'),
                color: subtitleStyle.textColor,
                fontFamily: subtitleStyle.fontFamily,
                fontSize: `${subtitleStyle.fontSize}px`,
                lineHeight: '1.5',
              }}
            >
              {currentSubtitle}
            </div>
          </div>
        )}

        {/* Center Play Button Overlay - Desktop Only */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none hidden sm:flex">
            <div className="bg-black/70 rounded-full p-6 backdrop-blur-sm">
              <Play className="w-16 h-16 text-white" fill="white" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={`p-2 ${isDark ? 'bg-zinc-900 border-t border-zinc-800' : 'bg-white border-t border-zinc-200'}`}>
        {/* Progress Bar */}
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono tabular-nums w-10 text-right ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative h-1.5 cursor-pointer group">
              <div className={`absolute inset-0 h-1.5 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
              <div
                className="absolute h-1.5 bg-indigo-500 rounded-full transition-all duration-75"
                style={{ width: `${getProgress()}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg"
                style={{ left: `${getProgress()}%` }}
              />
              <input
                ref={progressRef}
                type="range"
                min="0"
                max="100"
                value={getProgress()}
                onChange={handleProgressChange}
                onMouseDown={handleProgressMouseDown}
                onMouseUp={handleProgressMouseUp}
                onTouchStart={handleProgressMouseDown}
                onTouchEnd={handleProgressMouseUp}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <span className={`text-xs font-mono tabular-nums w-10 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Left Column: Playback Controls (Desktop Only) */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={skipBackward}
              className={`p-1.5 transition-transform active:scale-95 rounded ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
              }`}
              title="Skip backward 10s"
            >
              <Rewind className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className={`p-1.5 transition-transform active:scale-95 rounded ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            <button
              onClick={skipForward}
              className={`p-1.5 transition-transform active:scale-95 rounded ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
              }`}
              title="Skip forward 10s"
            >
              <FastForward className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={toggleMute}
                className={`p-1.5 transition-transform active:scale-95 rounded ${
                  isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
                }`}
                title="Mute"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="w-16 relative">
                <div className={`relative h-1 rounded-full cursor-pointer ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
                  <div
                    className={`absolute h-1 rounded-full transition-all duration-75 ${isDark ? 'bg-white' : 'bg-zinc-900'}`}
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Volume Only */}
          <div className="flex sm:hidden items-center gap-1 justify-center">
            <button
              onClick={toggleMute}
              className={`p-1.5 transition-transform active:scale-95 rounded ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
              }`}
              title="Mute"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <div className="w-24 relative">
              <div className={`relative h-1 rounded-full cursor-pointer ${isDark ? 'bg-zinc-700' : 'bg-zinc-200'}`}>
                <div
                  className={`absolute h-1 rounded-full transition-all duration-75 ${isDark ? 'bg-white' : 'bg-zinc-900'}`}
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Settings Controls (Desktop Only) */}
          <div className="hidden sm:flex items-center gap-1">
            {/* Subtitle Style Button */}
            <button
              ref={desktopPaletteButtonRef}
              onClick={() => handleOpenPalette(desktopPaletteButtonRef)}
              className={`p-1.5 transition-transform active:scale-95 rounded ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
              }`}
              title="Subtitle Style"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              ref={desktopSettingsButtonRef}
              onClick={() => handleOpenSettings(desktopSettingsButtonRef)}
              className={`p-1.5 transition-transform active:scale-95 rounded ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Remove Button */}
            <button
              onClick={onRemove}
              className={`p-1.5 transition-transform active:scale-95 rounded ${
                isDark
                  ? 'hover:bg-red-600/20 text-zinc-400 hover:text-red-400'
                  : 'hover:bg-red-50 text-zinc-600 hover:text-red-600'
              }`}
              title="Remove video"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className={`p-1.5 transition-transform active:scale-95 rounded ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'
              }`}
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Portal-rendered popups to avoid clipping */}
    {typeof document !== 'undefined' && createPortal(
      <>
        {/* Backdrop */}
        {(showStylePanel || showSettings) && (
          <div
            className="fixed inset-0 z-40"
            onClick={handleClosePopups}
          />
        )}

        {/* Subtitle Style Popup */}
        {showStylePanel && palettePopupPosition && (
          <div
            className={`fixed rounded-lg shadow-2xl z-50 w-48 ${
              isDark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'
            }`}
            style={{
              top: `${palettePopupPosition.top}px`,
              left: palettePopupPosition.left ? `${palettePopupPosition.left}px` : 'auto',
              right: palettePopupPosition.right ? `${palettePopupPosition.right}px` : 'auto',
            }}
          >
            <div className="p-2">
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 px-2 ${textSecondary}`}>
                Subtitle Style
              </div>

              {/* Font Family Selector */}
              <div className="mb-2">
                <select
                  value={subtitleStyle.fontFamily}
                  onChange={(e) => updateSubtitleStyle({ fontFamily: e.target.value })}
                  className={`w-full text-xs rounded-lg px-2 py-1.5 outline-none appearance-none cursor-pointer ${
                    isDark
                      ? 'bg-zinc-800 border border-zinc-700 text-white'
                      : 'bg-zinc-50 border border-zinc-200 text-zinc-900'
                  }`}
                  style={{ fontFamily: subtitleStyle.fontFamily }}
                  disabled={fontsLoading}
                >
                  {fontsLoading ? (
                    <option>Loading fonts...</option>
                  ) : (
                    googleFonts.map((font) => (
                      <option key={font} value={font}>
                        {font}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Font Size Slider */}
              <div className="mb-2 px-3 py-1.5">
                <div className={`flex justify-between text-xs mb-1 ${textSecondary}`}>
                  <span>Font Size</span>
                  <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{subtitleStyle.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="48"
                  step="1"
                  value={subtitleStyle.fontSize}
                  onChange={(e) => updateSubtitleStyle({ fontSize: parseInt(e.target.value) })}
                  className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Color Pickers */}
              <div className="mt-2 space-y-1">
                <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-50 text-zinc-700'
                }`}>
                  <span>Text Color</span>
                  <input
                    type="color"
                    value={subtitleStyle.textColor}
                    onChange={(e) => updateSubtitleStyle({ textColor: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                </div>
                <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-50 text-zinc-700'
                }`}>
                  <span>Background</span>
                  <input
                    type="color"
                    value={subtitleStyle.backgroundColor}
                    onChange={(e) => updateSubtitleStyle({ backgroundColor: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-none p-0"
                  />
                </div>
              </div>

              {/* Opacity Slider */}
              <div className="mt-2 px-3 py-1.5">
                <div className={`flex justify-between text-xs mb-1 ${textSecondary}`}>
                  <span>Opacity</span>
                  <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{Math.round(subtitleStyle.bgOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={subtitleStyle.bgOpacity}
                  onChange={(e) => updateSubtitleStyle({ bgOpacity: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Settings Popup */}
        {showSettings && settingsPopupPosition && (
          <div
            className={`fixed rounded-lg shadow-2xl z-50 w-48 ${
              isDark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'
            }`}
            style={{
              top: `${settingsPopupPosition.top}px`,
              left: settingsPopupPosition.left ? `${settingsPopupPosition.left}px` : 'auto',
              right: settingsPopupPosition.right ? `${settingsPopupPosition.right}px` : 'auto',
            }}
          >
            <div className="p-2">
              <div className={`text-xs font-semibold uppercase tracking-wider mb-2 px-2 ${textSecondary}`}>
                Playback Speed
              </div>
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={`w-full text-left px-3 py-2 rounded transition-colors text-sm flex items-center gap-2 ${
                    playbackRate === rate
                      ? 'bg-indigo-600 text-white'
                      : isDark
                        ? 'text-zinc-300 hover:bg-zinc-800'
                        : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <span className="flex-1">{rate}x</span>
                  {playbackRate === rate && <Type className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </>,
      document.body
    )}
    </>
  );
};
