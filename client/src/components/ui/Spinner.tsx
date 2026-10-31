import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => (
  <div
    role="status"
    aria-label="Loading"
    className={cn(
      'rounded-full border-primary/20 border-t-primary animate-spin',
      sizeStyles[size],
      className
    )}
  />
);

export const LoadingScreen: React.FC = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background z-50" role="status" aria-label="Loading application">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="text-2xl font-bold gradient-text">C</span>
        </div>
        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-background bg-primary/20 flex items-center justify-center">
          <Spinner size="xs" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">CampusAI</p>
        <p className="text-xs text-muted-foreground mt-0.5">Loading your workspace...</p>
      </div>
    </div>
  </div>
);

export const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading page">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);
