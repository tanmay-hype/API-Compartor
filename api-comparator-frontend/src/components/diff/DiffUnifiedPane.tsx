import { useMemo } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { useApiCompare } from '../../context/ApiCompareContext';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';

function faultTone(code: string) {
  if (code.includes('TIMING')) return 'orange';
  if (code.includes('MISSING') || code.includes('FAIL')) return 'rose';
  if (code.includes('EXTRA') || code.includes('ADDED')) return 'emerald';
  return 'indigo';
}

export function DiffUnifiedPane() {
  const { visibleEntries, selectedEntry } = useApiCompare();

  const active = selectedEntry ?? visibleEntries[0] ?? null;
  const items = useMemo(() => active?.report?.faults ?? [], [active]);

  if (!active) {
    return (
      <GlassCard className="p-8 text-slate-400">
        <div className="flex items-center gap-3 text-cyan-300">
          <Sparkles className="h-5 w-5" />
          No diff to show
        </div>
        <p className="mt-3 text-sm leading-6">Run a comparison to render the unified diff timeline.</p>
      </GlassCard>
    );
  }

  const endpoint = active.comparator ?? active.base;

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Unified Diff</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">{endpoint?.path ?? active.id}</h3>
            <p className="mt-1 text-sm text-slate-400">{endpoint?.name ?? active.id}</p>
          </div>
          <Badge tone={active.changeKind === 'breaking' ? 'orange' : active.changeKind === 'removed' ? 'rose' : active.changeKind === 'added' ? 'emerald' : 'indigo'}>
            {active.changeKind}
          </Badge>
        </div>
      </GlassCard>

      <div className="grid gap-4">
        {items.length > 0 ? items.map((fault) => (
          <GlassCard key={`${fault.code}-${fault.field_path}`} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={faultTone(fault.code) as never}>{fault.severity}</Badge>
                  <Badge tone={faultTone(fault.code) as never}>{fault.code}</Badge>
                </div>
                <div className="mt-3 text-sm text-slate-200">{fault.message}</div>
                <div className="mt-2 font-mono text-xs text-slate-400">{fault.field_path}</div>
              </div>
              {fault.severity === 'ERROR' || fault.severity === 'FAIL' ? (
                <div className="animate-pulseRing flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-200">
                  <AlertTriangle className="h-4 w-4" /> Breaking change
                </div>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">Original</div>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 text-rose-200">{JSON.stringify(fault.original, null, 2)}</pre>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">Migrated</div>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-6 text-emerald-200">{JSON.stringify(fault.migrated, null, 2)}</pre>
              </div>
            </div>
          </GlassCard>
        )) : (
          <GlassCard className="p-6">
            <div className="text-sm text-slate-400">No faults detected for this endpoint.</div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
