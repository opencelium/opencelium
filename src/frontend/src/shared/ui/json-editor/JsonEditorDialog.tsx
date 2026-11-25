import { Dialog } from '@shared/ui/primitives/Dialog';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert, Segmented } from 'antd';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useTheme } from '@shared/theme/hooks/useTheme';
import { CopyButton } from '@shared/ui/actions/CopyButton';
import { DialogHeaderActions } from '@shared/ui/primitives/Dialog/DialogHeaderSlotContext';
import type { JsonEditorDialogProps } from './JsonEditorDialog.types';
import { JsonEditorTree } from './JsonEditorTree';
import { JsonEditorDialogFooter } from './JsonEditorDialogFooter';
import { useJsonEditor, type JsonEditorMode } from './useJsonEditor';
import { useJsonEditorAnnotations } from './useJsonEditorAnnotations';
import './JsonEditorDialog.css';

export function JsonEditorDialog<T>({ open, readOnly, title, testId, value, validate,
	applyConfirm, isApplying = false, onClose, onApply, forceApply }: JsonEditorDialogProps<T>) {
	const { t } = useI18n('common');
	const { themeMode } = useTheme();
	const confirm = useConfirm();
	const editor = useJsonEditor(open, value, validate);
	const { annotations, markers } = useJsonEditorAnnotations(editor.raw, editor.syntaxError,
		editor.validation);
	const error = editor.syntaxError
		? t('jsonEditor.syntaxError', { reason: editor.syntaxError })
		: editor.validation && !editor.validation.success
			? editor.validation.errors.map((item) => item.message).join('\n') : null;

	const close = async () => {
		if (isApplying) return;
		if (editor.dirty && !await confirm({ title: t('jsonEditor.discard.title'),
			message: t('jsonEditor.discard.message') })) return;
		onClose();
	};
	const apply = async () => {
		if (!editor.validation?.success) return;
		const data = editor.validation.data;
		if (!await confirm(applyConfirm)) return;
		onApply(data);
	};
	const forcePayload = editor.syntaxError ? null : editor.draft;
	const runForceApply = async () => {
		if (!forceApply || !forcePayload) return;
		const approved = await confirm({ ...forceApply.confirm, confirmVariant: 'danger' });
		if (!approved) return;
		forceApply.onApply(forcePayload);
	};

	return (
		<Dialog open={open} onClose={() => void close()} title={title}
			width="94vw" top={18} maximizable testId={`${testId}-dialog`}
			footer={<JsonEditorDialogFooter testId={testId} readOnly={readOnly}
				isDirty={editor.dirty} hasError={!!error} isApplying={isApplying}
				canForceApply={forceApply ? !!forcePayload : null}
				onForceApply={() => void runForceApply()} onCancel={() => void close()}
				onReset={editor.reset} onApply={() => void apply()} />}>
			<DialogHeaderActions>
				<CopyButton value={editor.raw} testId={`${testId}-copy`} />
			</DialogHeaderActions>
			<Segmented data-testid={`${testId}-mode-toggle`} value={editor.mode}
				onChange={(mode) => editor.setMode(mode as JsonEditorMode)}
				options={[{ label: t('jsonEditor.mode.tree'), value: 'tree' },
					{ label: t('jsonEditor.mode.raw'), value: 'raw' }]} />
			{error && <Alert data-testid={`${testId}-error`} type="error" showIcon
				message={<span style={{ whiteSpace: 'pre-line' }}>{error}</span>} style={{ marginTop: 12 }} />}
			{editor.mode === 'tree'
				? <JsonEditorTree testId={testId} value={editor.draft} readOnly={readOnly}
					onChange={editor.setTreeDraft} />
				: <div data-testid={`${testId}-raw`} style={{ height: 'calc(100vh - 280px)', marginTop: 12 }}>
					<AceEditor mode="json" theme={themeMode === 'dark' ? 'tomorrow_night' : 'tomorrow'}
						name={`${testId}-raw-editor`} value={editor.raw} readOnly={readOnly}
						onChange={editor.updateRaw} width="100%" height="100%" fontSize={14}
						annotations={annotations} markers={markers}
						showGutter highlightActiveLine={!readOnly} wrapEnabled
						setOptions={{ useWorker: false, showPrintMargin: false,
							showFoldWidgets: true, tabSize: 2 }} />
				</div>}
		</Dialog>
	);
}
