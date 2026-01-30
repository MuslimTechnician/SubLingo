import { Settings, X, Key } from 'lucide-react';
import { API_KEY_URL } from '@/constants/config';

interface SettingsModalProps {
  isOpen: boolean;
  apiKey: string;
  isDark: boolean;
  onApiKeyChange: (key: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const SettingsModal = ({
  isOpen,
  apiKey,
  isDark,
  onApiKeyChange,
  onSave,
  onClose,
}: SettingsModalProps) => {
  if (!isOpen) return null;

  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';
  const textSecondary = isDark ? 'text-zinc-400' : 'text-zinc-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl scale-100 ${
          isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white'
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-bold flex items-center gap-2 ${textPrimary}`}>
            <Settings className="w-5 h-5" />
            Settings
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-zinc-100 transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'text-zinc-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${textPrimary}`}>
              Google Gemini API Key
            </label>
            <div className="relative">
              <Key className={`absolute left-3 top-3 w-5 h-5 ${textSecondary}`} />
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                  isDark
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600'
                    : 'bg-white border-zinc-200 text-zinc-900'
                }`}
              />
            </div>
            <p className={`text-xs mt-2 ${textSecondary}`}>
              Required. Stored locally in your browser.
              <a
                href={API_KEY_URL}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-500 hover:underline ml-1"
              >
                Get API Key
              </a>
            </p>
          </div>

          <button
            onClick={onSave}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 mt-4"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
