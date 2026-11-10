import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { markNextChangeAsAi } from '../utils/aiChangeMarker';
import { useWorkflowAssistAction } from './workflowAssistBridge';

type Params = {
	/** Read-only, a running test run, or a dialog with its own editing surface: the graph must not change under it. */
	isLocked: boolean;
	canUndo: boolean;
	canRedo: boolean;
	undo: () => void;
	redo: () => void;
	onDeleteNodes: (nodeIds: string[]) => Promise<void> | void;
	openProblems: () => void;
};

/** The graph edits a spoken or typed request can ask for, done the way their shortcuts do them. */
export function useWorkflowEditAssist({ isLocked, canUndo, canRedo, undo, redo, onDeleteNodes, openProblems }: Params) {
	const { t } = useI18n('common');
	const confirm = useConfirm();

	useWorkflowAssistAction('showProblems', openProblems);
	useWorkflowAssistAction('undo', () => {
		if (isLocked || !canUndo) return false;
		undo();
		return true;
	});
	useWorkflowAssistAction('redo', () => {
		if (isLocked || !canRedo) return false;
		redo();
		return true;
	});
	useWorkflowAssistAction('deleteStep', async ({ nodeId, label }) => {
		if (isLocked) return false;
		// A delete is confirmed even when Beebot was addressed by name: it is the one edit asked for by voice that is
		// easy to mishear and costly to miss.
		const isConfirmed = await confirm({
			title: t('commandPalette.workflowAssist.confirmDelete.title'),
			message: t('commandPalette.workflowAssist.confirmDelete.message', { step: label }),
			confirmVariant: 'danger',
		});
		if (!isConfirmed) return false;
		markNextChangeAsAi();
		await onDeleteNodes([nodeId]);
		return true;
	});
}
