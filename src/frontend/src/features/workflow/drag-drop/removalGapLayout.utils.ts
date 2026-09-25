import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowDropMode } from '../utils/graph.dragDrop';
import { collectDescendantNodeIds } from '../utils/graph.traversal';
import type { WorkflowPosition } from './workflowPage.types';

export const buildRemovalShiftById = (
	mode: WorkflowDropMode,
	includeRemovalGapFill: boolean,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	draggedIds: Set<string>,
) => {
	const shifts = new Map<string, WorkflowPosition>();
	if (mode !== 'move' || !includeRemovalGapFill) return shifts;
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	edges.filter((edge) => draggedIds.has(edge.source) && !draggedIds.has(edge.target))
		.forEach((exitEdge) => {
			const removed = nodeById.get(exitEdge.source);
			const filler = nodeById.get(exitEdge.target);
			if (!removed || !filler) return;
			const vertical = exitEdge.targetHandle === 'top' || exitEdge.sourceHandle === 'bottom';
			const shift = vertical
				? { x: 0, y: removed.position.y - filler.position.y }
				: { x: removed.position.x - filler.position.x, y: 0 };
			collectDescendantNodeIds(filler.id, edges).forEach((id) => {
				if (!draggedIds.has(id)) shifts.set(id, shift);
			});
		});
	return shifts;
};

export const getShiftedNodePosition = (
	node: WorkflowNodeModel,
	shifts: Map<string, WorkflowPosition>,
): WorkflowPosition => {
	const shift = shifts.get(node.id);
	return shift
		? { x: node.position.x + shift.x, y: node.position.y + shift.y }
		: { x: node.position.x, y: node.position.y };
};
