import React, { useState, useRef, useCallback } from 'react';
import { SubtitleSegment } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import { useSubtitles } from '@/hooks/useSubtitles';
import { generateSRTContent } from '@/lib/utils';
import { Header } from '@/components/Header';
import { MenuSheet } from '@/components/MenuSheet';
import { UploadZone, handleFileValidation } from '@/components/UploadZone';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Transcript } from '@/components/Transcript';
import { StatusMessages } from '@/components/StatusMessages';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedLangCode, setSelectedLangCode] = useState<string>('en');
  const [subtitles, setSubtitles] = useState<SubtitleSegment[] | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isTranslationMode, setIsTranslationMode] = useState(true);
  const srtInputRef = useRef<HTMLInputElement>(null);

  const { isDark, toggleTheme } = useTheme();
  const { apiKey, setApiKey, isProcessing, error, setError, processVideo } = useVideoProcessing();
  const { videoRef, currentSubtitle, seekTo } = useSubtitles(subtitles);

  // Initialize settings on mount
  React.useEffect(() => {
    if (!apiKey) {
      setShowMenu(true);
    }
  }, []);

  // Scroll to transcript section on mobile when video is loaded
  React.useEffect(() => {
    if (videoUrl && window.innerWidth < 1024) {
      // Small delay to ensure the layout has updated
      setTimeout(() => {
        const transcriptSection = document.querySelector('[data-transcript-section]');
        if (transcriptSection) {
          transcriptSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [videoUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validation = handleFileValidation(selectedFile);

      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      setFile(selectedFile);
      setVideoUrl(URL.createObjectURL(selectedFile));
      setSubtitles(null);
      setError(null);
    }
  };

  const handleProcess = useCallback(async (enableTranslation: boolean = true) => {
    if (!file) return;

    setIsTranslationMode(enableTranslation);

    try {
      const result = await processVideo(file, selectedLangCode, enableTranslation);
      setSubtitles(result);
    } catch {
      // Error is already handled in the hook
    }
  }, [file, selectedLangCode, processVideo]);

  const handleProcessSameLanguage = useCallback(() => handleProcess(false), [handleProcess]);
  const handleProcessTranslated = useCallback(() => handleProcess(true), [handleProcess]);

  const downloadSRT = () => {
    if (!subtitles) return;
    const content = generateSRTContent(subtitles);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${selectedLangCode}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRemoveVideo = () => {
    setFile(null);
    setVideoUrl(null);
    setSubtitles(null);
  };

  const handleSRTUpload = (uploadedSubtitles: SubtitleSegment[] | null) => {
    setSubtitles(uploadedSubtitles);
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (key) setShowMenu(false);
  };

  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className={`min-h-screen flex flex-col items-center p-6 md:p-8 w-full`}>
      <Header isDark={isDark} onMenuClick={() => setShowMenu(true)} onThemeToggle={toggleTheme} />

      {/* Main Content Area */}
      {!videoUrl ? (
        <>
          {/* Hero Text */}
          <div className="text-center max-w-4xl mx-auto mb-12 space-y-6">
            <h2 className={`text-5xl md:text-6xl font-extrabold tracking-tight ${textPrimary}`}>
              Subtitles that speak your language
            </h2>
            <p className={`text-xl ${textSecondary} max-w-2xl mx-auto leading-relaxed`}>
              Generate accurate same-language subtitles or translate to any language. Powered by Gemini AI,
              delivering perfectly timed captions in seconds.
            </p>
          </div>

          {/* Upload Zone */}
          <div className="w-full max-w-4xl">
            <UploadZone isDark={isDark} onFileChange={handleFileChange} />
          </div>
        </>
      ) : (
        <div className="w-full max-w-7xl">
          {/* Two Column Layout: Video Player + Transcript */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player Column (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              <VideoPlayer
                videoRef={videoRef}
                videoUrl={videoUrl}
                currentSubtitle={currentSubtitle}
                selectedLangCode={selectedLangCode}
                isDark={isDark}
                subtitles={subtitles}
                isProcessing={isProcessing}
                onRemove={handleRemoveVideo}
              />
              <StatusMessages
                isProcessing={isProcessing}
                error={error}
                selectedLangCode={selectedLangCode}
                isDark={isDark}
                isTranslationMode={isTranslationMode}
              />

              {/* Hero Text Below Video */}
              <div className="space-y-3">
                <h3 className={`text-2xl font-bold tracking-tight ${textPrimary}`}>
                  Subtitles that speak your language
                </h3>
                <p className={`text-base ${textSecondary} leading-relaxed`}>
                  Generate accurate same-language subtitles or translate to any language. Powered by Gemini AI,
                  delivering perfectly timed captions in seconds.
                </p>
              </div>
            </div>

            {/* Transcript Panel (1/3 width) - Sticky */}
            <div className="lg:col-span-1" data-transcript-section>
              <Transcript
                subtitles={subtitles}
                selectedLangCode={selectedLangCode}
                isDark={isDark}
                isProcessing={isProcessing}
                onSeekTo={seekTo}
                onDownloadSRT={downloadSRT}
                onProcessSameLanguage={handleProcessSameLanguage}
                onProcessTranslated={handleProcessTranslated}
                onSRTUpload={handleSRTUpload}
                onLanguageChange={setSelectedLangCode}
                srtInputRef={srtInputRef}
              />
            </div>
          </div>
        </div>
      )}

      {/* Menu Sheet */}
      <MenuSheet
        isOpen={showMenu}
        apiKey={apiKey}
        isDark={isDark}
        onApiKeyChange={setApiKey}
        onSave={() => handleSaveApiKey(apiKey)}
        onClose={() => setShowMenu(false)}
      />
    </div>
  );
}
