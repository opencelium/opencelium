import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { EndpointArg, MethodWithId, QueryParam } from '../../../../types/connection';
import { buildQueryParamsFromEndpoint, decodeEndpointQuery, ensureTemplateRow,
	getInlineVisualLength, stripMockActiveFromEndpoint,
	stripMockActiveRows } from '../urlEditor.utils';
import { decodeStoredQueryParams } from './urlEditor.data';

type Params = {
	method: MethodWithId;
	endpointRaw: string;
	setEndpointRaw: Dispatch<SetStateAction<string>>;
	setQueryParams: Dispatch<SetStateAction<QueryParam[]>>;
	setReferenceOpen: Dispatch<SetStateAction<boolean>>;
	resetEndpointArgs: (args: Record<string, EndpointArg>) => void;
	rawRef: RefObject<string>;
	endpointArgsRef: RefObject<Record<string, EndpointArg>>;
	lastCaretRef: RefObject<number>;
	lastRawCaretRef: RefObject<number>;
	selectedTokenRef: RefObject<number | null>;
	lastDispatchedRef: RefObject<string | null>;
};

export function useUrlEditorSync(params: Params) {
	const { method, endpointRaw, setEndpointRaw, setQueryParams, setReferenceOpen,
		resetEndpointArgs, rawRef, endpointArgsRef, lastCaretRef, lastRawCaretRef,
		selectedTokenRef, lastDispatchedRef } = params;
	useEffect(() => { rawRef.current = endpointRaw; }, [endpointRaw, rawRef]);

	useEffect(() => {
		const endpoint = decodeEndpointQuery(stripMockActiveFromEndpoint(method.request.endpoint || ''));
		const args = { ...(method.request.endpointArgs || {}) };
		resetEndpointArgs(args);
		setEndpointRaw(endpoint);
		rawRef.current = endpoint;
		const stored = decodeStoredQueryParams(stripMockActiveRows(
			(method.request.queryParams || []).map((param) => ({ ...param }))) as QueryParam[]);
		setQueryParams(stored.length ? ensureTemplateRow(stored)
			: buildQueryParamsFromEndpoint(endpoint) as QueryParam[]);
		lastCaretRef.current = getInlineVisualLength(endpoint, args);
		lastRawCaretRef.current = endpoint.length;
		selectedTokenRef.current = null;
		setReferenceOpen(false);
		lastDispatchedRef.current = null;
	}, [method.id, resetEndpointArgs]);

	useEffect(() => {
		const incoming = decodeEndpointQuery(stripMockActiveFromEndpoint(method.request.endpoint || ''));
		if (incoming === endpointRaw) return;
		if (lastDispatchedRef.current
			&& incoming === decodeEndpointQuery(lastDispatchedRef.current)) {
			setEndpointRaw(incoming); rawRef.current = incoming; return;
		}
		setEndpointRaw(incoming); rawRef.current = incoming;
		setQueryParams((previous) => buildQueryParamsFromEndpoint(incoming, previous) as QueryParam[]);
		lastCaretRef.current = getInlineVisualLength(incoming, endpointArgsRef.current);
		lastRawCaretRef.current = incoming.length;
		selectedTokenRef.current = null;
	}, [method.request.endpoint]);
}
