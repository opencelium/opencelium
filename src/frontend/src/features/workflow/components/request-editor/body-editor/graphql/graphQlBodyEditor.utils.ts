import { apiExecutor } from '@shared/api/apiExecutor';
import type { Connector } from '@entities/connector/model/types';
import type { GraphQlQueryResult } from './graphQlTypes';

export const isGraphQlAccessDenied = (result: GraphQlQueryResult | undefined) => {
	const causes = result?.errors?.[0]?.extensions?.causes;
	return !!causes?.length && causes[0].error === 'AccessDeniedException';
};

const FETCH_ERROR_STATUSES: ReadonlySet<unknown> = new Set(['FETCH_ERROR', 'PARSING_ERROR',
	'TIMEOUT_ERROR', 'CUSTOM_ERROR']);

// Matches RTK Query's FetchBaseQueryError only — a bare `'status' in response` check would also
// match successful payloads that carry their own `status` field (Connector has status: 'UP' | ...).
export const isApiExecutorError = (response: unknown): boolean => {
	if (!response || typeof response !== 'object' || !('status' in response)) return false;
	const { status } = response;
	return typeof status === 'number' || FETCH_ERROR_STATUSES.has(status);
};

export const fetchGraphQlConnector = (id: string, masterPassword: string) =>
	apiExecutor({ url: `/connector/${encodeURIComponent(id)}`, method: 'GET', options: {
		...(masterPassword ? { headers: { 'x-master-password': masterPassword } } : {}),
		ignoreError: true,
	} }) as Promise<Connector | unknown>;
