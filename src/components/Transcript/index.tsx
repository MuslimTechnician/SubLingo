import { Download, Play, CheckCircle2, Gauge, Upload, Trash2, Loader2 } from 'lucide-react';
import { SubtitleSegment } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { ProcessingStage } from '@/hooks/useVideoProcessing';

interface TranscriptProps {
  subtitles: SubtitleSegment[] | null;
  selectedLangCode: string;
  isDark: boolean;
  isProcessing: boolean;
  processingStage: ProcessingStage;
  isTranslationMode?: boolean;
  onSeekTo: (timestamp: string) => void;
  onDownloadSRT: () => void;
  onClearTranscript?: () => void;
  onProcessSameLanguage?: () => void;
  onProcessTranslated?: () => void;
  onSRTUpload?: (subtitles: SubtitleSegment[] | null) => void;
  onLanguageChange?: (code: string) => void;
  srtInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const Transcript = ({
  subtitles,
  selectedLangCode,
  isDark,
  isProcessing,
  processingStage,
  isTranslationMode = false,
  onSeekTo,
  onDownloadSRT,
  onClearTranscript,
  onProcessSameLanguage,
  onProcessTranslated,
  onSRTUpload,
  onLanguageChange,
  srtInputRef,
}: TranscriptProps) => {
  const cardClass = isDark
    ? 'bg-zinc-900/50 border-zinc-800'
    : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-500';

  // Show AI generation options when no subtitles
  if (!subtitles) {
    return (
      <div className={`border rounded-3xl p-6 ${cardClass}`}>
        <h3 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Generate Subtitles</h3>

        <div className="space-y-4">
          {/* Same Language Button */}
          {onProcessSameLanguage && (
            <button
              onClick={onProcessSameLanguage}
              disabled={isProcessing}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <Gauge className="w-4 h-4" />
              Same Language
            </button>
          )}

          {/* Translate Button */}
          {onProcessTranslated && onLanguageChange && (
            <div className="space-y-2">
              <select
                value={selectedLangCode}
                onChange={(e) => onLanguageChange(e.target.value)}
                className={`w-full text-sm rounded-lg px-3 py-2 outline-none ${
                  isDark
                    ? 'bg-zinc-800 border border-zinc-700 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-900'
                }`}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <button
                onClick={onProcessTranslated}
                disabled={isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <Gauge className="w-4 h-4" />
                Translate to {SUPPORTED_LANGUAGES.find(l => l.code === selectedLangCode)?.name}
              </button>
            </div>
          )}

          {/* Or Divider */}
          {(onProcessSameLanguage || onProcessTranslated) && onSRTUpload && (
            <div className={`relative py-2 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <div className={`absolute inset-0 flex items-center ${isDark ? 'text-zinc-800' : 'text-zinc-200'}`}>
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className={`px-2 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>Or</span>
              </div>
            </div>
          )}

          {/* Upload SRT */}
          {onSRTUpload && srtInputRef && (
            <button
              onClick={() => srtInputRef.current?.click()}
              className="w-full border-2 border-dashed rounded-xl px-4 py-6 flex flex-col items-center gap-2 transition-all hover:bg-zinc-800/50"
            >
              <Upload className={`w-6 h-6 ${textSecondary}`} />
              <span className={`text-sm font-medium ${textSecondary}`}>Upload SRT File</span>
              <input
                ref={srtInputRef}
                type="file"
                accept=".srt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      const segments = parseSRT(content);
                      onSRTUpload(segments);
                    };
                    reader.readAsText(file);
                  }
                }}
                className="hidden"
              />
            </button>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className={`text-center text-sm ${textSecondary} flex items-center justify-center gap-2`}>
              <Loader2 className="w-4 h-4 animate-spin" />
              {processingStage === 'extracting_audio' && 'Extracting audio from video...'}
              {processingStage === 'processing_ai' && 'Processing with AI... This may take a few minutes.'}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border rounded-3xl flex flex-col shadow-xl backdrop-blur-sm overflow-hidden sticky top-6 ${cardClass}`}
    >
      <div
        className={`p-5 border-b backdrop-blur-md sticky top-0 z-10 flex justify-between items-center ${
          isDark ? 'border-zinc-800 bg-zinc-900/80' : 'border-zinc-100 bg-white/80'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <h2 className={`text-lg font-semibold ${textPrimary}`}>Transcript</h2>
        </div>
        <div className="flex items-center gap-2">
          {onClearTranscript && (
            <button
              onClick={onClearTranscript}
              className={`p-2 rounded-lg border transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${
                isDark
                  ? 'bg-zinc-800 hover:bg-red-600/20 border-zinc-700 text-zinc-400 hover:text-red-400'
                  : 'bg-white hover:bg-red-50 border-zinc-200 text-zinc-600 hover:text-red-600 shadow-sm'
              }`}
              title="Clear transcript"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDownloadSRT}
            className={`p-2 rounded-lg border transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 shadow-sm'
            }`}
            title="Download .SRT"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-0 scroll-smooth max-h-[calc(100vh-200px)]">
        <div className={`divide-y ${isDark ? 'divide-zinc-800/50' : 'divide-zinc-100'}`}>
          {subtitles.map((sub, idx) => {
            const hasOriginalText = sub.originalText !== sub.text;

            return (
              <div
                key={idx}
                className={`p-5 transition-colors group ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'}`}
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <span
                    className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
                      isDark
                        ? 'text-zinc-500 bg-zinc-800'
                        : 'text-zinc-500 bg-zinc-100'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => onSeekTo(sub.startTime)}
                    className={`text-xs font-mono px-2 py-1 rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isDark
                        ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20'
                        : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    {sub.startTime}
                  </button>
                </div>
                <div
                  className={`space-y-3 pl-3 border-l-2 transition-colors ${
                    isDark ? 'border-zinc-800 group-hover:border-indigo-500/30' : 'border-zinc-200 group-hover:border-indigo-300'
                  }`}
                >
                  {/* Only show Original section if it's different from translated text */}
                  {hasOriginalText && (
                    <div>
                      <p className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${textSecondary}`}>
                        Original
                      </p>
                      <p className={`text-sm leading-relaxed italic ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {sub.originalText}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className={`text-[10px] uppercase tracking-wider mb-1 font-semibold text-emerald-500`}>
                      {hasOriginalText && isTranslationMode
                        ? SUPPORTED_LANGUAGES.find((l) => l.code === selectedLangCode)?.name
                        : 'Original'}
                    </p>
                    <p className={`text-base font-medium leading-relaxed ${textPrimary}`}>{sub.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper function to parse SRT
function parseSRT(content: string): SubtitleSegment[] {
  const blocks = content.trim().split(/\n\n+/);
  return blocks.map((block) => {
    const lines = block.split('\n');
    const time = lines[1];
    const text = lines.slice(2).join('\n');

    const [startTime, endTime] = time.split(' --> ');

    return {
      startTime,
      endTime,
      originalText: text,
      text,
    };
  });
}
