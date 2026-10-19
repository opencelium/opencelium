import type { QueryParam } from '../../../../types/connection';
import { decodeQueryParamValue } from '../urlEditor.utils';

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const TOKEN_ID_RE = /#{%\s*([A-Za-z0-9_-]+)\s*%}/g;
export const extractTokenIds = (value: string) =>
	Array.from((value || '').matchAll(TOKEN_ID_RE), (match) => match[1]);

export const decodeStoredQueryParams = (params: QueryParam[]) => params.map((param) => ({
	...param,
	key: decodeQueryParamValue(param.key || ''),
	value: decodeQueryParamValue(param.value || ''),
	autoEncode: param.autoEncode ?? true,
}));
