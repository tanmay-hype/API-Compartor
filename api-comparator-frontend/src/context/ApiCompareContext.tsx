import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { compareSpecs } from '../services/api';
import { useApiParser } from '../hooks/useApiParser';
import type {
  ApiComparisonResult,
  ApiEndpointSpec,
  ComparisonReport,
  DiffEntry,
  DiffFilter,
  ParsedSpecDocument,
  ViewMode,
} from '../types/apiDiff';

interface ApiCompareContextValue {
  baseFile: File | null;
  comparatorFile: File | null;
  baseDocument: ParsedSpecDocument | null;
  comparatorDocument: ParsedSpecDocument | null;
  comparisonReport: ComparisonReport | null;
  diffEntries: DiffEntry[];
  visibleEntries: DiffEntry[];
  selectedEntry: DiffEntry | null;
  selectedEndpointId: string | null;
  viewMode: ViewMode;
  activeFilter: DiffFilter;
  searchQuery: string;
  sidebarCollapsed: boolean;
  isParsing: boolean;
  isComparing: boolean;
  error: string | null;
  summary: {
    totalCompared: number;
    breakingChanges: number;
    pathsAdded: number;
    pathsRemoved: number;
    pathParametersModified: number;
    passed: number;
    warned: number;
    failed: number;
    errors: number;
    passRate: number;
  };
  methodDistribution: Record<string, number>;
  setBaseFile: (file: File | null) => void;
  setComparatorFile: (file: File | null) => void;
  setActiveFilter: (filter: DiffFilter) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSelectedEndpointId: (id: string | null) => void;
  compareNow: () => Promise<void>;
  clearError: () => void;
}

const ApiCompareContext = createContext<ApiCompareContextValue | undefined>(undefined);

function toMap(endpoints: ApiEndpointSpec[]) {
  return new Map(endpoints.map((endpoint) => [endpoint.id, endpoint] as const));
}

function hasBreakingFault(result?: ApiComparisonResult) {
  return Boolean(result?.faults.some((fault) => fault.severity === 'FAIL' || fault.severity === 'ERROR'));
}

function isModifiedResult(result?: ApiComparisonResult) {
  return Boolean(result && result.faults.length > 0);
}

function countPathParamChanges(result?: ApiComparisonResult) {
  return Boolean(result?.faults.some((fault) => fault.field_path.includes('path_params')));
}

