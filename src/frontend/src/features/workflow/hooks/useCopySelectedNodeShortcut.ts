import { useEffect } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { EDITABLE_TARGET_SELECTOR } from '../constants/keyboard';
import { getSelectedDragGroup } from '../drag-drop/workflowDropTarget.utils';

type Params = {
	disabled: boolean;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	onCopyNodes: (nodeIds: string[]) => void;
};

export const useCopySelectedNodeShortcut = ({ disabled, nodes, edges, onCopyNodes }: Params) => {
	useEffect(() => {
		const handleCopy = (event: KeyboardEvent) => {
			if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey ||
				event.key.toLowerCase() !== 'c') return;
			const target = event.target as Element | null;
			if (target?.closest?.(EDITABLE_TARGET_SELECTOR)) return;
			if (disabled) return;
			const selected = getSelectedDragGroup(nodes, edges).rootIds;
			if (selected.length === 0) return;
			event.preventDefault();
			onCopyNodes(selected);
		};
		window.addEventListener('keydown', handleCopy);
		return () => window.removeEventListener('keydown', handleCopy);
	}, [disabled, nodes, edges, onCopyNodes]);
};
