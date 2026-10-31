import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  badge,
  actions,
  className,
}) => (
  <div className={cn('flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between', className)}>
    <div>
      {badge && <div className="mb-2">{badge}</div>}
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">{description}</p>
      )}
    </div>
    {actions && (
      <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">{actions}</div>
    )}
  </div>
);
