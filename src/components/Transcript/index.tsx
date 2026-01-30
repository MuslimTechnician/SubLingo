import { Download, Play, CheckCircle2 } from 'lucide-react';
import { SubtitleSegment } from '@/types';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

interface TranscriptProps {
  subtitles: SubtitleSegment[];
  selectedLangCode: string;
  isDark: boolean;
  onSeekTo: (timestamp: string) => void;
  onDownloadSRT: () => void;
}

export const Transcript = ({ subtitles, selectedLangCode, isDark, onSeekTo, onDownloadSRT }: TranscriptProps) => {
  const cardClass = isDark
    ? 'bg-zinc-900/50 border-zinc-800'
    : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/50';
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div
      className={`max-h-[600px] border rounded-3xl flex flex-col shadow-xl backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 ${cardClass}`}
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
          <span
            className={`text-xs font-mono px-2.5 py-1.5 rounded-md ${
              isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            {subtitles.length} lines
          </span>
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

      <div className="flex-1 overflow-y-auto p-0 scroll-smooth">
        <div className={`divide-y ${isDark ? 'divide-zinc-800/50' : 'divide-zinc-100'}`}>
          {subtitles.map((sub, idx) => {
            const hasOriginalText = sub.originalText !== sub.text;

            return (
              <div
                key={idx}
                className={`p-5 transition-colors group ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'}`}
              >
                <div className="flex items-center gap-3 mb-2.5">
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
                      {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLangCode)?.name}
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