export function ApiCompareProvider({ children }: { children: ReactNode }) {
  const { parseSpecFile } = useApiParser();
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [comparatorFile, setComparatorFile] = useState<File | null>(null);
  const [baseDocument, setBaseDocument] = useState<ParsedSpecDocument | null>(null);
  const [comparatorDocument, setComparatorDocument] = useState<ParsedSpecDocument | null>(null);
  const [comparisonReport, setComparisonReport] = useState<ComparisonReport | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [activeFilter, setActiveFilter] = useState<DiffFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function parseFiles() {
      if (!baseFile && !comparatorFile) {
        setBaseDocument(null);
        setComparatorDocument(null);
        setSelectedEndpointId(null);
        return;
      }

      setIsParsing(true);
      setError(null);

      try {
        const [baseParsed, comparatorParsed] = await Promise.all([
          baseFile ? parseSpecFile(baseFile) : Promise.resolve(null),
          comparatorFile ? parseSpecFile(comparatorFile) : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        setBaseDocument(baseParsed);
        setComparatorDocument(comparatorParsed);
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Unable to parse uploaded file.');
        }
      } finally {
        if (!cancelled) {
          setIsParsing(false);
        }
      }
    }

    parseFiles();

    return () => {
      cancelled = true;
    };
  }, [baseFile, comparatorFile, parseSpecFile]);

  const comparisonIndex = useMemo(() => {
    return new Map((comparisonReport?.results ?? []).map((result) => [result.id, result] as const));
  }, [comparisonReport]);

  const diffEntries = useMemo<DiffEntry[]>(() => {
    const baseMap = toMap(baseDocument?.endpoints ?? []);
    const comparatorMap = toMap(comparatorDocument?.endpoints ?? []);
    const ids = new Set([...baseMap.keys(), ...comparatorMap.keys()]);

    return Array.from(ids).map((id) => {
      const base = baseMap.get(id);
      const comparator = comparatorMap.get(id);
      const report = comparisonIndex.get(id);

      let changeKind: DiffEntry['changeKind'] = 'unchanged';
      if (base && !comparator) {
        changeKind = 'removed';
      } else if (!base && comparator) {
        changeKind = 'added';
      } else if (report && isModifiedResult(report)) {
        changeKind = hasBreakingFault(report) ? 'breaking' : 'modified';
      }

      return { id, base, comparator, report, changeKind };
    });
  }, [baseDocument?.endpoints, comparatorDocument?.endpoints, comparisonIndex]);

  const visibleEntries = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return diffEntries.filter((entry) => {
      const statusMatches = (() => {
        switch (activeFilter) {
          case 'breaking':
            return entry.changeKind === 'breaking';
          case 'added':
            return entry.changeKind === 'added';
          case 'deleted':
            return entry.changeKind === 'removed';
          case 'modified':
            return entry.changeKind === 'modified';
          case 'all':
          default:
            return true;
        }
      })();

      const queryMatches = !normalizedQuery
        || entry.id.toLowerCase().includes(normalizedQuery)
        || entry.base?.path.toLowerCase().includes(normalizedQuery)
        || entry.comparator?.path.toLowerCase().includes(normalizedQuery)
        || entry.base?.method.toLowerCase().includes(normalizedQuery)
        || entry.comparator?.method.toLowerCase().includes(normalizedQuery);

      return statusMatches && queryMatches;
    });
  }, [activeFilter, diffEntries, searchQuery]);

  useEffect(() => {
    if (!visibleEntries.length) {
      setSelectedEndpointId(null);
      return;
    }

    if (!selectedEndpointId || !visibleEntries.some((entry) => entry.id === selectedEndpointId)) {
      setSelectedEndpointId(visibleEntries[0].id);
    }
  }, [selectedEndpointId, visibleEntries]);

  const selectedEntry = useMemo(() => {
    return visibleEntries.find((entry) => entry.id === selectedEndpointId) ?? visibleEntries[0] ?? null;
  }, [selectedEndpointId, visibleEntries]);

  const summary = useMemo(() => {
    const totalCompared = diffEntries.length;
    const breakingChanges = diffEntries.filter((entry) => entry.changeKind === 'breaking').length;
    const pathsAdded = diffEntries.filter((entry) => entry.changeKind === 'added').length;
    const pathsRemoved = diffEntries.filter((entry) => entry.changeKind === 'removed').length;
    const pathParametersModified = diffEntries.filter((entry) => countPathParamChanges(entry.report)).length;
    return {
      totalCompared,
      breakingChanges,
      pathsAdded,
      pathsRemoved,
      pathParametersModified,
      passed: comparisonReport?.passed ?? 0,
      warned: comparisonReport?.warned ?? 0,
      failed: comparisonReport?.failed ?? 0,
      errors: comparisonReport?.errors ?? 0,
      passRate: comparisonReport?.pass_rate ?? 0,
    };
  }, [comparisonReport, diffEntries]);

  const methodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of diffEntries) {
      const method = (entry.comparator?.method ?? entry.base?.method ?? 'UNKNOWN').toUpperCase();
      counts[method] = (counts[method] ?? 0) + 1;
    }
    return counts;
  }, [diffEntries]);

  const compareNow = useCallback(async () => {
    if (!baseFile || !comparatorFile) {
      setError('Upload both Base API File and Comparator API File before comparing.');
      return;
    }

    setIsComparing(true);
    setError(null);

    try {
      const report = await compareSpecs(baseFile, comparatorFile);
      setComparisonReport(report);
      if (report.results.length > 0) {
        setSelectedEndpointId(report.results[0].id);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to compare the provided files.');
    } finally {
      setIsComparing(false);
    }
  }, [baseFile, comparatorFile]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<ApiCompareContextValue>(() => ({
    baseFile,
    comparatorFile,
    baseDocument,
    comparatorDocument,
    comparisonReport,
    diffEntries,
    visibleEntries,
    selectedEntry,
    selectedEndpointId,
    viewMode,
    activeFilter,
    searchQuery,
    sidebarCollapsed,
    isParsing,
    isComparing,
    error,
    summary,
    methodDistribution,
    setBaseFile,
    setComparatorFile,
    setActiveFilter,
    setViewMode,
    setSearchQuery,
    setSidebarCollapsed,
    setSelectedEndpointId,
    compareNow,
    clearError,
  }), [
    activeFilter,
    baseDocument,
    baseFile,
    clearError,
    comparisonReport,
    comparatorDocument,
    comparatorFile,
    compareNow,
    diffEntries,
    error,
    isComparing,
    isParsing,
    methodDistribution,
    searchQuery,
    selectedEndpointId,
    selectedEntry,
    sidebarCollapsed,
    summary,
    visibleEntries,
    viewMode,
  ]);

  return <ApiCompareContext.Provider value={value}>{children}</ApiCompareContext.Provider>;
}

export function useApiCompare() {
  const context = useContext(ApiCompareContext);
  if (!context) {
    throw new Error('useApiCompare must be used inside ApiCompareProvider');
  }
  return context;
}
