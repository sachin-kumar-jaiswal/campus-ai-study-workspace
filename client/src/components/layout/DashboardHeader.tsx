import React from 'react';
import { Menu, Sun, Moon, Monitor } from 'lucide-react';
import { useThemeContext } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ThemeMode } from '@/types';

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

const themeOptions: { mode: ThemeMode; icon: React.FC<{ className?: string }>; label: string }[] = [
  { mode: 'light', icon: Sun, label: 'Light mode' },
  { mode: 'dark', icon: Moon, label: 'Dark mode' },
  { mode: 'system', icon: Monitor, label: 'System mode' },
];

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuClick }) => {
  const { theme, setTheme } = useThemeContext();
  const { user } = useAuth();

  const cycleTheme = () => {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const currentOption = themeOptions.find((o) => o.mode === theme) || themeOptions[0];
  const Icon = currentOption.icon;

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Skip to content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm font-medium z-50"
        >
          Skip to main content
        </a>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          aria-label={`Current theme: ${currentOption.label}. Click to cycle.`}
        >
          <Icon className="h-4 w-4" />
        </Button>

        {/* User avatar */}
        <Avatar name={user?.name || ''} size="sm" />
      </div>
    </header>
  );
};

export default DashboardHeader;
