import { useState } from 'react';
import { IconButton } from '@shared/ui/primitives/IconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowUndoRedoState } from './WorkflowHeader.types';
import { WorkflowUndoHistoryMenu } from './WorkflowUndoHistoryMenu';

/** Header affordance for the in-session Ctrl+Z / Ctrl+Shift+Z stack, plus a
 * dropdown listing every recorded change so a specific point can be jumped to.
 * Distinct from the version history in the header menu, which restores *saved*
 * states. */
export function WorkflowUndoRedoControls({ canUndo, canRedo, onUndo, onRedo,
	entries, onJumpTo }: WorkflowUndoRedoState) {
	const { t } = useI18n('workflow');
	const [menuOpen, setMenuOpen] = useState(false);
	// A lone seed entry ("session start") is not a history worth opening.
	const hasHistory = entries.length > 1;

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
			<div className='headerActionWrap'>
				<Tooltip content={t('undoHistory.title')}>
					<IconButton type='text' iconProps={{ name: 'chevron-down', size: 13 }}
						disabled={!hasHistory} onClick={() => setMenuOpen((open) => !open)}
						testId='workflow-undo-history' />
				</Tooltip>
				<WorkflowUndoHistoryMenu open={menuOpen} entries={entries}
					onClose={() => setMenuOpen(false)} onSelect={onJumpTo} />
			</div>
		</div>
	);
}
