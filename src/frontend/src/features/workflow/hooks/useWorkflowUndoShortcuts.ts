import { useEffect } from 'react';
import { EDITABLE_TARGET_SELECTOR } from '../constants/keyboard';

type Params = {
	readOnly: boolean;
	disabled: boolean;
	undo: () => void;
	redo: () => void;
};

/** Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y redo — bound the same way as
 * the Delete and Ctrl+S shortcuts (useDeleteSelectedNode, WorkflowHeader) so the
 * editor keeps one keybinding mechanism. */
export const useWorkflowUndoShortcuts = ({ readOnly, disabled, undo, redo }: Params) => {
	useEffect(() => {
		const handleShortcut = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
			const key = event.key.toLowerCase();
			if (key !== 'z' && key !== 'y') return;
			// Inside a text control the browser's own undo stack is the right one.
			const target = event.target as HTMLElement | null;
			if (target?.closest(EDITABLE_TARGET_SELECTOR)) return;
			if (readOnly || disabled) return;
			event.preventDefault();
			if (key === 'y' || event.shiftKey) redo();
			else undo();
		};
		window.addEventListener('keydown', handleShortcut);
		return () => window.removeEventListener('keydown', handleShortcut);
	}, [readOnly, disabled, undo, redo]);
};
