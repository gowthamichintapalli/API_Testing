import type { APIResponse } from '@playwright/test';

export type ApiObservation = {
  status: number;
  contentType: string;
  responseFormat: 'Valid JSON' | 'Invalid JSON' | 'Empty response body';
  body: unknown;
  topLevelKeys: string[];
  fieldTypes: string[];
  nullKeys: string[];
  emptyStringKeys: string[];
  emptyArrayKeys: string[];
  emptyObjectKeys: string[];
};

export type ObservationReport = {
  testId: string;
  scenario: string;
  method: string;
  endpoint: string;
  inputs?: string;
  observation?: ApiObservation;
  requestError?: string;
  details?: string[];
};

export function formatObservationReport(report: ObservationReport): string {
  const lines = [
    '======================================================',
    `${report.testId} - OBSERVED`,
    `Scenario          : ${report.scenario}`,
    `Method            : ${report.method}`,
    `Endpoint          : ${report.endpoint}`,
  ];

  if (report.inputs) lines.push(`Inputs            : ${report.inputs}`);

  if (!report.observation) {
    lines.push(
      'Status code       : No response',
      `Request error     : ${report.requestError || 'No response received'}`,
    );
  } else {
    const observation = report.observation;
    const orderId = getOrderId(observation.body);
    lines.push(
      `Status code       : ${observation.status}`,
      ...(orderId ? [`Order ID          : ${orderId}`] : []),
      `Content-Type      : ${observation.contentType}`,
      `Response format   : ${observation.responseFormat}`,
      `Success / errors  : ${getNamedValues(observation.body, new Set(['success', 'error', 'message'])).join(' | ') || 'Not present'}`,
      `Empty strings     : [${observation.emptyStringKeys.join(', ')}]`,
      `Empty arrays      : [${observation.emptyArrayKeys.join(', ')}]`,
      `Empty objects     : [${observation.emptyObjectKeys.join(', ')}]`,
      'Missing keys      : [] (not assessed; no documented response schema is configured)',
      `Null keys         : [${observation.nullKeys.join(', ')}]`,
    );
  }

  if (report.details) lines.push(...report.details);
  if (report.requestError && report.observation) {
    lines.push(`Additional error  : ${report.requestError}`);
  }
  lines.push('======================================================');
  return lines.join('\n');
}

export async function observeResponse(response: APIResponse): Promise<ApiObservation> {
  const text = await response.text();
  let body: unknown = text;
  let responseFormat: ApiObservation['responseFormat'];

  if (!text.trim()) {
    body = null;
    responseFormat = 'Empty response body';
  } else {
    try {
      body = JSON.parse(text);
      responseFormat = 'Valid JSON';
    } catch {
      responseFormat = 'Invalid JSON';
    }
  }

  const observation: ApiObservation = {
    status: response.status(),
    contentType: response.headers()['content-type'] ?? 'Not provided',
    responseFormat,
    body,
    topLevelKeys: getTopLevelKeys(body),
    fieldTypes: [],
    nullKeys: [],
    emptyStringKeys: [],
    emptyArrayKeys: [],
    emptyObjectKeys: [],
  };

  collectValues(body, '', observation);
  return observation;
}

export function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function getNamedValues(value: unknown, targetKeys: Set<string>): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => getNamedValues(item, targetKeys));
  }
  if (typeof value !== 'object' || value === null) return [];

  const values: string[] = [];
  for (const [key, child] of Object.entries(value)) {
    if (targetKeys.has(key.toLowerCase())) {
      values.push(`${key}=${JSON.stringify(child)}`);
    }
    values.push(...getNamedValues(child, targetKeys));
  }
  return values;
}

export function getOrderId(value: unknown): string {
  const paths = [
    ['data', 'data', 'orders', '0', 'ord_id'],
    ['data', 'orders', '0', 'ord_id'],
    ['data', 'orders', '0', 'order_id'],
    ['data', 'orders', '0', 'ord_id_uuid'],
    ['data', 'data', 'order_ids', '0'],
    ['data', 'data', 'confirmation_id'],
    ['data', 'order_id_ref'],
    ['data', 'orderId'],
    ['data', 'order_id'],
    ['order_id_ref'],
    ['orderId'],
    ['order_id'],
  ];

  for (const path of paths) {
    let current: unknown = value;
    for (const segment of path) {
      if (Array.isArray(current) && /^\d+$/.test(segment)) {
        current = current[Number(segment)];
      } else if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[segment];
      } else {
        current = undefined;
        break;
      }
    }
    if (current !== undefined && current !== null && current !== '') {
      return String(current);
    }
  }

  return '';
}

