import { useEffect, useRef } from 'react';
import type { Ace } from 'ace-builds';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { Textarea } from '@shared/ui/primitives/Textarea';
import { findJsonSyntaxErrorPosition } from '../components/header/WorkflowJsonDialog/workflowJson.locations';
import { readJsonError, type TestInputValue } from './testMethodInputValue';

type Props = {
	value: TestInputValue;
	isMissing: boolean;
	testId?: string;
	onChange: (text: string) => void;
};

// JSON values get a code editor, plain text a textarea; both fill the space left in the pane.
export function TestMethodValueEditor({ value, isMissing, testId, onChange }: Props) {
	const { t } = useI18n('workflow');
	const { themeMode } = useTheme();
	const editorRef = useRef<Ace.Editor | null>(null);
	const jsonError = readJsonError(value);
	const errorAt = jsonError === null ? null
		: findJsonSyntaxErrorPosition(value.text, jsonError) ?? { row: 0, column: 0 };
	const errorRow = errorAt?.row;
	const errorColumn = errorAt?.column;

	// react-ace's own `annotations` prop is applied before the text on mount and the text load
	// clears it, so the marker is set on the session directly once the editor exists.
	useEffect(() => {
		const annotations: Ace.Annotation[] = jsonError !== null && errorRow !== undefined && errorColumn !== undefined
			? [{ row: errorRow, column: errorColumn, type: 'error', text: jsonError }] : [];
		editorRef.current?.session.setAnnotations(annotations);
	}, [jsonError, errorRow, errorColumn, value.kind]);

	if (value.kind === 'string') {
		return (
			<div className='testMethodValue testMethodValue--text'>
				<Textarea value={value.text} error={isMissing} testId={testId}
					placeholder={t('testMethod.inputs.placeholder')}
					onChange={(event) => onChange(event.target.value)} />
			</div>
		);
	}
	return (
		<div className={`testMethodValue testMethodValue--json${isMissing || jsonError ? ' testMethodValue--missing' : ''}`}
			data-testid={testId}>
			<AceEditor mode='json' theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'}
				name={`${testId ?? 'workflow-test-method-value'}-editor`} value={value.text} onChange={onChange}
				placeholder={t('testMethod.inputs.placeholder')} width='100%' height='100%' fontSize={13}
				showGutter wrapEnabled editorProps={{ $blockScrolling: true }}
				onLoad={(editor) => { editorRef.current = editor; }}
				setOptions={{ useWorker: false, showPrintMargin: false, tabSize: 2 }} />
			{errorAt && (
				<div className='testMethodValueError' data-testid={testId && `${testId}-error`}>
					{t('testMethod.inputs.invalidJson', { line: errorAt.row + 1 })}
				</div>
			)}
		</div>
	);
}
