import { ScriptCompatibilityStatus } from './ScriptCompatibilityStatus';
import type { Ace } from 'ace-builds';
import { useEffect, useRef } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useNashornCompatibility } from '@features/workflow/script-sandbox/useNashornCompatibility';
import { issueMessage } from '@features/workflow/script-sandbox/issueMessage';
import '../ScriptPlayground/ScriptPlayground.css';
import CustomAceEditor from '../../../custom_ace_editor/CustomAceEditor';
import { useTheme } from '@shared/theme/hooks/useTheme';
import type { EnhancementScriptProps } from './EnhancementScript.types';
import { useEnhancementScriptValue } from './useEnhancementScriptValue';
import { logFieldBinding } from '../../../../utils/fieldBindingDebug';

const modeMap = {
	js: 'javascript',
	python2: 'python',
	python3: 'python',
	ruby: 'ruby',
};
const EnhancementScript = ({
	enhancement,
	onChangeScript,
	readOnly,
	onDraftChange,
	onEditorReady,
	onIssuesChange,
	runtimeLocation,
}: EnhancementScriptProps) => {
	const { themeMode } = useTheme();
	const editor = useRef<Ace.Editor | null>(null);
	const [localScript, setLocalScript] = useEnhancementScriptValue(
		enhancement.script,
		onChangeScript,
	);
	const { t } = useI18n('workflow');
	const issues = useNashornCompatibility(localScript, enhancement.language);
	const scriptLines = localScript.split('\n');

	useEffect(() => {
		onIssuesChange?.(issues);
	}, [issues, onIssuesChange]);
	logFieldBinding('5. what the script editor renders', {
		fromEnhancement:
			typeof enhancement.script === 'string'
				? `string(len=${enhancement.script.length})`
				: String(enhancement.script),
		handedToAce:
			typeof localScript === 'string' ? `string(len=${localScript.length})` : String(localScript),
		language: enhancement.language,
		mode: modeMap[enhancement.language],
	});
	return (
		<div className="scriptCompatibilityEditor">
			<CustomAceEditor
				fontSize={14}
				hideCounter
				hasDiffLang
				maxLength={65535}
				style={{
					marginBottom: 0,
					width: '100%',
					height: '100%',
				}}
				mode={modeMap[enhancement.language]}
				editorTheme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'}
				name="enhancement_code"
				editorProps={{ $blockScrolling: true }}
				showPrintMargin={true}
				showGutter={true}
				highlightActiveLine={true}
				onChange={(value) => {
					setLocalScript(value);
					onDraftChange?.(value);
				}}
				onLoad={(instance) => {
					editor.current = instance;
					onEditorReady?.(instance);
				}}
				annotations={[
					...issues.map((issue) => ({
						row: issue.line - 1,
						column: issue.column,
						type: issue.kind === 'syntax' ? ('error' as const) : ('warning' as const),
						text: issueMessage(issue, t),
					})),
					...(runtimeLocation
						? [
								{
									row: runtimeLocation.line - 1,
									column: runtimeLocation.column,
									type: 'error' as const,
									text: t('sandbox.runtimeError'),
								},
							]
						: []),
				]}
				markers={[
					...issues.map((issue) => ({
						startRow: issue.line - 1,
						endRow: issue.line - 1,
						startCol: issue.column,
						endCol:
							issue.column +
							Math.max(
								1,
								scriptLines[issue.line - 1]?.slice(issue.column).match(/^[\w.$]+|^=>/)?.[0]
									.length ?? 1,
							),
						type: 'text' as const,
						className: issue.kind === 'syntax' ? 'scriptCompatibilityError' : 'scriptCompatibilityWarning',
					})),
					...(runtimeLocation
						? [
								{
									startRow: runtimeLocation.line - 1,
									endRow: runtimeLocation.line - 1,
									startCol: 0,
									endCol: 1,
									type: 'fullLine' as const,
									className: 'scriptRuntimeError',
								},
							]
						: []),
				]}

				value={localScript}
				width={'100%'}
				height="300px"
				readOnly={readOnly}
				setOptions={{
					enableBasicAutocompletion: false,
					enableLiveAutocompletion: false,
					enableSnippets: false,
					showLineNumbers: false,
					showFoldWidgets: false,
					tabSize: 2,
					useWorker: false,
				}}
			/>
			<div className="scriptCompatibilityCount">
				{t('sandbox.characters', { count: localScript.length })}
			</div>
			<ScriptCompatibilityStatus
				issues={issues}
				isEnabled={enhancement.language === 'js'}
				onLocate={(line, column) => {
					editor.current?.gotoLine(line, column, true);
					editor.current?.focus();
				}}
			/>
		</div>
	);
};

export default EnhancementScript;
