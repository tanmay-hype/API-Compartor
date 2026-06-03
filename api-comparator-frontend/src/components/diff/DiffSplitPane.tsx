import { useRef } from 'react';
import { ArrowRightLeft, Layers3 } from 'lucide-react';
import { useApiCompare } from '../../context/ApiCompareContext';
import { useScrollSync } from '../../hooks/useScrollSync';
import type { ApiEndpointSpec, FaultDetail } from '../../types/apiDiff';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';

function toneForFault(code: string, side: 'base' | 'comparator') {
  const isMissing = code.includes('MISSING') || code.includes('REMOVED');
  const isExtra = code.includes('EXTRA') || code.includes('ADDED');
  const isTiming = code.includes('TIMING');
  if (isTiming) return 'orange';
  if (isMissing) return side === 'base' ? 'rose' : 'emerald';
  if (isExtra) return side === 'base' ? 'rose' : 'emerald';
  return 'indigo';
}

function sectionTitle(label: string, count?: number) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h4 className="text-sm font-semibold text-white">{label}</h4>
      {typeof count === 'number' ? <span className="text-xs text-slate-400">{count}</span> : null}
    </div>
  );
}

function ParamGrid({ title, values, faults, side }: { title: string; values?: Record<string, any>; faults: FaultDetail[]; side: 'base' | 'comparator' }) {
  const items = Object.entries(values ?? {});
  return (
    <div>
      {sectionTitle(title, items.length)}
      <div className="space-y-2">
        {items.length > 0 ? items.map(([name, schema]) => {
          const fault = faults.find((item) => item.field_path.includes(name));
          const tone = fault ? toneForFault(fault.code, side) : 'neutral';
          return (
            <div key={name} className={`rounded-2xl border px-3 py-2 text-sm ${tone === 'orange' ? 'border-orange-400/30 bg-orange-500/10 text-orange-100' : tone === 'rose' ? 'border-rose-400/30 bg-rose-500/10 text-rose-100' : tone === 'emerald' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : tone === 'indigo' ? 'border-indigo-400/30 bg-indigo-500/10 text-indigo-100' : 'border-white/10 bg-white/5 text-slate-200'}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono">{name}</span>
                <Badge tone={tone as never}>{String(schema?.type ?? 'unknown')}</Badge>
              </div>
              <div className="mt-1 text-xs text-slate-400">{schema?.format ? `format: ${schema.format}` : schema?.required ? 'required' : 'optional'}</div>
            </div>
          );
        }) : <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-500">No entries.</div>}
      </div>
    </div>
  );
}

function JsonTree({ data, faults, side, path = '' }: { data: unknown; faults: FaultDetail[]; side: 'base' | 'comparator'; path?: string }) {
  if (data === null || data === undefined) {
    return <span className="text-slate-400">null</span>;
  }

  if (typeof data !== 'object') {
    const fault = faults.find((item) => item.field_path === path || item.field_path.endsWith(path));
    const tone = fault ? toneForFault(fault.code, side) : 'neutral';
    const className = tone === 'orange' ? 'text-orange-300' : tone === 'rose' ? 'text-rose-300' : tone === 'emerald' ? 'text-emerald-300' : tone === 'indigo' ? 'text-indigo-300' : 'text-slate-200';
    return <span className={className}>{JSON.stringify(data)}</span>;
  }

  const entries = Array.isArray(data)
    ? data.map((value, index) => [String(index), value] as const)
    : Object.entries(data as Record<string, unknown>);

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => {
        const nextPath = path ? `${path}.${key}` : key;
        const fault = faults.find((item) => item.field_path === nextPath || item.field_path.startsWith(`${nextPath}.`));
        const tone = fault ? toneForFault(fault.code, side) : 'neutral';
        const borderClass = tone === 'orange' ? 'border-orange-400/30' : tone === 'rose' ? 'border-rose-400/30' : tone === 'emerald' ? 'border-emerald-400/30' : tone === 'indigo' ? 'border-indigo-400/30' : 'border-white/10';
        const accentClass = tone === 'orange' ? 'text-orange-300' : tone === 'rose' ? 'text-rose-300' : tone === 'emerald' ? 'text-emerald-300' : tone === 'indigo' ? 'text-indigo-300' : 'text-cyan-200';

        return (
          <details key={nextPath} open className={`rounded-2xl border ${borderClass} bg-black/20 px-3 py-2`}>
            <summary className="cursor-pointer list-none text-sm font-medium text-slate-100">
              <span className={`font-mono ${accentClass}`}>{key}</span>
            </summary>
            <div className="mt-3 pl-3 text-sm">
              <JsonTree data={value} faults={faults} side={side} path={nextPath} />
            </div>
          </details>
        );
      })}
    </div>
  );
}

function EndpointPane({ endpoint, faults, side }: { endpoint: ApiEndpointSpec; faults: FaultDetail[]; side: 'base' | 'comparator' }) {
  return (
    <GlassCard className="h-full p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{side === 'base' ? 'Base API' : 'Comparator API'}</div>
          <h3 className="mt-2 text-xl font-semibold text-white">{endpoint.path}</h3>
          <p className="mt-1 text-sm text-slate-400">{endpoint.name}</p>
        </div>
        <Badge tone={side === 'base' ? 'indigo' : 'emerald'}>{endpoint.method}</Badge>
      </div>

      <div className="space-y-5 text-sm">
        <div>
          {sectionTitle('Path Parameters', Object.keys(endpoint.path_params ?? {}).length)}
          <ParamGrid title="" values={endpoint.path_params} faults={faults} side={side} />
        </div>

        <div>
          {sectionTitle('Query Parameters', Object.keys(endpoint.query_params ?? {}).length)}
          <ParamGrid title="" values={endpoint.query_params} faults={faults} side={side} />
        </div>

        <div>
          {sectionTitle('Request Body')}
          {endpoint.request_body ? (
            <GlassCard className="border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge tone="neutral">{endpoint.request_body.content_type ?? 'application/json'}</Badge>
                <span className="text-xs text-slate-400">Schema comparison</span>
              </div>
              <JsonTree data={endpoint.request_body.schema ?? {}} faults={faults} side={side} path="request_body" />
            </GlassCard>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-500">No request body.</div>
          )}
        </div>

        <div>
          {sectionTitle('Responses')}
          <div className="space-y-3">
            {Object.entries(endpoint.responses ?? {}).length > 0 ? Object.entries(endpoint.responses ?? {}).map(([status, response]) => (
              <GlassCard key={status} className="border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <Badge tone={status.startsWith('2') ? 'emerald' : status.startsWith('4') ? 'rose' : 'indigo'}>{status}</Badge>
                  <span className="text-xs text-slate-400">{response.content_type ?? 'application/json'}</span>
                </div>
                <JsonTree data={response.schema ?? {}} faults={faults} side={side} path={`responses.${status}`} />
              </GlassCard>
            )) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-500">No responses.</div>
            )}
          </div>
        </div>

        <div>
          {sectionTitle('Timing')}
          {endpoint.response_time ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(endpoint.response_time).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{key}</div>
                  <div className="mt-2 font-mono text-lg text-white">{String(value)} ms</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-500">No timing metadata present.</div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export function DiffSplitPane() {
  const { selectedEntry } = useApiCompare();
  const baseScrollRef = useRef<HTMLDivElement>(null);
  const comparatorScrollRef = useRef<HTMLDivElement>(null);
  useScrollSync(baseScrollRef, comparatorScrollRef);

  const baseEndpoint = selectedEntry?.base;
  const comparatorEndpoint = selectedEntry?.comparator;
  const faults = selectedEntry?.report?.faults ?? [];

  if (!baseEndpoint && !comparatorEndpoint) {
    return (
      <GlassCard className="p-8 text-slate-400">
        <div className="flex items-center gap-3 text-cyan-300">
          <Layers3 className="h-5 w-5" />
          No endpoint selected
        </div>
        <p className="mt-3 text-sm leading-6">Select an endpoint from the sidebar after running a comparison.</p>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div ref={baseScrollRef} className="max-h-[78vh] overflow-y-auto pr-1">
        {baseEndpoint ? <EndpointPane endpoint={baseEndpoint} faults={faults} side="base" /> : <GlassCard className="p-5 text-slate-500">Endpoint removed in comparator.</GlassCard>}
      </div>
      <div ref={comparatorScrollRef} className="max-h-[78vh] overflow-y-auto pr-1">
        {comparatorEndpoint ? <EndpointPane endpoint={comparatorEndpoint} faults={faults} side="comparator" /> : <GlassCard className="p-5 text-slate-500">Endpoint missing in comparator.</GlassCard>}
      </div>
      <div className="xl:col-span-2 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.22em] text-slate-500">
        <ArrowRightLeft className="h-4 w-4" /> Synced split scroll
      </div>
    </div>
  );
}
