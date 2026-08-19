import { useCallback, useEffect, type RefObject } from 'react';
import { buildInlineHtml, computeRawInsertAtFromVisualCaret, getInlineVisualLength,
	parseHtmlToRaw } from '../urlEditor.utils';
import { setFocusByCaretPositionInDivEditable } from '../utils/contentEditable';
import type { UrlEndpointFieldProps } from './UrlEndpointField.types';
import { ENDPOINT_REFERENCE_CLASS } from './urlEndpointField.utils';

export function useUrlEndpointRender(props: UrlEndpointFieldProps,
	lastRendered: RefObject<string>, typing: RefObject<boolean>) {
	const { readOnly, value, endpointArgs, endpointArgsRef, divRef, lastCaretRef,
		lastRawCaretRef, selectedTokenIndexRef } = props;

	useEffect(() => { endpointArgsRef.current = endpointArgs; }, [endpointArgs, endpointArgsRef]);

	const render = useCallback((raw: string, caretOverride?: number) => {
		const root = divRef.current;
		if (!root) return;
		lastRendered.current = raw;
		root.innerHTML = buildInlineHtml(raw, endpointArgsRef.current,
			{ className: ENDPOINT_REFERENCE_CLASS, cursorPointer: true });
		const end = getInlineVisualLength(raw, endpointArgsRef.current);
		const caret = typeof caretOverride === 'number' && caretOverride >= 0
			? caretOverride : Number.isFinite(lastCaretRef.current) ? lastCaretRef.current : end;
		lastCaretRef.current = caret;
		lastRawCaretRef.current = computeRawInsertAtFromVisualCaret(raw, caret, endpointArgsRef.current);
		if (!readOnly && document.activeElement === root) {
			try { setFocusByCaretPositionInDivEditable(root, caret); } catch {}
		}
	}, [divRef, endpointArgsRef, lastCaretRef, lastRawCaretRef, lastRendered, readOnly]);

	useEffect(() => {
		const root = divRef.current;
		if (!root || typing.current) return;
		const domRaw = parseHtmlToRaw(root.innerHTML, ENDPOINT_REFERENCE_CLASS);
		if (value === domRaw || value === lastRendered.current) return;
		const end = getInlineVisualLength(value || '', endpointArgsRef.current);
		const caret = Number.isFinite(lastCaretRef.current)
			? Math.max(0, Math.min(lastCaretRef.current, end)) : end;
		lastCaretRef.current = caret;
		lastRawCaretRef.current = computeRawInsertAtFromVisualCaret(
			value || '', caret, endpointArgsRef.current);
		selectedTokenIndexRef.current = null;
		render(value || '', caret);
	}, [value, render, divRef, endpointArgsRef, lastCaretRef, lastRawCaretRef,
		selectedTokenIndexRef, lastRendered, typing]);

	const readRaw = () => divRef.current
		? parseHtmlToRaw(divRef.current.innerHTML, ENDPOINT_REFERENCE_CLASS) : value || '';
	return { render, readRaw };
}
