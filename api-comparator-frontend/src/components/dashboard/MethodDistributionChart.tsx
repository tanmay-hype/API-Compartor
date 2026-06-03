import { useMemo } from 'react';
import { useApiCompare } from '../../context/ApiCompareContext';
import { GlassCard } from '../ui/GlassCard';

const COLORS: Record<string, string> = {
  GET: 'from-cyan-400/70 to-cyan-300/30',
  POST: 'from-emerald-400/70 to-emerald-300/30',
  PUT: 'from-indigo-400/70 to-indigo-300/30',
  PATCH: 'from-orange-400/70 to-orange-300/30',
  DELETE: 'from-rose-400/70 to-rose-300/30',
  UNKNOWN: 'from-white/20 to-white/5',
};

export function MethodDistributionChart() {
  const { methodDistribution } = useApiCompare();

  const rows = useMemo(
    () => Object.entries(methodDistribution).sort((a, b) => b[1] - a[1]),
    [methodDistribution],
  );

  const total = rows.reduce((sum, [, count]) => sum + count, 0) || 1;

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Method Distribution</div>
          <h3 className="mt-2 text-lg font-semibold text-white">API traffic shape</h3>
        </div>
        <div className="text-xs text-slate-400">Grouped from the loaded specs</div>
      </div>

      <div className="space-y-4">
        {rows.length > 0 ? (
          rows.map(([method, count]) => {
            const width = Math.max(8, Math.round((count / total) * 100));
            return (
              <div key={method}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-mono text-slate-200">{method}</span>
                  <span className="text-slate-400">{count}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-white/5">
                  <div className={`h-full rounded-full bg-gradient-to-r ${COLORS[method] ?? COLORS.UNKNOWN}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
            Upload both files and run compare to populate the method distribution.
          </div>
        )}
      </div>
    </GlassCard>
  );
}
