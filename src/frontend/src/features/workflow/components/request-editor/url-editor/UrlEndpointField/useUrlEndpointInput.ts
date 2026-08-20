import type { ClipboardEvent, FormEvent, KeyboardEvent, MouseEvent, RefObject } from 'react';
import { getCaretPositionOfDivEditable,
	isCaretReportedAtEditableRootStart } from '../utils/contentEditable';
import { getInlineVisualLength, parseHtmlToRaw, PROHIBITED_ENDPOINT_CHARACTERS,
	removeInlineTokenByIndex, sanitizePlainTextPaste, sanitizeUrlInputValue, isSelectionInside,
	shouldBlockUrlKeyInput } from '../urlEditor.utils';
import type { UrlEndpointFieldProps, UrlEndpointRender } from './UrlEndpointField.types';
import { ENDPOINT_REFERENCE_CLASS, getCaretFromRawChange } from './urlEndpointField.utils';

export function useUrlEndpointInput(props: UrlEndpointFieldProps, typing: RefObject<boolean>,
	render: UrlEndpointRender, readRaw: () => string) {
	const { readOnly, value, divRef, endpointArgsRef, lastCaretRef, lastRawCaretRef,
		selectedTokenIndexRef, onRawChange, onBlurCommit, onRawCaretChange } = props;
	const reportRawChange = (next: string) => {
		if (next !== value) {
			const rawCaret = getCaretFromRawChange(value || '', next);
			lastRawCaretRef.current = rawCaret;
			lastCaretRef.current = getInlineVisualLength(next.slice(0, rawCaret), endpointArgsRef.current);
			onRawCaretChange?.(rawCaret, lastCaretRef.current);
		}
	};
	const updateFromDom = () => {
		const root = divRef.current;
		if (!root) return;
		typing.current = true;
		if (isSelectionInside(root)) {
			const caret = getCaretPositionOfDivEditable(root);
			if (caret >= 0) lastCaretRef.current = caret;
		}
		const next = sanitizeUrlInputValue(parseHtmlToRaw(root.innerHTML, ENDPOINT_REFERENCE_CLASS));
		reportRawChange(next);
		if (next === value && lastCaretRef.current === 0 && isCaretReportedAtEditableRootStart(root)) {
			lastCaretRef.current = getInlineVisualLength(next, endpointArgsRef.current);
			lastRawCaretRef.current = next.length;
			onRawCaretChange?.(lastRawCaretRef.current, lastCaretRef.current);
		}
		selectedTokenIndexRef.current = null;
		onRawChange(next);
		typing.current = false;
	};
	const deleteToken = () => {
		const index = selectedTokenIndexRef.current;
		if (index == null) return false;
		const next = removeInlineTokenByIndex(readRaw(), index);
		selectedTokenIndexRef.current = null;
		onRawChange(next);
		typing.current = false;
		const end = getInlineVisualLength(next, endpointArgsRef.current);
		lastCaretRef.current = Math.min(lastCaretRef.current, end);
		lastRawCaretRef.current = Math.min(lastRawCaretRef.current, next.length);
		onRawCaretChange?.(lastRawCaretRef.current, lastCaretRef.current);
		render(next, lastCaretRef.current);
		return true;
	};
	const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
		if (readOnly) return void event.preventDefault();
		const root = divRef.current;
		if (!root) return;
		const pasted = sanitizeUrlInputValue(sanitizePlainTextPaste(
			event.clipboardData?.getData('text/plain') || ''));
		if (!pasted) return void event.preventDefault();
		event.preventDefault();
		try { document.execCommand('insertText', false, pasted); } catch {}
		requestAnimationFrame(() => {
			const next = sanitizeUrlInputValue(parseHtmlToRaw(root.innerHTML, ENDPOINT_REFERENCE_CLASS));
			reportRawChange(next);
			typing.current = true; onRawChange(next); typing.current = false;
		});
	};
	const onBeforeInput = (event: FormEvent<HTMLDivElement>) => {
		if (readOnly) return;
		const data = (event.nativeEvent as InputEvent).data ?? '';
		if (!data) return;
		if (data === '. ') return void event.preventDefault();
		const sanitized = sanitizeUrlInputValue(data);
		if (sanitized === data) return;
		event.preventDefault();
		if (sanitized) try { document.execCommand('insertText', false, sanitized); } catch {}
	};
	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (readOnly) return;
		if (PROHIBITED_ENDPOINT_CHARACTERS.includes(event.key) || shouldBlockUrlKeyInput(event.key)) {
			return void event.preventDefault();
		}
		if (event.ctrlKey || event.metaKey || event.altKey) return;
		if (selectedTokenIndexRef.current != null && ['Backspace', 'Delete'].includes(event.key)) {
			event.preventDefault(); deleteToken();
		}
	};
	const onMouseDownCapture = (event: MouseEvent<HTMLDivElement>) => {
		const root = divRef.current;
		const pill = (event.target as HTMLElement | null)?.closest?.(`.${ENDPOINT_REFERENCE_CLASS}`) as HTMLElement | null;
		if (!root || !pill || !root.contains(pill)) return;
		const index = Number(pill.getAttribute('data-ref-index'));
		if (Number.isFinite(index)) selectedTokenIndexRef.current = index;
	};
	const onBlur = () => { typing.current = false; onBlurCommit(); render(value || '', lastCaretRef.current); };
	return { updateFromDom, onPaste, onBeforeInput, onKeyDown, onMouseDownCapture, onBlur };
}
