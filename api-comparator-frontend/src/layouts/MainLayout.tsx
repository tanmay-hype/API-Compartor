import { ChevronLeft, Menu, Radar, Sparkles } from 'lucide-react';
import { useApiCompare } from '../context/ApiCompareContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { TerminalErrorPrompt } from '../components/ui/TerminalErrorPrompt';
import { UploadPanel } from '../components/ui/UploadPanel';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { MethodDistributionChart } from '../components/dashboard/MethodDistributionChart';
import { DiffViewer } from '../components/diff/DiffViewer';
import { EndpointListItem } from '../components/diff/EndpointListItem';

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${active ? 'border-cyan-300/40 bg-cyan-400/10 text-cyan-200 shadow-neon' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
    >
      {label}
    </button>
  );
}

export function MainLayout() {
  const {
    visibleEntries,
    selectedEntry,
    setSelectedEndpointId,
    sidebarCollapsed,
    setSidebarCollapsed,
    activeFilter,
    setActiveFilter,
    error,
    clearError,
    comparisonReport,
    isParsing,
    isComparing,
  } = useApiCompare();

  return (
    <div className="relative min-h-screen overflow-hidden bg-space text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.10),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.10),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(249,115,22,0.08),_transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 soft-grid opacity-35" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1920px] gap-4 p-4 lg:p-6">
        <aside className={`transition-all duration-300 ${sidebarCollapsed ? 'w-[82px]' : 'w-full max-w-[340px]'} hidden xl:block`}>
          <GlassCard className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col overflow-hidden p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 shadow-neon">
                  <Radar className="h-5 w-5" />
                </div>
                {!sidebarCollapsed ? (
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">API Comparator</div>
                    <div className="truncate text-lg font-semibold text-white">Spec Intelligence</div>
                  </div>
                ) : null}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>

            {!sidebarCollapsed ? (
              <>
                <div className="mt-5 space-y-2">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Quick Filters</div>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'breaking', 'added', 'deleted', 'modified'].map((filter) => (
                      <FilterChip
                        key={filter}
                        label={filter === 'all' ? 'All' : filter === 'breaking' ? 'Breaking Changes Only' : filter}
                        active={activeFilter === filter}
                        onClick={() => setActiveFilter(filter as typeof activeFilter)}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Endpoint Hierarchy</div>
                      <div className="mt-1 text-sm text-slate-300">Grouped by the loaded comparison set</div>
                    </div>
                    <Badge tone="neutral">{visibleEntries.length}</Badge>
                  </div>

                  <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                    {visibleEntries.length > 0 ? visibleEntries.map((entry) => (
                      <EndpointListItem
                        key={entry.id}
                        entry={entry}
                        selected={selectedEntry?.id === entry.id}
                        onSelect={() => setSelectedEndpointId(entry.id)}
                      />
                    )) : (
                      <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-5 text-sm text-slate-500">
                        Load files and run compare to see endpoints here.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 flex flex-1 flex-col items-center gap-3 text-slate-400">
                <Sparkles className="h-5 w-5 text-cyan-300" />
                <span className="text-[10px] uppercase tracking-[0.28em]">Collapsed</span>
              </div>
            )}
          </GlassCard>
        </aside>

        <main className="min-w-0 flex-1 space-y-4 lg:space-y-6">
          <GlassCard className="sticky top-4 z-20 p-4 backdrop-blur-xl lg:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Futuristic API Specification Comparator</div>
                <h1 className="mt-2 text-2xl font-semibold text-white lg:text-3xl">Compare revisions with structured, visual diffs</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                  Upload a baseline specification and a comparator specification, then inspect route changes, request/response mutations, and timing regressions.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={comparisonReport ? 'emerald' : 'neutral'}>{comparisonReport ? 'Report Ready' : 'Awaiting Compare'}</Badge>
                <Badge tone={isParsing ? 'indigo' : isComparing ? 'orange' : 'neutral'}>{isParsing ? 'Parsing' : isComparing ? 'Comparing' : 'Idle'}</Badge>
              </div>
            </div>
          </GlassCard>

          <UploadPanel />
          <SummaryCards />

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
            <DiffViewer />
            <div className="space-y-4">
              <MethodDistributionChart />
              <GlassCard className="p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Backend Connection</div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  The UI posts the selected files to your FastAPI backend at <span className="font-mono text-cyan-200">/api/v1/compare</span> and renders the returned comparison report in real time.
                </p>
              </GlassCard>
            </div>
          </div>

          {error ? <TerminalErrorPrompt message={error} onDismiss={clearError} /> : null}
        </main>
      </div>
    </div>
  );
}
