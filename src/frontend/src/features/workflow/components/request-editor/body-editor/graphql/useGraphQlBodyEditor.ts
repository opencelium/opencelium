import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useMethodContext } from '../../../../providers/MethodContext';
import { updatePayload } from '../../../../store/connection/connectionSlice';
import { useGraphQlFetcher } from './useGraphQlFetcher';

export function useGraphQlBodyEditor() {
	const { method } = useMethodContext();
	const dispatch = useDispatch();
	const fetcher = useGraphQlFetcher(method);
	const updateQuery = useCallback((query: string) => {
		dispatch(updatePayload({ methodId: method.id, newFields: { query },
			messageProperty: 'body' } as never));
	}, [dispatch, method.id]);
	const initialQuery = (method.request.body?.fields as { query?: string } | undefined)?.query ?? '';
	return { fetcher, updateQuery, initialQuery };
}
