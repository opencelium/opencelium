import type { QueryParam } from '../../../../types/connection';

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const TOKEN_ID_RE = /#{%\s*([A-Za-z0-9_-]+)\s*%}/g;
export const extractTokenIds = (value: string) =>
	Array.from((value || '').matchAll(TOKEN_ID_RE), (match) => match[1]);

// Kept as written, like the endpoint: the rows are a view of the URL's query text.
export const readStoredQueryParams = (params: QueryParam[]) => params.map((param) => ({
	...param,
	key: param.key || '',
	value: param.value || '',
	autoEncode: param.autoEncode ?? true,
}));
