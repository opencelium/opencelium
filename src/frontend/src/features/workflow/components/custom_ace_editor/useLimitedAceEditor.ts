import { useEffect, useImperativeHandle, useRef, useState, type ForwardedRef } from 'react';
import type { LimitedAceEditorProps } from './interfaces';

type Args = Pick<LimitedAceEditorProps, 'maxLength' | 'onChange' | 'readOnly' | 'value'> & {
	forwardedRef: ForwardedRef<any>;
};

export function useLimitedAceEditor({
	forwardedRef, maxLength, onChange, readOnly, value,
}: Args) {
	const [currentValue, setCurrentValue] = useState(value);
	const [isFocused, setIsFocused] = useState(false);
	const editorRef = useRef<any>(null);
	// The text the editor and this hook currently agree on. Kept in step with
	// `currentValue` but readable from the session listener without making the
	// listener depend on a render.
	const syncedValueRef = useRef(value);
	const onChangeRef = useRef(onChange);

	useImperativeHandle(forwardedRef, () => editorRef.current, []);

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		// Updated before the render that hands the new value to react-ace, so the
		// 'change' that react-ace's own setValue emits is already recognisable as
		// an echo by the time it fires.
		syncedValueRef.current = value;
		setCurrentValue(value);
	}, [value]);

	useEffect(() => {
		const editor = editorRef.current?.editor;
		const container = editor?.container;
		if (!editor || !container) return;
		// Ace measures its container once and caches that size, so anything which
		// gives the editor its height *after* mount — a drawer sliding in, a panel
		// expanding, a flex parent resolving late — leaves it drawing into a box it
		// still believes is zero tall: the text sits in the session and nothing
		// appears on screen. Re-measure on mount, and follow the container from then
		// on rather than waiting for a window resize to arrive.
		editor.resize(true);
		if (typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => editor.resize());
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const editor = editorRef.current?.editor;
		if (!editor || readOnly || typeof maxLength !== 'number') return;
		const session = editor.getSession();

		const handleSessionChange = () => {
			const current = editor.getValue();
			if (current.length > maxLength) {
				const selection = editor.getSelectionRange();
				const nextValue = current.slice(0, maxLength);
				// Marked as synced BEFORE setValue, because setValue emits 'change'
				// synchronously and re-enters this handler — without that the
				// truncation would be reported upward twice.
				syncedValueRef.current = nextValue;
				editor.setValue(nextValue, -1);
				editor.moveCursorToPosition(selection.end);
				setCurrentValue(nextValue);
				onChangeRef.current?.(nextValue);
				return;
			}
			// Ace emits 'change' both for real typing AND when react-ace pushes our
			// own `value` prop back into the session. Reporting the latter as an
			// edit let any text the editor normalises differently (line endings, a
			// trailing newline) ping-pong between parent and editor until React
			// gave up with "Maximum update depth exceeded".
			if (current === syncedValueRef.current) return;
			syncedValueRef.current = current;
			setCurrentValue(current);
			onChangeRef.current?.(current);
		};

		session.on('change', handleSessionChange);
		return () => session.off('change', handleSessionChange);
	}, [maxLength, readOnly]);

	return { currentValue, editorRef, isFocused, setIsFocused };
}
