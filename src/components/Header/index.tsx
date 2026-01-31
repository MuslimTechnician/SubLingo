import { Sun, Moon, Subtitles, Settings } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onMenuClick: () => void;
  onThemeToggle: () => void;
}

export const Header = ({ isDark, onMenuClick, onThemeToggle }: HeaderProps) => {
  const textPrimary = isDark ? 'text-white' : 'text-zinc-900';

  return (
    <header className={`w-full max-w-7xl flex items-center justify-between mb-6 pb-3 border-b ${
      isDark
        ? 'border-zinc-800 shadow-lg shadow-zinc-900/20'
        : 'border-zinc-200 shadow-lg shadow-zinc-200/50'
    }`}>
      {/* Left: Settings Button */}
      <button
        onClick={onMenuClick}
        className={`p-2 rounded-full transition-all duration-200 ${
          isDark
            ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
            : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
        }`}
        title="API Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Center: Logo */}
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-xl ${
            isDark ? 'bg-indigo-500/10 ring-1 ring-indigo-500/20' : 'bg-indigo-50 text-indigo-600'
          }`}
        >
          <Subtitles className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
        </div>
        <h1 className={`text-xl font-bold tracking-tight ${textPrimary}`}>SubLingo</h1>
      </div>

      {/* Right: Theme Toggle */}
      <button
        onClick={onThemeToggle}
        className={`p-2 rounded-full transition-all duration-200 ${
          isDark
            ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
            : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
        }`}
        title="Toggle Theme"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
};
