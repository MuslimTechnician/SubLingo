import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileVideo,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  Gauge,
  Subtitles,
  Type,
  Palette,
  X,
  Rewind,
  FastForward,
  Upload,
  Trash2,
  Check,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { parseSRTFile } from '@/lib/utils';
import { SubtitleSegment, SubtitleStyle } from '@/types';
import { useSubtitleStyles } from '@/hooks/useSubtitleStyles';
import { useGoogleFonts, loadFontCSS } from '@/hooks/useGoogleFonts';

interface VideoPlayerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoUrl: string;
  currentSubtitle: string;
  selectedLangCode: string;
  isDark: boolean;
  subtitles: SubtitleSegment[] | null;
  isProcessing: boolean;
  onLanguageChange: (code: string) => void;
  onProcessSameLanguage: () => void;
  onProcessTranslated: () => void;
  onRemove: () => void;
  onSRTUpload: (subtitles: SubtitleSegment[] | null) => void;
}

export const VideoPlayer = ({
  videoRef,
  videoUrl,
  currentSubtitle,
  selectedLangCode,
  isDark,
  subtitles,
  isProcessing,
  onLanguageChange,
  onProcessSameLanguage,
  onProcessTranslated,
  onRemove,
  onSRTUpload,
}: VideoPlayerProps) => {
  const { fonts: googleFonts, isLoading: fontsLoading } = useGoogleFonts();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCCMenu, setShowCCMenu] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const { style: subtitleStyle, updateStyle: updateSubtitleStyle } = useSubtitleStyles();
  const srtInputRef = useRef<HTMLInputElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const cardClass = isDark
    ? 'bg-zinc-900/50 border-zinc-800'
    : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-500';
  const accentText = 'text-indigo-500';

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (!isPlaying) return;

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
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
      resetControlsTimeout();
    };

    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
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
  }, [videoRef, isSeeking, resetControlsTimeout]);

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

  const handleSRTFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const parsedSubtitles = parseSRTFile(content);
        if (parsedSubtitles.length > 0) {
          onSRTUpload(parsedSubtitles);
          setShowCCMenu(false);
        } else {
          alert('No valid subtitles found in the SRT file.');
        }
      } catch (error) {
        console.error('Error parsing SRT file:', error);
        alert('Error parsing SRT file. Please make sure it\'s a valid .srt file.');
      }
    };
    reader.readAsText(file);

    if (srtInputRef.current) {
      srtInputRef.current.value = '';
    }
  }, [onSRTUpload]);

  const handleClearSubtitles = useCallback(() => {
    onSRTUpload(null);
    setShowCCMenu(false);
  }, [onSRTUpload]);

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
    <div className={`${cardClass} border rounded-3xl p-6 backdrop-blur-sm transition-colors`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${textPrimary}`}>
          <FileVideo className={`w-5 h-5 ${accentText}`} />
          Media Source
        </h2>
        <button
          onClick={onRemove}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isDark
              ? 'bg-zinc-800 text-zinc-400 hover:bg-red-600/20 hover:text-red-400 border border-zinc-700'
              : 'bg-zinc-100 text-zinc-600 hover:bg-red-50 hover:text-red-600 border border-zinc-200'
          }`}
          title="Remove video and subtitles"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </button>
      </div>

      <div className="space-y-4">
        {/* Video Player */}
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-lg select-none"
          onMouseEnter={() => {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
          }}
          onMouseLeave={() => {
            if (isPlaying) setShowControls(false);
          }}
          onMouseMove={() => {
            setShowControls(true);
            resetControlsTimeout();
          }}
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            crossOrigin="anonymous"
          />

          {/* Subtitle Overlay */}
          {currentSubtitle && (
            <div className="absolute bottom-20 left-4 right-4 flex justify-center pointer-events-none">
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

          {/* Center Play Button Overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/70 rounded-full p-6 backdrop-blur-sm">
                <Play className="w-16 h-16 text-white" fill="white" />
              </div>
            </div>
          )}

          {/* Controls Container */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-3 pt-8 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress Bar with Time */}
            <div className="mb-3">
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-mono tabular-nums w-12 text-right">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 relative h-1.5 cursor-pointer group">
                  {/* Background track */}
                  <div className="absolute inset-0 h-1.5 bg-indigo-500/30 rounded-full" />
                  {/* Progress fill */}
                  <div
                    className="absolute h-1.5 bg-indigo-500 rounded-full transition-all duration-75"
                    style={{ width: `${getProgress()}%` }}
                  />
                  {/* Seek handle (visible on hover) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `${getProgress()}%` }}
                  />
                  {/* Input for seeking */}
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
                <span className="text-white text-sm font-mono tabular-nums w-12">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Control Bar */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-1">
                {/* Skip Backward */}
                <button
                  onClick={skipBackward}
                  className="text-white p-1.5 transition-transform active:scale-95"
                  title="Skip backward 10s"
                >
                  <Rewind className="w-5 h-5" />
                </button>

                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="text-white p-1.5 transition-transform active:scale-95"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                {/* Skip Forward */}
                <button
                  onClick={skipForward}
                  className="text-white p-1.5 transition-transform active:scale-95"
                  title="Skip forward 10s"
                >
                  <FastForward className="w-5 h-5" />
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={toggleMute}
                    className="text-white p-1.5 transition-transform active:scale-95"
                    title="Mute"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <div className="w-20 relative">
                    <div className="relative h-1 bg-white/30 rounded-full cursor-pointer">
                      <div
                        className="absolute h-1 bg-white rounded-full transition-all duration-75"
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

              {/* Right Controls */}
              <div className="flex items-center gap-1">
                {/* Subtitle Style Button (Palette) */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowStylePanel(!showStylePanel);
                      setShowCCMenu(false);
                      setShowSettings(false);
                    }}
                    className="p-1.5 transition-transform active:scale-95 text-white"
                    title="Subtitle Style"
                  >
                    <Palette className="w-5 h-5" />
                  </button>
                </div>

                {/* CC/Subtitles Button */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowCCMenu(!showCCMenu);
                      setShowSettings(false);
                    }}
                    className="p-1.5 transition-transform active:scale-95 text-white"
                    title="Subtitles"
                  >
                    <Subtitles className="w-5 h-5" />
                  </button>

                  {/* CC Menu */}
                  {showCCMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowCCMenu(false)}
                      />
                      <div
                        className={`absolute bottom-full right-0 mb-2 rounded-lg shadow-2xl z-20 w-48 ${
                          isDark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'
                        }`}
                      >
                        <div className="p-2 flex flex-col gap-2">
                          <input
                            ref={srtInputRef}
                            type="file"
                            accept=".srt"
                            onChange={handleSRTFileUpload}
                            className="hidden"
                          />
                          <button
                            onClick={() => srtInputRef.current?.click()}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium w-full ${
                              isDark
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                            }`}
                          >
                            <Upload className="w-4 h-4" />
                            Import Subtitle
                          </button>
                          {subtitles && (
                            <button
                              onClick={handleClearSubtitles}
                              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors text-sm font-medium w-full ${
                                isDark
                                  ? 'bg-zinc-800 hover:bg-red-600/20 text-zinc-300 hover:text-red-400 border border-zinc-700'
                                  : 'bg-zinc-100 hover:bg-red-50 text-zinc-700 hover:text-red-600 border border-zinc-200'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                              Clear Subtitle
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Subtitle Style Panel */}
                {showStylePanel && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowStylePanel(false)}
                    />
                    <div
                      className={`absolute bottom-12 right-0 z-30 w-72 rounded-xl shadow-2xl backdrop-blur-xl ${
                        isDark
                          ? 'bg-zinc-900/95 border border-zinc-700'
                          : 'bg-white/95 border border-zinc-200'
                      }`}
                    >
                      {/* Header */}
                      <div className={`flex items-center justify-between px-4 pt-4 pb-3 border-b ${isDark ? 'border-zinc-700/50' : 'border-zinc-200/50'}`}>
                        <h4 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                          <Type className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                          Subtitle Style
                        </h4>
                        <button
                          onClick={() => setShowStylePanel(false)}
                          className={isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Scrollable Content */}
                      <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto">
                        {/* 1. Google Font Selector */}
                        <div className="space-y-1">
                          <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Font Family</label>
                          <select
                            value={subtitleStyle.fontFamily}
                            onChange={(e) => updateSubtitleStyle({ fontFamily: e.target.value })}
                            className={`w-full text-xs rounded-lg px-3 py-2 outline-none appearance-none cursor-pointer ${
                              isDark
                                ? 'bg-zinc-800 border border-zinc-700 text-white'
                                : 'bg-white border border-zinc-200 text-zinc-900'
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

                        {/* 2. Color Pickers (Text & Background) */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              Text
                            </label>
                            <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
                              <input
                                type="color"
                                value={subtitleStyle.textColor}
                                onChange={(e) => updateSubtitleStyle({ textColor: e.target.value })}
                                className="w-5 h-5 rounded cursor-pointer bg-transparent border-none p-0"
                              />
                              <span className={`text-[10px] font-mono flex-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{subtitleStyle.textColor}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              Background
                            </label>
                            <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-50 border-zinc-200'}`}>
                              <input
                                type="color"
                                value={subtitleStyle.backgroundColor}
                                onChange={(e) => updateSubtitleStyle({ backgroundColor: e.target.value })}
                                className="w-5 h-5 rounded cursor-pointer bg-transparent border-none p-0"
                              />
                              <span className={`text-[10px] font-mono flex-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>{subtitleStyle.backgroundColor}</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Interactive Sliders */}
                        <div className="space-y-2">
                          {/* Font Size */}
                          <div className="space-y-1">
                            <div className={`flex justify-between text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              <span>Font Size</span>
                              <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{subtitleStyle.fontSize}px</span>
                            </div>
                            <input
                              type="range"
                              min="12"
                              max="72"
                              value={subtitleStyle.fontSize}
                              onChange={(e) => updateSubtitleStyle({ fontSize: parseInt(e.target.value) })}
                              className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>

                          {/* Background Opacity */}
                          <div className="space-y-1">
                            <div className={`flex justify-between text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                              <span>Opacity</span>
                              <span className={isDark ? 'text-zinc-300' : 'text-zinc-700'}>{Math.round(subtitleStyle.bgOpacity * 100)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={subtitleStyle.bgOpacity}
                              onChange={(e) => updateSubtitleStyle({ bgOpacity: parseFloat(e.target.value) })}
                              className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Settings Button */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSettings(!showSettings);
                      setShowCCMenu(false);
                    }}
                    className="text-white p-1.5 transition-transform active:scale-95"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>

                  {/* Settings Menu */}
                  {showSettings && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowSettings(false)}
                      />
                      <div
                        className={`absolute bottom-full right-0 mb-2 rounded-lg shadow-2xl z-20 w-48 ${
                          isDark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'
                        }`}
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
                    </>
                  )}
                </div>

                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="text-white p-1.5 transition-transform active:scale-95"
                  title="Fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Help - Show only when video is loaded */}
        {videoUrl && !subtitles && !isProcessing && (
          <div
            className={`text-xs ${textSecondary} text-center p-3 rounded-xl ${isDark ? 'bg-zinc-900/30' : 'bg-zinc-50'}`}
          >
            <span className="font-medium">Shortcuts:</span> Space/K (play) • ←/→ (seek 5s) • ↑/↓ (volume) • F (fullscreen)
          </div>
        )}

        {/* Controls Area */}
        {!subtitles && !isProcessing && (
          <div
            className={`rounded-2xl p-5 border ${isDark ? 'bg-zinc-900/40 border-zinc-700/50' : 'bg-zinc-50 border-zinc-200'}`}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              {/* LEFT: Same Language Subtitles Button */}
              <div className="flex items-end">
                <button
                  onClick={onProcessSameLanguage}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 h-[50px]"
                >
                  <Gauge className="w-4 h-4" />
                  Same Language Subtitles
                </button>
              </div>

              {/* MIDDLE: Language Selector */}
              <div className="flex-1">
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Target Language</label>
                <div className="relative">
                  <select
                    value={selectedLangCode}
                    onChange={(e) => onLanguageChange(e.target.value)}
                    className={`w-full text-base rounded-xl block p-3 appearance-none cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      isDark
                        ? 'bg-zinc-900 border border-zinc-700 text-white focus:border-indigo-500'
                        : 'bg-white border border-zinc-200 text-zinc-900 focus:border-indigo-500'
                    }`}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                  <ChevronRight
                    className={`absolute right-4 top-4 w-5 h-5 ${textSecondary} pointer-events-none rotate-90`}
                  />
                </div>
              </div>

              {/* RIGHT: Translated Subtitles Button */}
              <div className="flex items-end">
                <button
                  onClick={onProcessTranslated}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 h-[50px]"
                >
                  <Gauge className="w-4 h-4" />
                  Translated Subtitles
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
