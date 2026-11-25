import { useState } from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import { Trans } from 'react-i18next';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTheme } from '@shared/theme/hooks/useTheme';

type Props = {
	body: unknown;
	onChange: (body: unknown) => void;
};

// The step's body as stored, references included as text. Only a body that parses is
// taken over, so a half-typed edit never reaches the request.
export function BodyRawEditor({ body, onChange }: Props) {
	const { t } = useI18n('workflow');
	const { themeMode } = useTheme();
	const [text, setText] = useState(() => JSON.stringify(body ?? {}, null, 2));
	const [isInvalid, setIsInvalid] = useState(false);

	const change = (next: string) => {
		setText(next);
		try {
			onChange(JSON.parse(next));
			setIsInvalid(false);
		} catch {
			setIsInvalid(true);
		}
	};

	return (
		<>
			<div className={`rpRawEditor${isInvalid ? ' rpRawEditor--invalid' : ''}`} data-testid='request-playground-body-raw'>
				<AceEditor mode='json' theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'}
					name='request-playground-body-raw-editor' value={text} onChange={change}
					width='100%' height='100%' fontSize={13} showGutter wrapEnabled
					editorProps={{ $blockScrolling: true }}
					setOptions={{ useWorker: false, showPrintMargin: false, tabSize: 2 }} />
			</div>
			<span className={isInvalid ? 'rpValueError' : 'rpHint'}>
				{isInvalid
					? t('requestPlayground.body.invalidJson')
					: <Trans ns='workflow' i18nKey='requestPlayground.body.rawHint' components={{ b: <b /> }} />}
			</span>
		</>
	);
}
