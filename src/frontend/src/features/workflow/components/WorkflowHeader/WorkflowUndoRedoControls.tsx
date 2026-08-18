import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowUndoRedoState } from './WorkflowHeader.types';

/** Header affordance for the in-session Ctrl+Z / Ctrl+Shift+Z stack. Distinct
 * from the version history in the header menu, which restores *saved* states. */
export function WorkflowUndoRedoControls({ canUndo, canRedo, onUndo, onRedo }: WorkflowUndoRedoState) {
	const { t } = useI18n('workflow');

	return (
		<div className='headerUndoRedo'>
			<Tooltip content={t('actions.undo')}>
				<IconButton type='text' iconProps={{ name: 'undo', size: 17 }}
					disabled={!canUndo} onClick={onUndo} testId='workflow-undo' />
			</Tooltip>
			<Tooltip content={t('actions.redo')}>
				<IconButton type='text' iconProps={{ name: 'redo', size: 17 }}
					disabled={!canRedo} onClick={onRedo} testId='workflow-redo' />
			</Tooltip>
		</div>
	);
}
