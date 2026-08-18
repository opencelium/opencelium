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

	useImperativeHandle(forwardedRef, () => editorRef.current, []);

	useEffect(() => {
		setCurrentValue(value);
	}, [value]);

	useEffect(() => {
		const editor = editorRef.current?.editor;
		if (!editor || readOnly || typeof maxLength !== 'number') return;
		const session = editor.getSession();

		const handleSessionChange = () => {
			const current = editor.getValue();
			if (current.length > maxLength) {
				const selection = editor.getSelectionRange();
				const nextValue = current.slice(0, maxLength);
				editor.setValue(nextValue, -1);
				editor.moveCursorToPosition(selection.end);
				setCurrentValue(nextValue);
				onChange?.(nextValue);
				return;
			}
			setCurrentValue(current);
			onChange?.(current);
		};

		session.on('change', handleSessionChange);
		return () => session.off('change', handleSessionChange);
	}, [maxLength, readOnly, onChange]);

	return { currentValue, editorRef, isFocused, setIsFocused };
}
