import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useMethodContext } from '../../../../providers/MethodContext';
import { updatePayload } from '../../../../store/connection/connectionSlice';
import { useGraphQlConnectorAuth } from './useGraphQlConnectorAuth';
import { useGraphQlFetcher } from './useGraphQlFetcher';

export function useGraphQlBodyEditor() {
	const { method } = useMethodContext();
	const dispatch = useDispatch();
	const auth = useGraphQlConnectorAuth(method.connector?.connectorId);
	const fetcher = useGraphQlFetcher(auth.connector, auth.accessToken, auth.login);
	const updateQuery = useCallback((query: string) => {
		dispatch(updatePayload({ methodId: method.id, newFields: { query },
			messageProperty: 'body' } as never));
	}, [dispatch, method.id]);
	const initialQuery = (method.request.body?.fields as { query?: string } | undefined)?.query ?? '';
	return { status: auth.status, errorKey: auth.errorKey, fetcher, updateQuery,
		initialQuery, retry: auth.retry };
}

export type { GraphQlBodyEditorStatus } from './graphQlBodyEditor.types';
