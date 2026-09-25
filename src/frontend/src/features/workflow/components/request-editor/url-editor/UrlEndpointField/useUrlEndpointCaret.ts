import { useEffect, type MouseEvent } from 'react';
import { getCaretPositionOfDivEditable, getCaretPositionOfDivEditableByPoint,
	getRawCaretPositionOfDivEditable,
	getRawCaretPositionOfDivEditableByPoint } from '../utils/contentEditable';
import { getInlineVisualLength, isSelectionInside } from '../urlEditor.utils';
import type { UrlEndpointFieldProps } from './UrlEndpointField.types';

export function useUrlEndpointCaret(props: UrlEndpointFieldProps) {
	const { value, divRef, endpointArgsRef, lastCaretRef, lastRawCaretRef,
		onRawCaretChange } = props;
	const captureSelection = () => {
		const root = divRef.current;
		if (!root || !isSelectionInside(root)) return;
		const caret = getCaretPositionOfDivEditable(root);
		if (caret < 0) return;
		lastCaretRef.current = caret;
		const rawCaret = getRawCaretPositionOfDivEditable(root);
		if (rawCaret > 0 || !(value || '')) {
			lastRawCaretRef.current = rawCaret;
			onRawCaretChange?.(rawCaret, caret);
		}
	};

	useEffect(() => {
		const onSelectionChange = () => captureSelection();
		document.addEventListener('selectionchange', onSelectionChange);
		return () => document.removeEventListener('selectionchange', onSelectionChange);
	});

	const captureMouse = (event: MouseEvent<HTMLDivElement>) => {
		const root = divRef.current;
		if (!root) return;
		if (event.clientX >= root.getBoundingClientRect().right - 2) {
			lastCaretRef.current = getInlineVisualLength(value || '', endpointArgsRef.current);
			lastRawCaretRef.current = (value || '').length;
			onRawCaretChange?.(lastRawCaretRef.current, lastCaretRef.current);
			return;
		}
		const rawCaret = getRawCaretPositionOfDivEditableByPoint(root, event.clientX, event.clientY);
		if (rawCaret >= 0) {
			lastRawCaretRef.current = rawCaret;
			lastCaretRef.current = getInlineVisualLength(
				(value || '').slice(0, rawCaret), endpointArgsRef.current);
			onRawCaretChange?.(rawCaret, lastCaretRef.current);
			return;
		}
		const caret = getCaretPositionOfDivEditableByPoint(root, event.clientX, event.clientY);
		if (caret >= 0) lastCaretRef.current = caret;
		else requestAnimationFrame(captureSelection);
	};
	return { captureSelection, captureMouse };
}
