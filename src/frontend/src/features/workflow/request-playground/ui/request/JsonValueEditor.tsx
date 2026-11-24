import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import { useTheme } from '@shared/theme/hooks/useTheme';

type Props = {
	value: string;
	isError: boolean;
	placeholder: string;
	testId?: string;
	onChange: (text: string) => void;
};

// A JSON test value gets the same editor as the raw body, sized to its content.
export function JsonValueEditor({ value, isError, placeholder, testId, onChange }: Props) {
	const { themeMode } = useTheme();
	return (
		<div className={`rpJsonValue${isError ? ' rpJsonValue--error' : ''}`} data-testid={testId}>
			<AceEditor mode='json' theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'}
				value={value} onChange={onChange} placeholder={placeholder}
				width='100%' fontSize={12} minLines={3} maxLines={12} showGutter wrapEnabled
				editorProps={{ $blockScrolling: true }}
				setOptions={{ useWorker: false, showPrintMargin: false, tabSize: 2 }} />
		</div>
	);
}
