import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import { useTheme } from '@shared/theme/hooks/useTheme';

type Props = { text: string; testId?: string };

/** Read-only JSON in the same editor theme as the message step, so both read alike. */
export function HighlightedJson({ text, testId }: Props) {
	const { themeMode } = useTheme();
	const lineCount = text.split('\n').length;
	return (
		<div className='notificationJsonEditorFrame' data-testid={testId}>
			<AceEditor mode='json' theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'} value={text} readOnly
				width='100%' minLines={2} maxLines={Math.min(Math.max(lineCount, 2), 18)} fontSize={12} showGutter={false}
				highlightActiveLine={false} wrapEnabled setOptions={{ useWorker: false, showPrintMargin: false }} />
		</div>
	);
}
