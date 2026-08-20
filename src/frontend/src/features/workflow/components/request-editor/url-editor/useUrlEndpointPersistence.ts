import { useCallback, useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { useDispatch } from 'react-redux';
import type { EndpointArg, QueryParam } from '../../../types/connection';
import { updateEndpoint, updateQueryParams,
	upsertEndpointArg } from '../../../store/connection/connectionSlice';
import { buildQueryFromParams, splitEndpoint, stripTemplateRows } from './urlEditor.utils';

type Params = {
	methodId: string;
	readOnly?: boolean;
	endpointRaw: string;
	queryParams: QueryParam[];
	rawRef: RefObject<string>;
	queryParamsRef: RefObject<QueryParam[]>;
	endpointArgsRef: RefObject<Record<string, EndpointArg>>;
	lastDispatchedEndpointRef: RefObject<string | null>;
	setEndpointRaw: Dispatch<SetStateAction<string>>;
};

export function useUrlEndpointPersistence(params: Params) {
	const dispatch = useDispatch();
	const { methodId, readOnly, endpointRaw, queryParams, rawRef, queryParamsRef,
		endpointArgsRef, lastDispatchedEndpointRef, setEndpointRaw } = params;
	const saveAll = useCallback((endpoint: string, rows: QueryParam[],
		args: Record<string, EndpointArg>) => {
		if (readOnly) return;
		const { base } = splitEndpoint(endpoint);
		const query = buildQueryFromParams(rows, true);
		dispatch(updateEndpoint({ methodId, endpoint: query ? `${base}?${query}` : base } as any));
		dispatch(updateQueryParams({ methodId, queryParams: stripTemplateRows(rows) } as any));
		Object.entries(args || {}).forEach(([argId, patch]) => {
			if (patch) dispatch(upsertEndpointArg({ methodId, argId, patch } as any));
		});
	}, [dispatch, methodId, readOnly]);

	const saveAllNow = useCallback(() => {
		if (!readOnly) saveAll(rawRef.current || endpointRaw || '', queryParams, endpointArgsRef.current);
	}, [endpointArgsRef, endpointRaw, queryParams, rawRef, readOnly, saveAll]);

	const commitParamsToEndpoint = useCallback((rows: QueryParam[]) => {
		const { base } = splitEndpoint(rawRef.current || endpointRaw || '');
		const query = buildQueryFromParams(rows, true);
		const nextEndpoint = query ? `${base}?${query}` : base;
		rawRef.current = nextEndpoint;
		setEndpointRaw(nextEndpoint);
		lastDispatchedEndpointRef.current = nextEndpoint;
		saveAll(nextEndpoint, rows, endpointArgsRef.current);
	}, [endpointArgsRef, endpointRaw, lastDispatchedEndpointRef, rawRef, saveAll, setEndpointRaw]);

	useEffect(() => () => {
		if (!readOnly) saveAll(rawRef.current || '', queryParamsRef.current, endpointArgsRef.current);
	}, [endpointArgsRef, queryParamsRef, rawRef, readOnly, saveAll]);

	return { saveAll, saveAllNow, commitParamsToEndpoint };
}
