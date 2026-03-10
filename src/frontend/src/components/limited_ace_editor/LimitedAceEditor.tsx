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
import InputSelect from "@app_component/base/input/select/InputSelect";

const LimitedAceEditor = React.forwardRef<any, LimitedAceEditorProps>(
	(props, ref) => {
		const {
			maxLength,
			mode,
			editorTheme,
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
		const [isFocused, toggleFocus] = useState<boolean>(false);
		useImperativeHandle(ref, () => editorRef.current, []);

		useEffect(() => {
			setCurrentValue(value);
		}, [value]);

		useEffect(() => {
			const editor = editorRef.current?.editor;
			if (!editor || readOnly || typeof maxLength !== 'number') return;

			const session = editor.getSession();
			let lastValue = editor.getValue();

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

				lastValue = editor.getValue();
			};

			session.on('change', handleSessionChange);

			return () => {
				session.off('change', handleSessionChange);
			};
		}, [maxLength, readOnly, onChange]);

		return (
			<React.Fragment>
				<LimitedAceEditorContainer>
					{isFocused && maxLength && typeof maxLength === 'number' && (
						<LimitedAceEditorCounter
							top={counterStyles?.top}
							right={counterStyles?.right}
							theme={theme}
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
						showPrintMargin={false}
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
						onBlur={(e: any) => {
							toggleFocus(false);
							if (typeof onBlur === 'function') {
								onBlur();
							}
						}}
					/>
				</LimitedAceEditorContainer>
			</React.Fragment>
		);
	}
);

export default LimitedAceEditor;