export function extractRecords(value: unknown): unknown[] | undefined {
  if (Array.isArray(value)) return value;
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) {
      const records = extractRecords(child);
      if (records) return records;
    }
  }
  return undefined;
}

export function getRecordIdentifiers(records: unknown[] | undefined): string[] {
  return (records ?? []).map((record, index) => {
    if (typeof record !== 'object' || record === null || Array.isArray(record)) {
      return `${index}: no object identifier`;
    }
    const identifiers = Object.entries(record)
      .filter(([key]) => /^(ord_id|ord_id_uuid|order_id|order_id_ref|court_?id|id|uuid)$/i.test(key))
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`);
    return `${index}: ${identifiers.join(', ') || 'no recognized identifier'}`;
  });
}

export function getPaginationValues(value: unknown, path = ''): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((child, index) => getPaginationValues(child, `${path}[${index}]`));
  }
  if (typeof value !== 'object' || value === null) return [];

  return Object.entries(value).flatMap(([key, child]) => {
    const childPath = path ? `${path}.${key}` : key;
    const current = /page|perpage|total|count|limit|offset/i.test(key)
      ? [`${childPath}=${JSON.stringify(child)}`]
      : [];
    return [...current, ...getPaginationValues(child, childPath)];
  });
}

export function summarizeRequestBody(body: Record<string, unknown>): string {
  return flattenFields(body)
    .filter(({ key }) => key.toLowerCase() !== 'token')
    .map(({ path, key, value }) => {
      if (/ssn|dob|name|address|phone|email/i.test(key)) {
        return `${path}=<redacted>`;
      }
      return `${path}=${JSON.stringify(value)}`;
    })
    .join(', ');
}

export function compareRequestFields(
  requestBody: unknown,
  responseBody: unknown,
): string[] {
  const submittedFields = flattenFields(requestBody);
  const returnedFields = flattenFields(responseBody);

  return submittedFields.map(({ path, key, value }) => {
    if (key.toLowerCase() === 'token') {
      return `${path}: sensitive field omitted from comparison`;
    }

    const matches = returnedFields.filter((field) => field.key === key);
    if (matches.length === 0) {
      return `${path}: not present in response; persistence/handling is inconclusive`;
    }

    const matchingValue = matches.find(
      (field) => JSON.stringify(field.value) === JSON.stringify(value),
    );
    if (matchingValue) {
      return `${path}: matching value found (${formatFieldValue(key, matchingValue.value)})`;
    }
    if (matches.some((field) => field.value === null)) {
      return `${path}: response contains null for this field`;
    }
    if (matches.some((field) => field.value === '')) {
      return `${path}: response contains an empty string for this field`;
    }
    const differingValue = matches.find((field) => field.value !== undefined);
    return `${path}: response contains a different value (${formatFieldValue(key, differingValue?.value)})`;
  });
}

function formatFieldValue(key: string, value: unknown): string {
  if (/token|ssn|dob|name|address|phone|email/i.test(key)) return '<redacted>';
  return JSON.stringify(value);
}

function getTopLevelKeys(value: unknown): string[] {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return Object.keys(value);
  }
  return [];
}

function collectValues(value: unknown, path: string, result: ApiObservation): void {
  result.fieldTypes.push(`${path || '(root)'}: ${getValueType(value)}`);

  if (value === null) {
    result.nullKeys.push(path.split(/[.[\]]/).filter(Boolean).pop() || '(root)');
    return;
  }
  if (value === '') {
    result.emptyStringKeys.push(path.split(/[.[\]]/).filter(Boolean).pop() || '(root)');
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) result.emptyArrayKeys.push(path || '(root)');
    value.forEach((child, index) => collectValues(child, `${path}[${index}]`, result));
    return;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) result.emptyObjectKeys.push(path || '(root)');
    for (const [key, child] of entries) {
      collectValues(child, path ? `${path}.${key}` : key, result);
    }
  }
}

function flattenFields(value: unknown, path = ''): Array<{ path: string; key: string; value: unknown }> {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      const key = path.split(/[.[\]]/).filter(Boolean).pop() ?? path;
      return [{ path, key, value }];
    }
    return value.flatMap((child, index) => flattenFields(child, `${path}[${index}]`));
  }
  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      const key = path.split(/[.[\]]/).filter(Boolean).pop() ?? path;
      return [{ path, key, value }];
    }
    return entries.flatMap(([key, child]) =>
      flattenFields(child, path ? `${path}.${key}` : key),
    );
  }
  const key = path.split(/[.[\]]/).filter(Boolean).pop() ?? path;
  return [{ path, key, value }];
}
