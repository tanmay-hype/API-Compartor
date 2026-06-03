import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

const variantStyles = {
  primary: 'bg-cyan-400/90 text-slate-950 shadow-neon hover:bg-cyan-300',
  secondary: 'bg-white/8 text-white border border-white/10 hover:bg-white/12',
  ghost: 'bg-transparent text-slate-200 hover:bg-white/8',
  danger: 'bg-rose-500/90 text-white shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_30px_rgba(244,63,94,0.18)] hover:bg-rose-400',
};

const sizeStyles = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60',
        variantStyles[variant],
        sizeStyles[size],
        loading && 'cursor-wait opacity-90',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/20 border-t-slate-950" /> : null}
      {children}
    </button>
  );
}
