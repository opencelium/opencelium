import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMethodContext } from '../../../../providers/MethodContext';
import type { RootState } from '../../../../store';
import type { QueryParam } from '../../../../types/connection';
import { updateRequestMethod } from '../../../../store/connection/connectionSlice';
import { buildQueryParamsFromEndpoint, decodeEndpointQuery, ensureTemplateRow,
	getInlineVisualLength, stripMockActiveFromEndpoint, stripMockActiveRows } from '../urlEditor.utils';
import { useUrlEndpointArgs } from '../useUrlEndpointArgs';
import { useUrlEndpointPersistence } from '../useUrlEndpointPersistence';
import { useUrlQueryParams } from '../useUrlQueryParams';
import { decodeStoredQueryParams } from './urlEditor.data';
import { useUrlEditorSync } from './useUrlEditorSync';
import { useUrlReferenceInsertion } from './useUrlReferenceInsertion';
import type { QueryCaretTarget } from './UrlEditor.types';

export function useUrlEditor(readOnly?: boolean) {
	const { method } = useMethodContext();
	const dispatch = useDispatch();
	const connection = useSelector((state: RootState) => state.connection.connection);
	const endpointDivRef = useRef<HTMLDivElement | null>(null);
	const lastCaretRef = useRef(0);
	const lastRawCaretRef = useRef(0);
	const selectedTokenRef = useRef<number | null>(null);
	const queryCaretTargetRef = useRef<QueryCaretTarget | null>(null);
	const lastDispatchedRef = useRef<string | null>(null);
	const initialEndpoint = decodeEndpointQuery(stripMockActiveFromEndpoint(method.request.endpoint || ''));
	const [endpointRaw, setEndpointRaw] = useState(initialEndpoint);
	const rawRef = useRef(initialEndpoint);
	const args = useUrlEndpointArgs({ methodId: method.id,
		initialArgs: { ...(method.request.endpointArgs || {}) }, readOnly });
	const [queryParams, setQueryParams] = useState<QueryParam[]>(() => {
		const stored = decodeStoredQueryParams(stripMockActiveRows(
			(method.request.queryParams || []).map((row) => ({ ...row }))) as QueryParam[]);
		return stored.length ? ensureTemplateRow(stored)
			: buildQueryParamsFromEndpoint(initialEndpoint) as QueryParam[];
	});
	const [referenceOpen, setReferenceOpen] = useState(false);
	const queryParamsRef = useRef(queryParams);
	useEffect(() => { queryParamsRef.current = queryParams; }, [queryParams]);
	const persistence = useUrlEndpointPersistence({ methodId: method.id, readOnly, endpointRaw,
		queryParams, rawRef, queryParamsRef, endpointArgsRef: args.endpointArgsRef,
		lastDispatchedEndpointRef: lastDispatchedRef, setEndpointRaw });
	const query = useUrlQueryParams({ queryParams, setQueryParams,
		commitParamsToEndpoint: persistence.commitParamsToEndpoint });
	useUrlEditorSync({ method, endpointRaw, setEndpointRaw, setQueryParams, setReferenceOpen,
		resetEndpointArgs: args.resetEndpointArgs, rawRef, endpointArgsRef: args.endpointArgsRef,
		lastCaretRef, lastRawCaretRef, selectedTokenRef, lastDispatchedRef });
	const applyReference = useUrlReferenceInsertion({ endpointRaw, queryParams,
		createArgToken: args.createArgToken, saveAll: persistence.saveAll, setEndpointRaw,
		setQueryParams, setReferenceOpen, endpointDivRef, endpointArgsRef: args.endpointArgsRef,
		rawRef, lastCaretRef, lastRawCaretRef, selectedTokenRef, queryCaretTargetRef,
		lastDispatchedRef });
	const onRawChange = useCallback((next: string) => {
		const previous = rawRef.current || '';
		if (next.length > previous.length && next.startsWith(previous)) {
			lastRawCaretRef.current = next.length;
			lastCaretRef.current = getInlineVisualLength(next, args.endpointArgsRef.current);
		}
		setEndpointRaw(next); rawRef.current = next;
		setQueryParams((rows) => buildQueryParamsFromEndpoint(next, rows) as QueryParam[]);
		lastDispatchedRef.current = null;
	}, [args.endpointArgsRef]);
	const onMethodChange = useCallback((value: string) => {
		if (!readOnly) dispatch(updateRequestMethod({ methodId: method.id, method: value } as any));
	}, [dispatch, method.id, readOnly]);
	return { method, connection, endpointRaw, endpointDivRef, lastCaretRef, lastRawCaretRef,
		selectedTokenRef, queryCaretTargetRef, endpointArgs: args.endpointArgs,
		endpointArgsRef: args.endpointArgsRef, queryParams, referenceOpen, setReferenceOpen,
		applyReference, onRawChange, onMethodChange, persistence, query };
}
