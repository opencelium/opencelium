import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import AceEditor from 'react-ace';
import type { LimitedAceEditorProps } from './interfaces';
import { LimitedAceEditorContainer, LimitedAceEditorCounter } from './styles';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-ruby';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-tomorrow_night';

const CustomAceEditor = React.forwardRef<any, LimitedAceEditorProps>(
	(props, ref) => {
		const {
			maxLength,
			mode,
			editorTheme,
			value,
			fontSize,
			showPrintMargin,
			showGutter,
			highlightActiveLine,
			wrapEnabled,
			setOptions,
			className,
			readOnly,
			style,
			markers,
			name,
			editorProps,
			// height,
			width,
			placeholder,
			cursorStart,
			focus,
			counterStyles,
			onChange,
			onBlur,
		} = props;

		const [currentValue, setCurrentValue] = useState(value);
		const editorRef = useRef<any>(null);
		const [isFocused, toggleFocus] = useState<boolean>(false);
		useImperativeHandle(ref, () => editorRef.current, []);

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
					const newValue = current.slice(0, maxLength);
					editor.setValue(newValue, -1);
					editor.moveCursorToPosition(selection.end);

					setCurrentValue(newValue);
					onChange?.(newValue);
				} else {
					setCurrentValue(current);
					onChange?.(current);
				}
			};

			session.on('change', handleSessionChange);

			return () => {
				session.off('change', handleSessionChange);
			};
		}, [maxLength, readOnly, onChange]);

		return (
			<LimitedAceEditorContainer style={{ height: '100%' }}>
				{isFocused && maxLength && typeof maxLength === 'number' && (
					<LimitedAceEditorCounter
						top={counterStyles?.top}
						right={counterStyles?.right}
						bottom={counterStyles?.bottom}
					>
						{currentValue?.length || 0}/{maxLength}
					</LimitedAceEditorCounter>
				)}

				<AceEditor
					onFocus={() => toggleFocus(true)}
					ref={editorRef}
					mode={mode}
					theme={editorTheme}
					value={currentValue}
					fontSize={fontSize}
					showPrintMargin={showPrintMargin ?? false}
					showGutter={showGutter}
					highlightActiveLine={highlightActiveLine}
					wrapEnabled={wrapEnabled}
					setOptions={setOptions}
					className={className}
					readOnly={readOnly}
					markers={markers}
					name={name}
					editorProps={editorProps}
					placeholder={placeholder}
					cursorStart={cursorStart}
					focus={focus}
					width={width || '100%'}
					height='100%'
					style={{
						...style,
						width: '100%',
						height: '100%',
					}}
					minLines={undefined}
					maxLines={undefined}
					onBlur={() => {
						toggleFocus(false);
						if (typeof onBlur === 'function') {
							onBlur();
						}
					}}
				/>
			</LimitedAceEditorContainer>
		);
	}
);

export default CustomAceEditor;
