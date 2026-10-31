import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center py-16 px-6',
      className
    )}
  >
    {icon && (
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-5 text-muted-foreground">
        {icon}
      </div>
    )}
    <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    )}
    {action && (
      <Button className="mt-5" size="sm" onClick={action.onClick}>
        {action.label}
      </Button>
    )}
  </div>
);

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center py-16 px-6',
      className
    )}
    role="alert"
  >
    <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-5">
      <span className="text-2xl" aria-hidden="true">⚠️</span>
    </div>
    <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
    {onRetry && (
      <Button className="mt-5" size="sm" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);
