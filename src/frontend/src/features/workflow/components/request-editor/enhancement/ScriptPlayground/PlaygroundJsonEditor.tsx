import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import { useTheme } from '@shared/theme/hooks/useTheme';

type Props = {
	name: string;
	value: string;
	placeholder: string;
	error?: { line: number; column: number; message: string };
	onChange: (value: string) => void;
};

export function PlaygroundJsonEditor({ name, value, placeholder, error, onChange }: Props) {
	const { themeMode } = useTheme();
	const row = error ? error.line - 1 : 0;
	return (
		<div className="scriptPlaygroundJsonEditor" data-testid={`script-playground-var-${name}`}>
			<AceEditor
				mode="json"
				theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'}
				name={`script-playground-json-${name}`}
				value={value}
				placeholder={placeholder}
				onChange={onChange}
				width="100%"
				height="140px"
				fontSize={13}
				showGutter
				highlightActiveLine
				wrapEnabled
				annotations={
					error ? [{ row, column: error.column - 1, type: 'error', text: error.message }] : []
				}
				markers={
					error
						? [
								{
									startRow: row,
									endRow: row,
									startCol: 0,
									endCol: 1,
									className: 'ace_error-line',
									type: 'fullLine',
								},
							]
						: []
				}
				setOptions={{
					useWorker: false,
					showPrintMargin: false,
					showFoldWidgets: true,
					tabSize: 2,
				}}
			/>
		</div>
	);
}
