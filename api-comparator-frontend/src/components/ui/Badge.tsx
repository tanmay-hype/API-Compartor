import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: 'neutral' | 'emerald' | 'rose' | 'indigo' | 'orange';
}

const toneStyles = {
  neutral: 'bg-white/8 text-slate-200 border-white/10',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
  orange: 'bg-orange-500/15 text-orange-300 border-orange-400/30',
};

export function Badge({ children, tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-sm',
        toneStyles[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
