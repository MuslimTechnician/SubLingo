import React, { useState } from 'react';
import { SubtitleSegment } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { useVideoProcessing } from '@/hooks/useVideoProcessing';
import { useSubtitles } from '@/hooks/useSubtitles';
import { generateSRTContent } from '@/lib/utils';
import { Header } from '@/components/Header';
import { SettingsModal } from '@/components/SettingsModal';
import { UploadZone, handleFileValidation } from '@/components/UploadZone';
import { VideoPlayer } from '@/components/VideoPlayer';
import { Transcript } from '@/components/Transcript';
import { StatusMessages } from '@/components/StatusMessages';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedLangCode, setSelectedLangCode] = useState<string>('en');
  const [subtitles, setSubtitles] = useState<SubtitleSegment[] | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isTranslationMode, setIsTranslationMode] = useState(true);

  const { isDark, toggleTheme } = useTheme();
  const { apiKey, setApiKey, isProcessing, error, setError, processVideo } = useVideoProcessing();
  const { videoRef, currentSubtitle, seekTo } = useSubtitles(subtitles);

  // Initialize settings on mount
  React.useEffect(() => {
    if (!apiKey) {
      setShowSettings(true);
    }
  }, []);

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

  const handleProcess = async (enableTranslation: boolean = true) => {
    if (!file) return;

    setIsTranslationMode(enableTranslation);

    try {
      const result = await processVideo(file, selectedLangCode, enableTranslation);
      setSubtitles(result);
    } catch {
      // Error is already handled in the hook
    }
  };

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
    if (key) setShowSettings(false);
  };

  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className={`min-h-screen flex flex-col items-center p-6 md:p-8 w-full`}>
      <Header isDark={isDark} onSettingsClick={() => setShowSettings(true)} onThemeToggle={toggleTheme} />

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

      {/* Main Layout */}
      <div className="w-full max-w-4xl transition-all duration-500 ease-in-out">
        {/* Video Player & Upload */}
        <div className="space-y-6">
          {!videoUrl ? (
            <UploadZone isDark={isDark} onFileChange={handleFileChange} />
          ) : (
            <VideoPlayer
              videoRef={videoRef}
              videoUrl={videoUrl}
              currentSubtitle={currentSubtitle}
              selectedLangCode={selectedLangCode}
              isDark={isDark}
              subtitles={subtitles}
              isProcessing={isProcessing}
              onLanguageChange={setSelectedLangCode}
              onProcessSameLanguage={() => handleProcess(false)}
              onProcessTranslated={() => handleProcess(true)}
              onRemove={handleRemoveVideo}
              onSRTUpload={handleSRTUpload}
            />
          )}

          {/* Status Messages */}
          <StatusMessages
            isProcessing={isProcessing}
            error={error}
            selectedLangCode={selectedLangCode}
            isDark={isDark}
            isTranslationMode={isTranslationMode}
          />
        </div>

        {/* Transcript (Shows below video when generated) */}
        {subtitles && (
          <div className="mt-6">
            <Transcript
              subtitles={subtitles}
              selectedLangCode={selectedLangCode}
              isDark={isDark}
              onSeekTo={seekTo}
              onDownloadSRT={downloadSRT}
            />
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        apiKey={apiKey}
        isDark={isDark}
        onApiKeyChange={setApiKey}
        onSave={() => handleSaveApiKey(apiKey)}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
