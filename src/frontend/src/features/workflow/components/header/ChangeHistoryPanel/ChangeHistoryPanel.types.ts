import type { WorkflowUndoEntry } from '../../../types/undoHistory.types';

export type ChangeHistoryPanelProps = {
	open: boolean;
	/** Newest-first change list from useWorkflowUndoHistory; `offset` is the jump
	 * distance from the current state (see WorkflowUndoEntry). */
	entries: WorkflowUndoEntry[];
	onClose: () => void;
	onJumpTo: (offset: number) => void;
};
