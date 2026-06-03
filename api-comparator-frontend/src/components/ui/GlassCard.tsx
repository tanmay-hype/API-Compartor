import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevated?: boolean;
}

export function GlassCard({ children, className, elevated = false, ...props }: GlassCardProps) {
  return (
    <div
      className={clsx(
        'rounded-3xl border border-white/10 bg-glass/90 backdrop-blur-md shadow-glass',
        elevated && 'shadow-neon',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
