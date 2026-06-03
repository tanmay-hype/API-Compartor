import type { ReactNode } from 'react';

interface TooltipProps {
  label: ReactNode;
  children: ReactNode;
}

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max -translate-x-1/2 translate-y-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200 opacity-0 shadow-glass transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}
