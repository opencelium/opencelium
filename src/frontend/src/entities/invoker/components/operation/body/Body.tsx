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

import Input from '@app_component/base/input/Input';
import { getReactXmlStyles } from '@app_component/base/input/xml_view/styles';
import CXmlEditor from '@app_component/base/input/xml_view/xml_editor/classes/CXmlEditor';
import LimitedAceEditor from '@app_component/limited_ace_editor/LimitedAceEditor';
import { isJsonString } from '@application/utils/utils';
import { ResponseFormat } from '@entity/invoker/requests/models/Body';
import React, { FC, useEffect, useState } from 'react';
import { withTheme } from 'styled-components';
import { BodyProps } from '../interfaces';

const Body: FC<BodyProps> = ({
	updateBody,
	readOnly,
	value,
	format,
	theme,
	error,
}) => {
	const [validationMessage, setValidationMessage] = useState<string>('');
	const [localValue, setLocalValue] = useState<string>(
		format === ResponseFormat.Json
			? JSON.stringify(value)
			: CXmlEditor.createXmlEditor(value).convertToXml()
	);
	const hasLabel = true;
	const hasIcon = true;
	const styleProps = {
		hasIcon,
		marginTop: hasLabel ? '25px' : 0,
		theme,
	};
	useEffect(() => {
		let newValue =
			format === ResponseFormat.Json
				? JSON.stringify(value, null, 2)
				: CXmlEditor.createXmlEditor(value).convertToXml();
		if (newValue !== localValue) {
			setLocalValue(newValue);
		}
	}, [value]);
	return (
		<Input
			readOnly={readOnly}
			value={value}
			label={'Body'}
			icon={'data_object'}
			error={error || validationMessage}
			marginBottom={'20px'}
		>
			<LimitedAceEditor
				maxLength={255}
				style={{
					...getReactXmlStyles(styleProps),
					marginLeft: '50px',
					marginBottom: 0,
				}}
				counterStyles={{ top: '0' }}
				mode={format}
				theme='textmate'
				name='body'
				fontSize={14}
				showPrintMargin={false}
				showGutter={true}
				highlightActiveLine={true}
				setOptions={{
					enableBasicAutocompletion: false,
					enableLiveAutocompletion: false,
					enableSnippets: false,
					showLineNumbers: false,
					tabSize: 2,
					useWorker: false,
				}}
				value={localValue}
				onBlur={() => {
					if (value !== localValue) {
						if (format === ResponseFormat.Json) {
							if (isJsonString(localValue)) {
								updateBody(JSON.parse(localValue));
							} else {
								setValidationMessage(
									'Body should be a valid JSON value. It will not be saved.'
								);
							}
						} else {
							updateBody(
								CXmlEditor.createXmlEditor(localValue).convertToBackendXml()
							);
						}
					}
				}}
				onChange={(newValue) => {
					setLocalValue(newValue);
					setValidationMessage('');
				}}
			/>
		</Input>
	);
};

Body.defaultProps = {
	error: '',
};

export { Body };

export default withTheme(Body);
