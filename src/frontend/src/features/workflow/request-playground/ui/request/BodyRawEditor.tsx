import { useState } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-xml';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTheme } from '@shared/theme/hooks/useTheme';
import type { WorkflowBodyFormat } from '../../../types/request-config.types';
import { formatBodyForEditor, parseEditedBody } from '../../model/bodyEditorFormat';

type Props = {
	body: unknown;
	format: WorkflowBodyFormat;
	onChange: (body: unknown) => void;
};

export function BodyRawEditor({ body, format, onChange }: Props) {
	const { t } = useI18n('workflow');
	const { themeMode } = useTheme();
	const [text, setText] = useState(() => formatBodyForEditor(body, format));
	const [isInvalid, setIsInvalid] = useState(false);

	const change = (next: string) => {
		setText(next);
		try {
			onChange(parseEditedBody(next, body, format));
			setIsInvalid(false);
		} catch {
			setIsInvalid(true);
		}
	};

	return (
		<>
			<div className={`rpRawEditor${isInvalid ? ' rpRawEditor--invalid' : ''}`} data-testid='request-playground-body-raw'>
				<AceEditor mode={format === 'xml' ? 'xml' : 'json'} theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'}
					name='request-playground-body-raw-editor' value={text} onChange={change}
					width='100%' height='100%' fontSize={13} showGutter wrapEnabled
					editorProps={{ $blockScrolling: true }}
					setOptions={{ useWorker: false, showPrintMargin: false, tabSize: 2 }} />
			</div>
			<span className={isInvalid ? 'rpValueError' : 'rpHint'}>
				{isInvalid
					? t(format === 'xml' ? 'requestPlayground.body.invalidXml' : 'requestPlayground.body.invalidJson')
					: <Trans ns='workflow' i18nKey='requestPlayground.body.rawHint' components={{ b: <b /> }} />}
			</span>
		</>
	);
}
