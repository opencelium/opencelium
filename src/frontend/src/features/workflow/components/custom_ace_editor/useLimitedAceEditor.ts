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
	// Set while this hook is the one writing to the editor. react-ace suppresses
	// the echo of its own programmatic setValue via its `silent` flag, but it
	// knows nothing about ours, so it reports it as an edit unless we say so.
	const isSelfWriteRef = useRef(false);

	useImperativeHandle(forwardedRef, () => editorRef.current, []);

	useEffect(() => {
		setCurrentValue(value);
	}, [value]);

	/**
	 * react-ace's own `onChange`, which is the only change signal worth listening
	 * to. Subscribing to the ace session directly instead reported two kinds of
	 * non-edit as edits:
	 *
	 *  - react-ace re-applying our own `value` prop, which it deliberately hides
	 *    from `onChange` (`silent`) precisely because it is not an edit;
	 *  - the halfway point of any programmatic write, because ace's
	 *    Document.setValue is a remove followed by an insert and signals 'change'
	 *    for each — so every push was announced upward as an edit to '' and then
	 *    to the real text.
	 *
	 * The parent stored the '', pushed it back down, and the two mirrors bounced
	 * it between them from inside react-ace's componentDidUpdate until React gave
	 * up with "Maximum update depth exceeded".
	 */
	const onEditorChange = (next: string) => {
		if (isSelfWriteRef.current) return;
		const editor = editorRef.current?.editor;
		if (editor && !readOnly && typeof maxLength === 'number' && next.length > maxLength) {
			const selection = editor.getSelectionRange();
			const truncated = next.slice(0, maxLength);
			isSelfWriteRef.current = true;
			editor.setValue(truncated, -1);
			editor.moveCursorToPosition(selection.end);
			isSelfWriteRef.current = false;
			setCurrentValue(truncated);
			onChange?.(truncated);
			return;
		}
		setCurrentValue(next);
		onChange?.(next);
	};

	return { currentValue, editorRef, isFocused, onEditorChange, setIsFocused };
}
