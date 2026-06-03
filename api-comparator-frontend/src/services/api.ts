import type { ComparisonReport } from '../types/apiDiff';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8000/api/v1';

function getBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? DEFAULT_BASE_URL;
}

async function parseErrorMessage(response: Response) {
  try {
    const data = await response.json();
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    if (data?.detail?.detail) {
      return data.detail.detail;
    }
    return JSON.stringify(data);
  } catch {
    return response.statusText || 'Request failed';
  }
}

export async function compareSpecs(original: File, migrated: File): Promise<ComparisonReport> {
  const formData = new FormData();
  formData.append('original', original);
  formData.append('migrated', migrated);

  const response = await fetch(`${getBaseUrl()}/compare`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<ComparisonReport>;
}

export async function getReport(jobId: string, format: 'json' | 'csv' | 'html' = 'json') {
  const response = await fetch(`${getBaseUrl()}/reports/${jobId}?format=${format}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return format === 'json' ? (response.json() as Promise<ComparisonReport>) : response.text();
}

export async function getHealth() {
  const response = await fetch(`${getBaseUrl().replace(/\/api\/v1$/, '')}/api/v1/health`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return response.json() as Promise<{ status: string; version: string }>;
}
