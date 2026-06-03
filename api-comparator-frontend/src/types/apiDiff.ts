export type ViewMode = 'split' | 'unified';
export type DiffFilter = 'all' | 'breaking' | 'added' | 'deleted' | 'modified';
export type ChangeKind = 'added' | 'removed' | 'modified' | 'unchanged' | 'breaking';
export type Severity = 'PASS' | 'WARN' | 'FAIL' | 'ERROR';

export interface SchemaField {
  type?: string;
  format?: string;
  required?: boolean;
  [key: string]: unknown;
}

export interface RequestBodySpec {
  content_type?: string;
  schema?: {
    required?: string[];
    properties?: Record<string, SchemaField>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ResponseSpec {
  content_type?: string;
  schema?: {
    required?: string[];
    properties?: Record<string, SchemaField>;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ResponseTimeSpec {
  p50_ms?: number;
  p95_ms?: number;
  p99_ms?: number;
  [key: string]: unknown;
}

export interface ApiEndpointSpec {
  id: string;
  name: string;
  method: string;
  path: string;
  tags?: string[];
  path_params?: Record<string, SchemaField>;
  query_params?: Record<string, SchemaField>;
  request_body?: RequestBodySpec | null;
  responses?: Record<string, ResponseSpec>;
  response_time?: ResponseTimeSpec | null;
  [key: string]: unknown;
}

export interface FaultDetail {
  code: string;
  severity: Severity;
  field_path: string;
  original: unknown;
  migrated: unknown;
  message: string;
}

export interface ApiComparisonResult {
  id: string;
  name: string;
  method: string;
  path: string;
  status: Severity;
  faults: FaultDetail[];
  fault_count: Record<string, number>;
}

export interface ComparisonReport {
  job_id: string;
  created_at: string;
  total_apis: number;
  passed: number;
  warned: number;
  failed: number;
  errors: number;
  pass_rate: number;
  results: ApiComparisonResult[];
}

export interface ParsedSpecDocument {
  fileName: string;
  source: 'json' | 'yaml' | 'openapi' | 'internal';
  endpoints: ApiEndpointSpec[];
  raw: unknown;
}

export interface DiffEntry {
  id: string;
  base?: ApiEndpointSpec;
  comparator?: ApiEndpointSpec;
  report?: ApiComparisonResult;
  changeKind: ChangeKind;
}
