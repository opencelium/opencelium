import { createShortId } from '@shared/lib/createId';
import { PAYLOAD_REFERENCE_RE } from '../../api/connectionPayload.references';
import {
	buildQueryFromParams,
	buildQueryParamsFromEndpoint,
	splitEndpoint,
} from '../../components/request-editor/url-editor/urlQueryParams.utils';
import type { WorkflowBodyFormat, WorkflowMethodConfig } from '../../types/request-config.types';
import { isSecretField } from './playgroundConnection';

export type EditableRow = { id: string; key: string; value: string; enabled: boolean };

// Fixed: set by the API definition. Dynamic: filled from a reference or webhook, edited in
// Test values. Connection/Secret: filled from the connector. Editable: free for this test.
export type RowOrigin = 'fixed' | 'dynamic' | 'connection' | 'secret' | 'editable';

// Changes made for this test only; `undefined` means "as configured on the step".
export type RequestEdits = {
	method?: string;
	url?: string;
	headerRows?: EditableRow[];
	paramRows?: EditableRow[];
	body?: unknown;
	bodyFormat?: WorkflowBodyFormat;
};

const ARG_TOKEN_RE = /#\{%\s*[A-Za-z0-9_-]+\s*%}/;
const WEBHOOK_RE = /\$\{[^}]+\}/;
const CONNECTION_FIELD_RE = /(?<![$#])\{([A-Za-z_][\w.-]*)\}/g;

const isDynamicValue = (value: string) => ARG_TOKEN_RE.test(value) || WEBHOOK_RE.test(value)
	|| new RegExp(PAYLOAD_REFERENCE_RE.source).test(value);

export function readRowOrigin(row: Pick<EditableRow, 'key' | 'value'>, connectionFields: readonly string[],
	fixedHeaders: Record<string, string> = {}): RowOrigin {
	if (isDynamicValue(row.value)) return 'dynamic';
	const fields = Array.from(row.value.matchAll(CONNECTION_FIELD_RE), (match) => match[1])
		.filter((field) => connectionFields.includes(field));
	if (fields.some(isSecretField)) return 'secret';
	if (fields.length) return 'connection';
	return fixedHeaders[row.key] === row.value ? 'fixed' : 'editable';
}

export const isLockedOrigin = (origin: RowOrigin) => origin !== 'editable';

const ADDED_ROW_PREFIX = 'added';

export const createEmptyRow = (): EditableRow =>
	({ id: createShortId(ADDED_ROW_PREFIX), key: '', value: '', enabled: true });

// Rows the user added in this session; only these can be removed again and are never locked.
export const isAddedRow = (row: EditableRow) => row.id.startsWith(`${ADDED_ROW_PREFIX}-`);

export const headerRowsOf = (config: WorkflowMethodConfig): EditableRow[] =>
	Object.entries(config.headers ?? {}).map(([key, value]) => ({
		id: createShortId('header'), key, value: String(value ?? ''), enabled: true,
	}));

export const paramRowsOf = (config: WorkflowMethodConfig): EditableRow[] =>
	buildQueryParamsFromEndpoint<EditableRow>(config.url ?? '', [], false)
		.map((param) => ({ id: param.id, key: param.key, value: param.value, enabled: param.enabled }));

const rowsToHeaders = (rows: EditableRow[]) => Object.fromEntries(rows
	.filter((row) => row.enabled && row.key.trim())
	.map((row) => [row.key.trim(), row.value]));

const rowsToUrl = (url: string, rows: EditableRow[]) => {
	const { base } = splitEndpoint(url);
	const query = buildQueryFromParams(rows);
	return query ? `${base}?${query}` : base;
};

export function applyRequestEdits(config: WorkflowMethodConfig, edits: RequestEdits): WorkflowMethodConfig {
	const baseUrl = edits.url ?? config.url;
	const url = edits.paramRows ? rowsToUrl(baseUrl, edits.paramRows) : baseUrl;
	const isUrlEdited = edits.url !== undefined || edits.paramRows !== undefined;
	return {
		...config,
		...(edits.method ? { method: edits.method } : {}),
		...(edits.headerRows ? { headers: rowsToHeaders(edits.headerRows) } : {}),
		...(isUrlEdited ? { url, queryParams: buildQueryParamsFromEndpoint(url, config.queryParams) } : {}),
		...(edits.body !== undefined ? { body: edits.body } : {}),
		...(edits.bodyFormat ? { bodyFormat: edits.bodyFormat } : {}),
	};
}

export const hasRequestEdits = (edits: RequestEdits) =>
	Object.values(edits).some((value) => value !== undefined);
