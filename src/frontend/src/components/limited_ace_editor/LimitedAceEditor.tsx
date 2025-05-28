/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-livescript';
import 'ace-builds/src-noconflict/mode-xml';
import 'ace-builds/src-noconflict/snippets/javascript';
import 'ace-builds/src-noconflict/theme-textmate';
import 'ace-builds/src-noconflict/theme-tomorrow';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import AceEditor from 'react-ace';
import { LimitedAceEditorProps } from './interfaces';
import { LimitedAceEditorContainer, LimitedAceEditorCounter } from './styles';

const LimitedAceEditor = React.forwardRef<any, LimitedAceEditorProps>(
	(props, ref) => {
		console.log(props);
		const {
			maxLength,
			mode,
			theme,
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
			height,
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

		useImperativeHandle(ref, () => editorRef.current, []);

		useEffect(() => {
			setCurrentValue(value);
		}, [value]);

		useEffect(() => {
			const editor = editorRef.current?.editor;
			if (!editor || readOnly) return;

			const handleBeforeInput = (e: any) => {
				const current = editor.getValue();
				const selectionLength = editor.session.getTextRange(
					editor.getSelectionRange()
				).length;
				const incomingLength = typeof e.data === 'string' ? e.data.length : 0;
				if (current.length - selectionLength + incomingLength > maxLength) {
					e.preventDefault();
				}
			};

			const handlePaste = (e: any) => {
				const clipboard = e.clipboardData.getData('text');
				const current = editor.getValue();
				const selectionLength = editor.session.getTextRange(
					editor.getSelectionRange()
				).length;

				if (current.length - selectionLength + clipboard.length > maxLength) {
					e.preventDefault();
				}
			};

			const el = editor.textInput.getElement();
			el.addEventListener('beforeinput', handleBeforeInput);
			el.addEventListener('paste', handlePaste);

			return () => {
				el.removeEventListener('beforeinput', handleBeforeInput);
				el.removeEventListener('paste', handlePaste);
			};
		}, [maxLength, readOnly]);

		const handleChange = (newValue: string) => {
			if (typeof maxLength === 'number' && newValue.length > maxLength) {
				const trimmed = newValue.slice(0, maxLength);
				setCurrentValue(trimmed);
				onChange(trimmed);
				return;
			}

			if (newValue.length <= maxLength) {
				setCurrentValue(newValue);
				onChange(newValue);
			} else {
				const trimmed = newValue.slice(0, maxLength);
				setCurrentValue(trimmed);
				onChange(trimmed);
			}
		};

		return (
			<LimitedAceEditorContainer>
				{maxLength && typeof maxLength === 'number' && (
					<LimitedAceEditorCounter
						top={counterStyles?.top}
						right={counterStyles?.right}
					>
						{currentValue?.length || 0}/{maxLength}
					</LimitedAceEditorCounter>
				)}
				<AceEditor
					ref={editorRef}
					mode={mode}
					theme={theme}
					value={currentValue}
					fontSize={fontSize}
					showPrintMargin={showPrintMargin}
					showGutter={showGutter}
					highlightActiveLine={highlightActiveLine}
					wrapEnabled={wrapEnabled}
					setOptions={setOptions}
					className={className}
					readOnly={readOnly}
					style={style}
					markers={markers}
					name={name}
					editorProps={editorProps}
					height={height}
					width={width}
					placeholder={placeholder}
					cursorStart={cursorStart}
					focus={focus}
					onChange={handleChange}
					onBlur={onBlur}
				/>
			</LimitedAceEditorContainer>
		);
	}
);

export default LimitedAceEditor;
