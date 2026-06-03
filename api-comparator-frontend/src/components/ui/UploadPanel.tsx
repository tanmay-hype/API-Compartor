import { useMemo, useRef, useState } from 'react';
import { FileUp, Sparkles, X } from 'lucide-react';
import { useApiCompare } from '../../context/ApiCompareContext';
import { Button } from './Button';
import { GlassCard } from './GlassCard';

function UploadTile({
  label,
  file,
  onChange,
  accept,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  accept: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const description = useMemo(() => {
    if (!file) {
      return 'Drop JSON or YAML here, or click to browse.';
    }
    return `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;
  }, [file]);

  return (
    <div
      className={`group relative rounded-3xl border border-dashed p-4 transition duration-300 ${isDragging ? 'border-cyan-300 bg-cyan-400/10 shadow-neon' : 'border-white/10 bg-white/5 hover:bg-white/7'}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const dropped = event.dataTransfer.files?.[0];
        if (dropped) {
          onChange(dropped);
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        </div>
        {file ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
            aria-label={`Clear ${label}`}
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-cyan-300">
            <FileUp className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
          Select File
        </Button>
        <span className="text-xs text-slate-500">Supports JSON / YAML / OpenAPI</span>
      </div>
    </div>
  );
}

export function UploadPanel() {
  const { baseFile, comparatorFile, setBaseFile, setComparatorFile, compareNow, isComparing, isParsing } = useApiCompare();

  return (
    <GlassCard className="p-5 xl:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Specification Upload</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Compare API revisions</h2>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 md:flex">
          <Sparkles className="h-4 w-4" />
          Drag and drop enabled
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UploadTile label="Base API File" file={baseFile} onChange={setBaseFile} accept=".json,.yaml,.yml,application/json,text/yaml,text/x-yaml" />
        <UploadTile label="Comparator API File" file={comparatorFile} onChange={setComparatorFile} accept=".json,.yaml,.yml,application/json,text/yaml,text/x-yaml" />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Compare the base and comparator files to generate a structured diff report.</p>
        <Button loading={isComparing || isParsing} onClick={() => void compareNow()} size="lg">
          Compare Now
        </Button>
      </div>
    </GlassCard>
  );
}
