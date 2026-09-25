import { useCallback, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { EndpointArg, QueryParam } from '../../../../types/connection';
import { buildQueryFromParams, buildQueryParamsFromEndpoint, decodeQueryParamValue,
	ensureTemplateRow, getInlineVisualLength, splitEndpoint } from '../urlEditor.utils';
import { setFocusByCaretPositionInDivEditable } from '../utils/contentEditable';
import { extractTokenIds } from './urlEditor.data';
import type { QueryCaretTarget } from './UrlEditor.types';

type Params = {
	endpointRaw: string;
	queryParams: QueryParam[];
	createArgToken: (reference: string, ids: string[]) => { token: string };
	saveAll: (endpoint: string, rows: QueryParam[], args: Record<string, EndpointArg>) => void;
	setEndpointRaw: Dispatch<SetStateAction<string>>;
	setQueryParams: Dispatch<SetStateAction<QueryParam[]>>;
	setReferenceOpen: Dispatch<SetStateAction<boolean>>;
	endpointDivRef: RefObject<HTMLDivElement | null>;
	endpointArgsRef: RefObject<Record<string, EndpointArg>>;
	rawRef: RefObject<string>;
	lastCaretRef: RefObject<number>;
	lastRawCaretRef: RefObject<number>;
	selectedTokenRef: RefObject<number | null>;
	queryCaretTargetRef: RefObject<QueryCaretTarget | null>;
	lastDispatchedRef: RefObject<string | null>;
};

export function useUrlReferenceInsertion(params: Params) {
	const { endpointRaw, queryParams, createArgToken, saveAll, setEndpointRaw,
		setQueryParams, setReferenceOpen, endpointDivRef, endpointArgsRef, rawRef,
		lastCaretRef, lastRawCaretRef, selectedTokenRef, queryCaretTargetRef,
		lastDispatchedRef } = params;
	return useCallback((reference: string) => {
		const target = queryCaretTargetRef.current;
		const row = target && queryParams.find((item) => item.id === target.rowId);
		if (target && row) {
			const stored = String(row[target.field] ?? '');
			const decoded = target.field === 'value' ? decodeQueryParamValue(stored) : stored;
			const current = target.field === 'value' && !extractTokenIds(stored).length
				&& extractTokenIds(decoded).length ? decoded : stored;
			const { token } = createArgToken(reference, extractTokenIds(current));
			const insertAt = Math.max(0, Math.min(target.caret, current.length));
			const nextValue = `${current.slice(0, insertAt)}${token}${current.slice(insertAt)}`;
			const rows = ensureTemplateRow(queryParams.map((item) => item.id === target.rowId
				? { ...item, [target.field]: nextValue, enabled: true } : item));
			const { base } = splitEndpoint(rawRef.current || endpointRaw || '');
			const query = buildQueryFromParams(rows, true);
			const next = query ? `${base}?${query}` : base;
			queryCaretTargetRef.current = { ...target, caret: insertAt + token.length };
			rawRef.current = next; setEndpointRaw(next); setQueryParams(rows);
			lastDispatchedRef.current = next;
			saveAll(next, rows, endpointArgsRef.current);
			setReferenceOpen(false);
			return;
		}

		const current = rawRef.current || endpointRaw || '';
		const { token } = createArgToken(reference, extractTokenIds(current));
		const insertAt = Math.max(0, Math.min(lastRawCaretRef.current, current.length));
		const next = `${current.slice(0, insertAt)}${token}${current.slice(insertAt)}`;
		const rawCaret = insertAt + token.length;
		const caret = getInlineVisualLength(next.slice(0, rawCaret), endpointArgsRef.current);
		selectedTokenRef.current = null;
		lastCaretRef.current = caret; lastRawCaretRef.current = rawCaret;
		rawRef.current = next; setEndpointRaw(next);
		const rows = buildQueryParamsFromEndpoint(next, queryParams) as QueryParam[];
		setQueryParams(rows); lastDispatchedRef.current = next;
		saveAll(next, rows, endpointArgsRef.current);
		setReferenceOpen(false);
		requestAnimationFrame(() => requestAnimationFrame(() =>
			setFocusByCaretPositionInDivEditable(endpointDivRef.current, caret)));
	}, [createArgToken, endpointRaw, queryParams, saveAll]);
}
