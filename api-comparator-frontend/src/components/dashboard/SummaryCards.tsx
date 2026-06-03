import type { ReactNode } from 'react';
import { ShieldAlert, Plus, Minus, GitMerge } from 'lucide-react';
import { useApiCompare } from '../../context/ApiCompareContext';
import { GlassCard } from '../ui/GlassCard';
import { Badge } from '../ui/Badge';

function Ring({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="relative flex h-24 w-24 items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(#22d3ee ${clamped}%, rgba(255,255,255,0.08) ${clamped}% 100%)`,
      }}
    >
      <div className="flex h-[4.6rem] w-[4.6rem] items-center justify-center rounded-full border border-white/10 bg-space/95">
        <span className="font-mono text-lg font-semibold text-cyan-200">{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, tone = 'neutral', accent }: { label: string; value: number | string; icon: ReactNode; tone?: 'neutral' | 'orange' | 'emerald' | 'rose' | 'indigo'; accent?: string }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
          {accent ? <Badge tone={tone === 'neutral' ? 'neutral' : tone} className="mt-3">{accent}</Badge> : null}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-100">{icon}</div>
      </div>
    </GlassCard>
  );
}

export function SummaryCards() {
  const { summary, comparisonReport } = useApiCompare();

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
      <GlassCard className="p-4 xl:col-span-1">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between xl:flex-col xl:items-start">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Total Endpoints Compared</div>
            <div className="mt-2 text-3xl font-semibold text-white">{summary.totalCompared}</div>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
              Circular summary based on the uploaded base and comparator specifications.
            </p>
          </div>
          <Ring value={comparisonReport?.pass_rate ?? 0} />
        </div>
      </GlassCard>

      <StatCard
        label="Breaking Changes"
        value={summary.breakingChanges}
        icon={<ShieldAlert className="h-5 w-5 text-orange-300" />}
        tone="orange"
        accent="Pulse: high risk"
      />
      <StatCard
        label="Paths Added"
        value={summary.pathsAdded}
        icon={<Plus className="h-5 w-5 text-emerald-300" />}
        tone="emerald"
        accent="New surface area"
      />
      <StatCard
        label="Paths Removed"
        value={summary.pathsRemoved}
        icon={<Minus className="h-5 w-5 text-rose-300" />}
        tone="rose"
        accent="Removed routes"
      />
      <StatCard
        label="Path Parameters Modified"
        value={summary.pathParametersModified}
        icon={<GitMerge className="h-5 w-5 text-indigo-300" />}
        tone="indigo"
        accent="Schema drift"
      />
    </div>
  );
}
