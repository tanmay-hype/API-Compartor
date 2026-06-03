import { Search, SplitSquareVertical, LayoutGrid } from 'lucide-react';
import { useApiCompare } from '../../context/ApiCompareContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { DiffSplitPane } from './DiffSplitPane';
import { DiffUnifiedPane } from './DiffUnifiedPane';

export function DiffViewer() {
  const { viewMode, setViewMode, searchQuery, setSearchQuery, visibleEntries, selectedEntry } = useApiCompare();

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 xl:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Diff Viewer</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Structured API differences</h2>
            <p className="mt-1 text-sm text-slate-400">Filter by endpoint path and switch between split and unified diff modes.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search endpoint path..."
                className="h-12 w-full min-w-[260px] rounded-2xl border border-white/10 bg-black/25 pl-11 pr-4 font-mono text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-300/20"
              />
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
              <Button variant={viewMode === 'split' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('split')}>
                <SplitSquareVertical className="h-4 w-4" /> Split View
              </Button>
              <Button variant={viewMode === 'unified' ? 'primary' : 'ghost'} size="sm" onClick={() => setViewMode('unified')}>
                <LayoutGrid className="h-4 w-4" /> Unified View
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone="neutral">{visibleEntries.length} endpoints visible</Badge>
          {selectedEntry ? <Badge tone={selectedEntry.changeKind === 'breaking' ? 'orange' : selectedEntry.changeKind === 'removed' ? 'rose' : selectedEntry.changeKind === 'added' ? 'emerald' : 'indigo'}>{selectedEntry.changeKind}</Badge> : null}
        </div>
      </GlassCard>

      {viewMode === 'split' ? <DiffSplitPane /> : <DiffUnifiedPane />}
    </div>
  );
}
