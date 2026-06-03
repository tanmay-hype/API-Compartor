import type { DiffEntry } from '../../types/apiDiff';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';
import { Circle } from 'lucide-react';

function changeTone(changeKind: DiffEntry['changeKind']) {
  switch (changeKind) {
    case 'added':
      return 'emerald';
    case 'removed':
      return 'rose';
    case 'breaking':
      return 'orange';
    case 'modified':
      return 'indigo';
    default:
      return 'neutral';
  }
}

function changeLabel(changeKind: DiffEntry['changeKind']) {
  switch (changeKind) {
    case 'added':
      return '+ Added';
    case 'removed':
      return '- Removed';
    case 'breaking':
      return 'BREAKING';
    case 'modified':
      return '~ Modified';
    default:
      return 'No Change';
  }
}

export function EndpointListItem({
  entry,
  selected,
  onSelect,
}: {
  entry: DiffEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  const endpoint = entry.comparator ?? entry.base;
  const method = endpoint?.method?.toUpperCase() ?? 'UNKNOWN';

  return (
    <button type="button" onClick={onSelect} className="w-full text-left outline-none">
      <GlassCard
        className={`p-4 transition duration-300 ${selected ? 'border-cyan-300/40 bg-cyan-400/8 shadow-neon' : 'hover:border-white/20 hover:bg-white/7'}`}
      >
        <div className="flex items-start gap-3">
          <div className={`mt-1 rounded-full border border-white/10 p-2 ${selected ? 'bg-cyan-400/15 text-cyan-300' : 'bg-white/5 text-slate-400'}`}>
            <Circle className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={method === 'GET' ? 'indigo' : method === 'POST' ? 'emerald' : method === 'DELETE' ? 'rose' : 'neutral'}>{method}</Badge>
              <Badge tone={changeTone(entry.changeKind)}>{changeLabel(entry.changeKind)}</Badge>
            </div>
            <div className="mt-3 truncate font-mono text-sm text-white">{endpoint?.path ?? entry.id}</div>
            <div className="mt-1 truncate text-xs text-slate-400">{endpoint?.name ?? entry.id}</div>
          </div>
        </div>
      </GlassCard>
    </button>
  );
}
