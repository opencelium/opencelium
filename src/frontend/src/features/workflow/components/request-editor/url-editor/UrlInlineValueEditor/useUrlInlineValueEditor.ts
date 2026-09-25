import { useCallback, useEffect, useRef, type ClipboardEvent, type KeyboardEvent,
	type MouseEvent } from 'react';
import { buildInlineHtml, computeRawInsertAtFromVisualCaret, getInlineVisualLength,
	parseHtmlToRaw, sanitizePlainTextPaste, sanitizeUrlInputValue,
	shouldBlockUrlKeyInput } from '../urlEditor.utils';
import { getCaretPositionOfDivEditable,
	setFocusByCaretPositionInDivEditable } from '../utils/contentEditable';
import type { UrlInlineValueEditorProps } from './UrlInlineValueEditor.types';
import { getContentRightEdge, INLINE_REFERENCE_CLASS } from './urlInlineValueEditor.utils';

export function useUrlInlineValueEditor({ value, endpointArgs, readOnly,
	onChange, onCaretChange }: UrlInlineValueEditorProps) {
	const rootRef = useRef<HTMLDivElement | null>(null);
	const lastRendered = useRef('');
	const lastCaret = useRef(0);
	const typing = useRef(false);
	const reportCaret = (raw: string, caret: number) => onCaretChange?.(
		computeRawInsertAtFromVisualCaret(raw, caret, endpointArgs));

	const render = useCallback((raw: string) => {
		const root = rootRef.current;
		if (!root) return;
		lastRendered.current = raw;
		root.innerHTML = buildInlineHtml(raw, endpointArgs);
		const end = getInlineVisualLength(raw, endpointArgs);
		lastCaret.current = Math.max(0, Math.min(lastCaret.current, end));
		if (!readOnly && document.activeElement === root) {
			try { setFocusByCaretPositionInDivEditable(root, lastCaret.current); } catch {}
		}
	}, [endpointArgs, readOnly]);

	useEffect(() => {
		const root = rootRef.current;
		if (!root || typing.current) return;
		const domRaw = parseHtmlToRaw(root.innerHTML, INLINE_REFERENCE_CLASS);
		if (domRaw !== value && lastRendered.current !== value) render(value || '');
	}, [render, value]);

	const updateFromDom = () => {
		const root = rootRef.current;
		if (!root) return;
		typing.current = true;
		const caret = getCaretPositionOfDivEditable(root);
		const next = sanitizeUrlInputValue(parseHtmlToRaw(root.innerHTML, INLINE_REFERENCE_CLASS));
		if (caret >= 0) { lastCaret.current = caret; reportCaret(next, caret); }
		onChange(next);
		typing.current = false;
	};

	const updateCaret = () => {
		const root = rootRef.current;
		if (!root) return;
		const caret = getCaretPositionOfDivEditable(root);
		if (caret >= 0) { lastCaret.current = caret; reportCaret(value || '', caret); }
	};
	const onClick = (event: MouseEvent<HTMLDivElement>) => {
		const root = rootRef.current;
		if (!root) return;
		const rightEdge = getContentRightEdge(root);
		if (rightEdge !== null && event.clientX > rightEdge) {
			lastCaret.current = getInlineVisualLength(value || '', endpointArgs);
			onCaretChange?.((value || '').length);
			setFocusByCaretPositionInDivEditable(root, lastCaret.current);
			return;
		}
		updateCaret();
	};
	const onMouseDown = () => {
		const root = rootRef.current;
		if (!root || readOnly) return;
		root.focus();
		if (!window.getSelection()?.rangeCount) setFocusByCaretPositionInDivEditable(root, lastCaret.current);
	};
	const onFocus = () => {
		const root = rootRef.current;
		if (!root || readOnly || getCaretPositionOfDivEditable(root) >= 0) return;
		setFocusByCaretPositionInDivEditable(root, lastCaret.current);
	};
	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (!readOnly && shouldBlockUrlKeyInput(event.key)) event.preventDefault();
	};
	const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
		if (readOnly) return void event.preventDefault();
		const pasted = sanitizeUrlInputValue(sanitizePlainTextPaste(
			event.clipboardData?.getData('text/plain') || ''));
		if (!pasted) return void event.preventDefault();
		event.preventDefault();
		try { document.execCommand('insertText', false, pasted); } catch {}
		requestAnimationFrame(updateFromDom);
	};

	return { rootRef, render, updateFromDom, updateCaret, onClick, onMouseDown,
		onFocus, onKeyDown, onPaste };
}
