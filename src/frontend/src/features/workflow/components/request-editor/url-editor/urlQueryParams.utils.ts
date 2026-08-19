import { buildInlineParts, createId } from './urlInlineTokens';

export type ParsedEndpoint = { base: string; queryRaw: string; hasQuestion: boolean };
export type QueryParamLite = {
	id: string;
	key: string;
	value: string;
	enabled: boolean;
	autoEncode?: boolean;
};

export const splitEndpoint = (endpoint: string): ParsedEndpoint => {
	const value = endpoint || '';
	const index = value.indexOf('?');
	return index === -1
		? { base: value, queryRaw: '', hasQuestion: false }
		: { base: value.slice(0, index), queryRaw: value.slice(index + 1), hasQuestion: true };
};

const parseQueryToPairs = (query: string) => (query ? query.split('&') : [])
	.filter(Boolean)
	.map((chunk) => {
		const separator = chunk.indexOf('=');
		return separator === -1
			? { key: chunk, value: '' }
			: { key: chunk.slice(0, separator), value: chunk.slice(separator + 1) };
	});

const transformQueryTextPreservingRefs = (value: string, transform: (part: string) => string) =>
	buildInlineParts(value || '').map((part) =>
		part.kind === 'arg' ? part.value : transform(part.value)).join('');

const safeDecodeURIComponent = (value: string) => {
	try { return decodeURIComponent((value || '').replace(/\+/g, ' ')); }
	catch { return value; }
};

export const decodeQueryParamValue = (value: string) =>
	transformQueryTextPreservingRefs(value, safeDecodeURIComponent);
export const encodeQueryParamValue = (value: string) =>
	transformQueryTextPreservingRefs(decodeQueryParamValue(value || ''), encodeURIComponent);

export const buildQueryFromParams = (params: QueryParamLite[], encoded = false) =>
	(params || []).filter((param) => param.enabled && param.key.trim() !== '')
		.map((param) => {
			const shouldEncode = encoded && param.autoEncode !== false;
			const key = shouldEncode ? encodeQueryParamValue(param.key || '') : param.key;
			const value = shouldEncode ? encodeQueryParamValue(param.value ?? '') : param.value ?? '';
			return `${key}=${value}`;
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
const isMockActiveRow = (param: QueryParamLite) =>
	param.key.trim().toLowerCase() === 'mock' &&
	String(param.value ?? '').trim().toLowerCase() === 'active';
export const stripMockActiveRows = <T extends QueryParamLite>(params: T[]) =>
	(params || []).filter((param) => !isMockActiveRow(param));

export function stripMockActiveFromEndpoint(endpointString: string) {
	const endpoint = splitEndpoint(endpointString || '');
	if (!endpoint.hasQuestion) return endpointString || '';
	const pairs = parseQueryToPairs(endpoint.queryRaw)
		.filter((pair) => !isMockActiveRow({ id: '', enabled: true, ...pair }));
	const query = pairs.map((pair) => `${pair.key}=${pair.value ?? ''}`).join('&');
	return query ? `${endpoint.base}?${query}` : endpoint.base;
}

export function buildQueryParamsFromEndpoint<T extends QueryParamLite>(
	endpointString: string,
	previous?: T[],
	includeTemplateRow = true,
): T[] {
	const pairs = parseQueryToPairs(splitEndpoint(
		stripMockActiveFromEndpoint(endpointString || '')).queryRaw);
	const meaningful = stripMockActiveRows(stripTemplateRows(previous || []));
	const params = pairs.filter((pair) =>
		!isMockActiveRow({ id: '', enabled: true, ...pair }))
		.map((pair, index) => ({
			id: meaningful[index]?.id || createId(),
			key: decodeQueryParamValue(pair.key),
			value: decodeQueryParamValue(pair.value),
			enabled: true,
			autoEncode: meaningful[index]?.autoEncode ?? true,
		} as T));
	return includeTemplateRow ? ensureTemplateRow(params) : params;
}

export function decodeEndpointQuery(endpointString: string) {
	const endpoint = splitEndpoint(endpointString || '');
	if (!endpoint.hasQuestion) return endpointString || '';
	const params = buildQueryParamsFromEndpoint<QueryParamLite>(endpointString, [], false);
	const query = params.map((param) => `${param.key}=${param.value ?? ''}`).join('&');
	return query ? `${endpoint.base}?${query}` : endpoint.base;
}
