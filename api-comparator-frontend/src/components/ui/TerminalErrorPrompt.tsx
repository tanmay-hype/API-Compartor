import { AlertTriangle, Cpu } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface TerminalErrorPromptProps {
  message: string;
  onDismiss?: () => void;
}

export function TerminalErrorPrompt({ message, onDismiss }: TerminalErrorPromptProps) {
  return (
    <GlassCard className="border-rose-400/30 bg-slate-950/95 p-4 shadow-[0_0_0_1px_rgba(244,63,94,0.12),0_0_42px_rgba(244,63,94,0.12)]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/10 text-rose-300">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-rose-300/80">
            <Cpu className="h-4 w-4" /> Terminal Error
          </div>
          <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-sm leading-6 text-rose-100">
            {message}
          </pre>
          {onDismiss ? (
            <button
              type="button"
              onClick={onDismiss}
              className="mt-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10"
            >
              Dismiss
            </button>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}
