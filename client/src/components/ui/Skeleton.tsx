import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  lines = 1,
  rounded = false,
  ...props
}) => {
  if (lines === 1) {
    return (
      <div
        className={cn(
          'animate-pulse bg-muted',
          rounded ? 'rounded-full' : 'rounded-md',
          className
        )}
        aria-hidden="true"
        {...props}
      />
    );
  }

  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-muted rounded-md h-4',
            i === lines - 1 && 'w-3/4',
            className
          )}
        />
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-border bg-card p-6 space-y-4" aria-hidden="true">
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10" rounded />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <Skeleton lines={3} />
  </div>
);
