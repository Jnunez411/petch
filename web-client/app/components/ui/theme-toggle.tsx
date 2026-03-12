import { Moon, Sun } from 'lucide-react';
import { useTheme } from '~/hooks/use-theme';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { effectiveTheme, toggleTheme, mounted } = useTheme();

  // Prevent hydration mismatch - render placeholder until mounted
  if (!mounted) {
    return (
      <button
        className={`p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${className}`}
        aria-label="Toggle theme"
        disabled
      >
        <div className="size-5" /> {/* Placeholder */}
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${className}`}
      aria-label={effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="relative size-5">
        <Sun
          className={`absolute inset-0 size-5 transition-all duration-300 ${
            effectiveTheme === 'dark'
              ? 'opacity-0 rotate-90 scale-50'
              : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        <Moon
          className={`absolute inset-0 size-5 transition-all duration-300 ${
            effectiveTheme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-50'
          }`}
        />
      </div>
    </button>
  );
}
