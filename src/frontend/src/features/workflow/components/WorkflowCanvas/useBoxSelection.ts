import { useCallback } from 'react';
import { useStoreApi, type OnNodesChange } from '@xyflow/react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { isLensElementId } from '../../lens/lensIds';
import { getDragSubtreeNodeIds } from '../../drag-drop/workflowDropTarget.utils';

export function useBoxSelection(
	edges: WorkflowEdgeModel[],
	onNodesChange: OnNodesChange<WorkflowNodeModel>,
) {
	const store = useStoreApi();
	const onSelectionEnd = useCallback(() => {
		const nodes = store.getState().nodes
			.filter((node) => !isLensElementId(node.id)) as WorkflowNodeModel[];
		const branchIds = new Set<string>();
		for (const node of nodes) {
			if (!node.selected || (node.type !== 'if' && node.type !== 'loop')) continue;
			getDragSubtreeNodeIds(node.id, nodes, edges).forEach((id) => branchIds.add(id));
		}
		const selectedIds = new Set(nodes.filter((node) => node.selected).map((node) => node.id));
		const changes = [...branchIds].filter((id) => !selectedIds.has(id))
			.map((id) => ({ id, type: 'select' as const, selected: true }));
		if (changes.length) onNodesChange(changes);
		// React Flow raises its group-drag box right after this callback returns. Dragging
		// that box bypasses the workflow's drop logic, so drop it and let the selected
		// nodes themselves carry the multi-drag.
		queueMicrotask(() => store.setState({ nodesSelectionActive: false }));
	}, [edges, onNodesChange, store]);
	return { onSelectionEnd };
}
