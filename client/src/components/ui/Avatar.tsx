import React from 'react';
import { cn, getInitials } from '@/lib/utils';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles = {
  xs: 'h-6 w-6 text-2xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({
  name = '',
  src,
  size = 'md',
  className,
}) => {
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-primary/10 text-primary font-semibold overflow-hidden shrink-0',
        sizeStyles[size],
        className
      )}
      aria-label={name ? `Avatar for ${name}` : 'Avatar'}
      role="img"
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials || '?'}</span>
      )}
    </div>
  );
};
