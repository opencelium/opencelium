import React from 'react';
import AceEditor from 'react-ace';
import type { LimitedAceEditorProps } from './interfaces';
import { LimitedAceEditorContainer, LimitedAceEditorCounter } from './styles';
import { useLimitedAceEditor } from './useLimitedAceEditor';
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

		const { currentValue, editorRef, isFocused, setIsFocused } = useLimitedAceEditor({
			forwardedRef: ref, maxLength, onChange, readOnly, value,
		});

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
					onFocus={() => setIsFocused(true)}
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
						setIsFocused(false);
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
