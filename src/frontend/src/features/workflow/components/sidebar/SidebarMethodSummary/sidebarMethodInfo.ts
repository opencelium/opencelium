import type { InvokerOperation } from '@entities/invoker/model/types';

export type RequestBodyFormat = 'json' | 'xml' | 'form' | 'graphql';

export type SidebarMethodInfo = {
	httpMethod: string;
	endpoint: string;
	endpointPath: string;
	bodyFormat: RequestBodyFormat | null;
};

const BASE_URL_PLACEHOLDER = '{url}';
const BODYLESS_METHODS = new Set(['GET', 'DELETE', 'HEAD', 'OPTIONS']);

const toBodyFormat = (operation: InvokerOperation): RequestBodyFormat | null => {
	const body = operation.request?.body;
	if (!body) return null;
	if (body.data === 'graphql') return 'graphql';
	switch (body.format) {
		case 'json': return 'json';
		case 'xml': return 'xml';
		case 'x-www-form-urlencoded': return 'form';
		default: return null;
	}
};

// Every endpoint is rooted at the connector's base URL placeholder, so it says
// nothing about the method and only eats the row's width.
const toEndpointPath = (endpoint: string) =>
	endpoint.startsWith(BASE_URL_PLACEHOLDER) ? endpoint.slice(BASE_URL_PLACEHOLDER.length) || '/' : endpoint;

export const toSidebarMethodInfo = (operation: InvokerOperation): SidebarMethodInfo => {
	const httpMethod = (operation.request?.method ?? 'GET').toUpperCase();
	const endpoint = operation.request?.endpoint ?? '';
	return {
		httpMethod,
		endpoint,
		endpointPath: endpoint ? toEndpointPath(endpoint) : '',
		// The invoker declares a body format on every operation, GET included — showing
		// it where nothing is sent would suggest a body that doesn't exist.
		bodyFormat: BODYLESS_METHODS.has(httpMethod) ? null : toBodyFormat(operation),
	};
};
