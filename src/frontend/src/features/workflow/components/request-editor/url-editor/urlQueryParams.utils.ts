import { createId } from './urlInlineTokens';

export type ParsedEndpoint = { base: string; queryRaw: string; hasQuestion: boolean };

// `isFlag` marks a query part without `=` (`?pretty`, or `?{%…%}` that is only a
// reference): it is written back without `=` as long as it has no value.
export type QueryParamLite = {
	id: string;
	key: string;
	value: string;
	enabled: boolean;
	autoEncode?: boolean;
	isFlag?: boolean;
};

export const splitEndpoint = (endpoint: string): ParsedEndpoint => {
	const value = endpoint || '';
	const index = value.indexOf('?');
	return index === -1
		? { base: value, queryRaw: '', hasQuestion: false }
		: { base: value.slice(0, index), queryRaw: value.slice(index + 1), hasQuestion: true };
};

type QueryPair = { key: string; value: string; isFlag: boolean };

const parseQueryToPairs = (query: string): QueryPair[] => (query ? query.split('&') : [])
	.filter(Boolean)
	.map((chunk) => {
		const separator = chunk.indexOf('=');
		return separator === -1
			? { key: chunk, value: '', isFlag: true }
			: { key: chunk.slice(0, separator), value: chunk.slice(separator + 1), isFlag: false };
	});

const formatPair = ({ key, value, isFlag }: { key: string; value: string; isFlag?: boolean }) =>
	isFlag && !value ? key : `${key}=${value}`;

// Editor reference tokens, wrapped references, webhook `${…}`, pagination `@{…}` and
// connector `{field}` / `{#id.field}`: the backend resolves and encodes them, so
// their text must reach it untouched.
const PLACEHOLDER_RE = /(#\{%\s*[A-Za-z0-9_-]+\s*%\}|\{%[\s\S]*?%\}|\$\{[^{}]*\}|@\{[^{}]*\}|\{#?[A-Za-z0-9_.-]+\})/;

const escapeOutsidePlaceholders = (text: string, characters: RegExp) => text
	.split(PLACEHOLDER_RE)
	.map((part, index) => index % 2 === 1 ? part : part.replace(characters, encodeURIComponent))
	.join('');

// The backend sends typed text as written and encodes only what a URL cannot hold;
// `& = # +` stay URL structure. "Encode before sending" therefore escapes just the
// characters that would split a table row into different query parts.
export const encodeQueryKey = (key: string) => escapeOutsidePlaceholders(key, /[&=#]/g);
export const encodeQueryValue = (value: string) => escapeOutsidePlaceholders(value, /[&#]/g);

export const buildQueryFromParams = (params: QueryParamLite[], encoded = false) =>
	(params || []).filter((param) => param.enabled && param.key.trim() !== '')
		.map((param) => {
			const shouldEncode = encoded && param.autoEncode !== false;
			const key = shouldEncode ? encodeQueryKey(param.key || '') : param.key;
			const value = shouldEncode ? encodeQueryValue(param.value ?? '') : param.value ?? '';
			return formatPair({ key, value, isFlag: param.isFlag });
		}).join('&');

export function ensureTemplateRow<T extends QueryParamLite>(params: T[]): T[] {
	const last = params[params.length - 1];
	const isTemplate = !!last && !last.enabled && !last.key.trim() && !last.value.trim();
	return isTemplate ? params : [...(params.length ? params : []),
		({ id: createId(), key: '', value: '', enabled: false } as T)];
}

export const isTemplateRow = (param: QueryParamLite) =>
	!param.enabled && !param.key.trim() && !param.value.trim();
export const stripTemplateRows = <T extends QueryParamLite>(params: T[]) =>
	(params || []).filter((param) => !isTemplateRow(param) && param.key.trim() !== '');
const isMockActiveRow = (param: Pick<QueryParamLite, 'key' | 'value'>) =>
	param.key.trim().toLowerCase() === 'mock' &&
	String(param.value ?? '').trim().toLowerCase() === 'active';
export const stripMockActiveRows = <T extends QueryParamLite>(params: T[]) =>
	(params || []).filter((param) => !isMockActiveRow(param));

export function stripMockActiveFromEndpoint(endpointString: string) {
	const endpoint = splitEndpoint(endpointString || '');
	if (!endpoint.hasQuestion) return endpointString || '';
	const pairs = parseQueryToPairs(endpoint.queryRaw);
	if (!pairs.some(isMockActiveRow)) return endpointString || '';
	const query = pairs.filter((pair) => !isMockActiveRow(pair)).map(formatPair).join('&');
	return query ? `${endpoint.base}?${query}` : endpoint.base;
}

// Rows hold the query text exactly as written in the URL: decoding it for display
// would make `a%26b` read as two parameters and turn `%2B` into a space.
export function buildQueryParamsFromEndpoint<T extends QueryParamLite>(
	endpointString: string,
	previous?: T[],
	includeTemplateRow = true,
): T[] {
	const pairs = parseQueryToPairs(splitEndpoint(
		stripMockActiveFromEndpoint(endpointString || '')).queryRaw);
	const meaningful = stripMockActiveRows(stripTemplateRows(previous || []));
	const params = pairs.map((pair, index) => ({
		id: meaningful[index]?.id || createId(),
		key: pair.key,
		value: pair.value,
		enabled: true,
		autoEncode: meaningful[index]?.autoEncode ?? true,
		...(pair.isFlag ? { isFlag: true } : {}),
	} as T));
	return includeTemplateRow ? ensureTemplateRow(params) : params;
}
