import { Settings, Sun, Moon, Subtitles } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onSettingsClick: () => void;
  onThemeToggle: () => void;
}

export const Header = ({ isDark, onSettingsClick, onThemeToggle }: HeaderProps) => {
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';

  return (
    <header className="w-full max-w-7xl flex items-center justify-between mb-16">
      {/* Left: Settings (Icon Only) */}
      <button
        onClick={onSettingsClick}
        className={`p-3 rounded-full transition-all duration-200 ${
          isDark
            ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
            : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
        }`}
        title="API Settings"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Center: Logo */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-xl ${
            isDark ? 'bg-indigo-500/10 ring-1 ring-indigo-500/20' : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          <Subtitles className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
        </div>
        <h1 className={`text-2xl font-bold tracking-tight ${textPrimary}`}>SubLingo</h1>
      </div>

      {/* Right: Theme Toggle */}
      <button
        onClick={onThemeToggle}
        className={`p-3 rounded-full transition-all duration-200 ${
          isDark
            ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
            : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
        }`}
        title="Toggle Theme"
      >
        {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>
    </header>
  );
};
