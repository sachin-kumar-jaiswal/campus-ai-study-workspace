import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  FileText,
  ListChecks,
  CalendarDays,
  BarChart3,
  Settings,
  LogOut,
  X,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/context/ToastContext';

interface NavItem {
  label: string;
  to: string;
  icon: React.FC<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'AI Tutor', to: '/dashboard/ai-tutor', icon: Bot },
  { label: 'My Documents', to: '/dashboard/documents', icon: FileText },
  { label: 'Quizzes', to: '/dashboard/quizzes', icon: ListChecks },
  { label: 'Study Planner', to: '/dashboard/planner', icon: CalendarDays },
  { label: 'Analytics', to: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogout = async () => {
    await logout();
    showToast('success', 'Logged out', 'See you next time!');
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg border border-border bg-background flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-bold text-foreground">CampusAI</span>
            <p className="text-2xs text-muted-foreground leading-none mt-0.5">Academic Workspace</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Primary navigation">
        <ul className="space-y-0.5" role="list">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/dashboard'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : '')}
                      aria-hidden="true"
                    />
                    <span className="flex-1">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User profile + logout */}
      <div className="px-3 pb-4 border-t border-border pt-3">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors">
          <Avatar name={user?.name || ''} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-150 mt-0.5"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex lg:flex-col w-60 xl:w-64 border-r border-border bg-card shrink-0 h-full"
        aria-label="Sidebar navigation"
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            className="relative flex flex-col w-72 bg-card border-r border-border h-full shadow-modal animate-slide-in-right"
            aria-label="Mobile navigation"
          >
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
