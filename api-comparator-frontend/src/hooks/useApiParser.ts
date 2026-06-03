import { useCallback } from 'react';
import YAML from 'yaml';
import type { ApiEndpointSpec, ParsedSpecDocument, ResponseSpec, SchemaField } from '../types/apiDiff';

const OPENAPI_METHODS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function extractSchema(content: Record<string, unknown>): Record<string, unknown> {
  for (const [mediaType, mediaValue] of Object.entries(content)) {
    if (isRecord(mediaValue) && isRecord(mediaValue.schema)) {
      return {
        ...mediaValue.schema,
        content_type: mediaType,
      };
    }
  }
  return {};
}

function normalizeParameter(parameter: Record<string, unknown>): SchemaField {
  const schema = isRecord(parameter.schema) ? parameter.schema : {};
  const normalized: SchemaField = {
    type: typeof schema.type === 'string' ? schema.type : undefined,
    format: typeof schema.format === 'string' ? schema.format : undefined,
    required: Boolean(parameter.required),
  };

  return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== undefined)) as SchemaField;
}

function normalizeOpenApiSpec(spec: Record<string, unknown>): ApiEndpointSpec[] {
  const endpoints: ApiEndpointSpec[] = [];
  const paths = isRecord(spec.paths) ? spec.paths : {};

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) {
      continue;
    }

    const pathLevelParams = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!OPENAPI_METHODS.has(method.toLowerCase()) || !isRecord(operation)) {
        continue;
      }

      const operationParams = [...pathLevelParams, ...(Array.isArray(operation.parameters) ? operation.parameters : [])];
      const pathParams: Record<string, SchemaField> = {};
      const queryParams: Record<string, SchemaField> = {};

      for (const parameter of operationParams) {
        if (!isRecord(parameter)) {
          continue;
        }

        const paramName = typeof parameter.name === 'string' ? parameter.name : null;
        const paramIn = typeof parameter.in === 'string' ? parameter.in : null;

        if (!paramName || !paramIn || !['path', 'query'].includes(paramIn)) {
          continue;
        }

        const normalized = normalizeParameter(parameter);
        if (paramIn === 'path') {
          pathParams[paramName] = normalized;
        } else {
          queryParams[paramName] = normalized;
        }
      }

      let requestBody: ApiEndpointSpec['request_body'] = null;
      if (isRecord(operation.requestBody)) {
        const content = isRecord(operation.requestBody.content) ? operation.requestBody.content : {};
        const schema = extractSchema(content);
        if (Object.keys(schema).length > 0) {
          const { content_type: contentType, ...restSchema } = schema;
          requestBody = {
            content_type: typeof contentType === 'string' ? contentType : undefined,
            schema: restSchema,
          };
        }
      }

      const responses: Record<string, ResponseSpec> = {};
      const responseEntries = isRecord(operation.responses) ? operation.responses : {};
      for (const [statusCode, response] of Object.entries(responseEntries)) {
        if (!isRecord(response)) {
          continue;
        }
        const content = isRecord(response.content) ? response.content : {};
        const schema = extractSchema(content);
        if (Object.keys(schema).length > 0) {
          const { content_type: contentType, ...restSchema } = schema;
          responses[statusCode] = {
            content_type: typeof contentType === 'string' ? contentType : undefined,
            schema: restSchema as ResponseSpec['schema'],
          };
        } else {
          responses[statusCode] = response as ResponseSpec;
        }
      }

      const endpointId =
        (typeof operation.operationId === 'string' && operation.operationId) ||
        (typeof operation['x-endpoint-id'] === 'string' && operation['x-endpoint-id']) ||
        `${method.toUpperCase()} ${path}`;

      endpoints.push({
        id: endpointId,
        name: (typeof operation.summary === 'string' && operation.summary) || endpointId,
        method: method.toUpperCase(),
        path,
        path_params: pathParams,
        query_params: queryParams,
        request_body: requestBody,
        responses,
        response_time: (isRecord(operation['x-response-time']) && operation['x-response-time']) ||
          (isRecord(operation.response_time) && operation.response_time) ||
          null,
        tags: Array.isArray(operation.tags) ? operation.tags.filter((tag): tag is string => typeof tag === 'string') : [],
      });
    }
  }

  return endpoints;
}

function normalizeInternalSpec(parsed: unknown): ApiEndpointSpec[] {
  if (Array.isArray(parsed)) {
    return parsed as ApiEndpointSpec[];
  }

  if (isRecord(parsed)) {
    if (Array.isArray(parsed.endpoints)) {
      return parsed.endpoints as ApiEndpointSpec[];
    }

    if (Array.isArray(parsed.items)) {
      return parsed.items as ApiEndpointSpec[];
    }

    if (typeof parsed.id === 'string') {
      return [parsed as ApiEndpointSpec];
    }
  }

  return [];
}

function parseTextPayload(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Uploaded file is empty.');
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return YAML.parse(trimmed);
  }
}

function normalizeDocument(parsed: unknown, fileName: string): ParsedSpecDocument {
  const source: ParsedSpecDocument['source'] = isRecord(parsed) && 'paths' in parsed
    ? 'openapi'
    : Array.isArray(parsed) || isRecord(parsed)
      ? 'internal'
      : 'json';

  const endpoints = isRecord(parsed) && 'paths' in parsed
    ? normalizeOpenApiSpec(parsed)
    : normalizeInternalSpec(parsed);

  return {
    fileName,
    source,
    endpoints,
    raw: parsed,
  };
}

export async function parseSpecFile(file: File): Promise<ParsedSpecDocument> {
  const text = await file.text();
  return normalizeDocument(parseTextPayload(text), file.name);
}

export function parseSpecText(text: string, fileName = 'payload.json'): ParsedSpecDocument {
  return normalizeDocument(parseTextPayload(text), fileName);
}

export function useApiParser() {
  const parse = useCallback(async (file: File) => parseSpecFile(file), []);
  const parseText = useCallback((text: string, fileName?: string) => parseSpecText(text, fileName), []);

  return { parseSpecFile: parse, parseSpecText: parseText };
}
