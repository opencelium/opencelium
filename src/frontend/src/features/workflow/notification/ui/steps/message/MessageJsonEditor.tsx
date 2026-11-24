import { useRef } from 'react';
import AceEditor from 'react-ace';
import type { Ace } from 'ace-builds';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { NotificationReferencePicker } from '../../references/NotificationReferencePicker';
import { ReferenceInsertButton } from '../../references/ReferenceInsertButton';
import { wrapReference } from '../../../model/notificationBody';

const PICKER_ID = 'notification-json-body';

type Props = { value: string; onChange: (value: string) => void; isReadOnly?: boolean };

export function MessageJsonEditor({ value, onChange, isReadOnly }: Props) {
	const { t } = useI18n('workflow');
	const { themeMode } = useTheme();
	const editorRef = useRef<Ace.Editor | null>(null);
	return (
		<div className='notificationJsonEditor'>
			<div className='notificationJsonEditorBar'>
				<span className='notificationMuted'>{t('notification.message.jsonReferenceHint')}</span>
				<ReferenceInsertButton pickerId={PICKER_ID} testId='notification-json-insert-reference' disabled={isReadOnly} />
			</div>
			<NotificationReferencePicker pickerId={PICKER_ID} onApply={(reference) => {
				editorRef.current?.insert(wrapReference(reference));
				editorRef.current?.focus();
			}} />
			<div className='notificationJsonEditorFrame' data-testid='notification-json-editor'>
				<AceEditor mode='json' theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'} name='notification-json-editor'
					value={value} onChange={onChange} onLoad={(editor) => { editorRef.current = editor; }}
					readOnly={isReadOnly} width='100%' height='420px' fontSize={13} showGutter highlightActiveLine wrapEnabled
					setOptions={{ useWorker: false, showPrintMargin: false, tabSize: 2 }} />
			</div>
		</div>
	);
}
