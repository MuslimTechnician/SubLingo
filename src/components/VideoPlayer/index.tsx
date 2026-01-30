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
  Plus,
  Minus,
  Type,
  Rewind,
  FastForward,
  Upload,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { parseSRTFile } from '@/lib/utils';
import { SubtitleSegment } from '@/types';

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [subtitleSize, setSubtitleSize] = useState<1 | 2 | 3>(2);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showCCMenu, setShowCCMenu] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
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

  const changeSubtitleSize = useCallback((delta: number) => {
    setSubtitleSize((prev) => {
      const newSize = prev + delta;
      if (newSize < 1) return 1;
      if (newSize > 3) return 3;
      return newSize as 1 | 2 | 3;
    });
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
        {!subtitles && !isProcessing && (
          <button onClick={onRemove} className={`text-xs ${textSecondary} hover:text-red-500 transition-colors`}>
            Remove
          </button>
        )}
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
                className="bg-black/80 text-white text-center font-medium px-4 py-2 rounded shadow-lg"
                style={{
                  fontSize: subtitleSize === 1 ? '1rem' : subtitleSize === 2 ? '1.125rem' : '1.375rem',
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
                        className={`absolute bottom-full right-0 mb-2 rounded-lg shadow-2xl z-20 w-72 ${
                          isDark ? 'bg-zinc-900 border border-zinc-700' : 'bg-white border border-zinc-200'
                        }`}
                      >
                        <div className="p-3">
                          <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${textSecondary}`}>
                            Subtitles
                          </div>

                          {/* Subtitle Size */}
                          <div className="mb-4">
                            <div className={`text-xs font-medium mb-2 ${textPrimary}`}>Size</div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => changeSubtitleSize(-1)}
                                className={`p-1.5 rounded transition-colors ${
                                  isDark
                                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                                }`}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <div className={`text-sm flex-1 text-center ${textPrimary}`}>
                                {subtitleSize === 1 ? 'Small' : subtitleSize === 2 ? 'Medium' : 'Large'}
                              </div>
                              <button
                                onClick={() => changeSubtitleSize(1)}
                                className={`p-1.5 rounded transition-colors ${
                                  isDark
                                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Import SRT */}
                          <div className="mb-3">
                            <div className={`text-xs font-medium mb-2 ${textPrimary}`}>Import</div>
                            <input
                              ref={srtInputRef}
                              type="file"
                              accept=".srt"
                              onChange={handleSRTFileUpload}
                              className="hidden"
                            />
                            <button
                              onClick={() => srtInputRef.current?.click()}
                              className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg transition-colors ${
                                isDark
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                              }`}
                            >
                              <Upload className="w-4 h-4" />
                              <span className="text-sm font-medium">Upload SRT File</span>
                            </button>
                          </div>

                          {/* Clear Subtitles */}
                          {subtitles && (
                            <button
                              onClick={handleClearSubtitles}
                              className={`w-full p-2.5 rounded-lg transition-colors text-sm ${
                                isDark
                                  ? 'bg-zinc-800 hover:bg-red-600/20 text-zinc-300 hover:text-red-400'
                                  : 'bg-zinc-100 hover:bg-red-50 text-zinc-700 hover:text-red-600'
                              }`}
                            >
                              Clear Subtitles
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

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
