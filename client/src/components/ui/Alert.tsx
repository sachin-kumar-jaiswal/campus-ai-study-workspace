import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

const config: Record<AlertVariant, { icon: React.FC<{ className?: string }>; styles: string }> = {
  info: { icon: Info, styles: 'bg-primary/5 border-primary/20 text-primary' },
  success: { icon: CheckCircle2, styles: 'bg-success/5 border-success/20 text-success' },
  warning: { icon: AlertTriangle, styles: 'bg-warning/5 border-warning/20 text-warning' },
  error: { icon: AlertCircle, styles: 'bg-destructive/5 border-destructive/20 text-destructive' },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  onDismiss,
  className,
}) => {
  const { icon: Icon, styles } = config[variant];

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3.5 text-sm animate-fade-in',
        styles,
        className
      )}
    >
      <Icon className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <p className="opacity-90">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
