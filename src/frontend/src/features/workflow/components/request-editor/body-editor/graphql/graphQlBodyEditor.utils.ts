import { apiExecutor } from '@shared/api/apiExecutor';
import type { Connector } from '@entities/connector/model/types';
import type { GraphQlQueryResult } from './graphQlTypes';

export const isGraphQlAccessDenied = (result: GraphQlQueryResult | undefined) => {
	const causes = result?.errors?.[0]?.extensions?.causes;
	return !!causes?.length && causes[0].error === 'AccessDeniedException';
};

export const isApiExecutorError = (response: unknown) =>
	!!response && typeof response === 'object' && ('status' in response || 'error' in response);

export const fetchGraphQlConnector = (id: string, masterPassword: string) =>
	apiExecutor({ url: `/connector/${encodeURIComponent(id)}`, method: 'GET', options: {
		...(masterPassword ? { headers: { 'x-master-password': masterPassword } } : {}),
		ignoreError: true,
	} }) as Promise<Connector | unknown>;
