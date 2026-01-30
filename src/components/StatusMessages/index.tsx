import { Loader2, AlertCircle } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

interface StatusMessagesProps {
  isProcessing: boolean;
  error: string | null;
  selectedLangCode: string;
  isDark: boolean;
  isTranslationMode?: boolean;
}

export const StatusMessages = ({ isProcessing, error, selectedLangCode, isDark, isTranslationMode = true }: StatusMessagesProps) => {
  if (isProcessing) {
    const title = isTranslationMode ? 'Generating Translated Subtitles' : 'Generating Same-Language Subtitles';
    const description = isTranslationMode
      ? `Listening, transcribing, and translating to ${SUPPORTED_LANGUAGES.find((l) => l.code === selectedLangCode)?.name}...`
      : 'Listening and transcribing audio in the original language...';

    return (
      <div
        className={`border rounded-2xl p-6 flex items-center gap-5 animate-pulse ${
          isDark ? 'bg-zinc-900/50 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'
        }`}
      >
        <div className="p-3 bg-indigo-500/10 rounded-full">
          <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
        <div>
          <p
            className={`font-semibold text-lg ${isDark ? 'text-indigo-200' : 'text-indigo-900'}`}
          >
            {title}
          </p>
          <p className={`text-sm mt-1 ${isDark ? 'text-indigo-400/60' : 'text-indigo-600/70'}`}>
            {description}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className={`text-sm ${isDark ? 'text-red-200' : 'text-red-800'}`}>{error}</p>
      </div>
    );
  }

  return null;
};
