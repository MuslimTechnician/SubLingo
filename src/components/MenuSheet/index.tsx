import { X, Key } from 'lucide-react';
import { API_KEY_URL } from '@/constants/config';

interface MenuSheetProps {
  isOpen: boolean;
  apiKey: string;
  isDark: boolean;
  onApiKeyChange: (key: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const MenuSheet = ({
  isOpen,
  apiKey,
  isDark,
  onApiKeyChange,
  onSave,
  onClose,
}: MenuSheetProps) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Centered Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div
          className={`w-full max-w-md rounded-3xl shadow-2xl border ${
            isDark
              ? 'bg-zinc-900/95 backdrop-blur-xl border-zinc-800'
              : 'bg-white/95 backdrop-blur-xl border-zinc-200'
          }`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              <Key className="w-5 h-5 text-indigo-500" />
              Settings
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isDark
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
                  : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                Google Gemini API Key
              </label>
              <div className="relative">
                <Key className={`absolute left-3 top-3 w-5 h-5 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
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
              <p className={`text-xs mt-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
