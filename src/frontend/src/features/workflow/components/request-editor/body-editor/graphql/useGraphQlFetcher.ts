import { useCallback, useRef } from 'react';
import type { Fetcher, FetcherParams } from '@graphiql/toolkit';
import type { Connector } from '@entities/connector/model/types';
import type { GraphQlLogin } from './graphQlBodyEditor.types';
import { isGraphQlAccessDenied } from './graphQlBodyEditor.utils';
import { resolveGraphQlAuthStrategy } from './strategies/resolveGraphQlAuthStrategy';

export function useGraphQlFetcher(connector: Connector | null, accessToken: string,
	login: GraphQlLogin) {
	const hasRetriedRef = useRef(false);
	return useCallback<Fetcher>(async (params: FetcherParams) => {
		if (!connector) return {};
		const runQuery = (token: string) => resolveGraphQlAuthStrategy(connector).query({
			url: connector.requestData?.url ?? '', accessToken: token, sslOn: connector.sslCert,
			query: params.query,
			variables: params.variables as Record<string, unknown> | undefined,
			operationName: params.operationName,
		});
		const outcome = await runQuery(accessToken);
		if (!outcome.ok) return { errors: [{ message: 'Request failed' }] };
		if (isGraphQlAccessDenied(outcome.result) && !hasRetriedRef.current) {
			hasRetriedRef.current = true;
			const freshToken = await login(connector);
			hasRetriedRef.current = false;
			if (!freshToken) return outcome.result as never;
			const retryOutcome = await runQuery(freshToken);
			return (retryOutcome.ok ? retryOutcome.result
				: { errors: [{ message: 'Request failed' }] }) as never;
		}
		return outcome.result as never;
	}, [accessToken, connector, login]);
}
