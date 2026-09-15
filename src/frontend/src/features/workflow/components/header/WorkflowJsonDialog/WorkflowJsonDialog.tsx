import { Dialog } from '@shared/ui/primitives/Dialog';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Alert, Button, Input, Segmented } from 'antd';
import type { WorkflowJsonDialogProps } from './WorkflowJsonDialog.types';
import { WorkflowJsonTree } from './WorkflowJsonTree';
import { useWorkflowJsonEditor, type WorkflowJsonMode } from './useWorkflowJsonEditor';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';

export function WorkflowJsonDialog({ open, readOnly, value, onClose, onApply }: WorkflowJsonDialogProps) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const editor = useWorkflowJsonEditor(open, value);
	const error = editor.syntaxError
		? t('json.errors.syntax', { reason: editor.syntaxError })
		: editor.validation && !editor.validation.success
			? editor.validation.errors.map((item) => t(item.key, {
				path: item.path || '-', reason: item.reason || '-',
			})).join('\n') : null;
	const close = async () => {
		if (editor.dirty && !await confirm({ title: t('json.discard.title'),
			message: t('json.discard.message') })) return;
		onClose();
	};
	const apply = async () => {
		if (!editor.validation?.success) return;
		const approved = await confirm({ title: t('json.applyConfirm.title'),
			message: t('json.applyConfirm.message') });
		if (!approved) return;
		onApply(editor.validation.data);
	};
	const footer = <>
		<Button data-testid="workflow-json-cancel" onClick={() => void close()}>{t('actions.cancel')}</Button>
		{!readOnly && <>
			<Button data-testid="workflow-json-reset" disabled={!editor.dirty}
				onClick={editor.reset}>{t('json.reset')}</Button>
			<Button type="primary" data-testid="workflow-json-apply"
				disabled={!editor.dirty || !!error}
				onClick={() => void apply()}>{t('actions.apply')}</Button>
		</>}
	</>;

	return (
		<Dialog open={open} onClose={() => void close()} title={t('json.title')}
			width="94vw" top={18} maximizable testId="workflow-json-dialog" footer={footer}>
			<Segmented data-testid="workflow-json-mode-toggle" value={editor.mode}
				onChange={(mode) => editor.setMode(mode as WorkflowJsonMode)}
				options={[{ label: t('json.mode.tree'), value: 'tree' },
					{ label: t('json.mode.raw'), value: 'raw' }]} />
			{error && <Alert data-testid="workflow-json-error" type="error" showIcon
				message={<span style={{ whiteSpace: 'pre-line' }}>{error}</span>} style={{ marginTop: 12 }} />}
			{editor.mode === 'tree'
				? <WorkflowJsonTree value={editor.draft} readOnly={readOnly} onChange={editor.setTreeDraft} />
				: <Input.TextArea data-testid="workflow-json-raw" value={editor.raw}
					readOnly={readOnly} onChange={(event) => editor.updateRaw(event.target.value)}
					style={{ height: 'calc(100vh - 280px)', marginTop: 12, fontFamily: 'monospace' }} />}
		</Dialog>
	);
}
