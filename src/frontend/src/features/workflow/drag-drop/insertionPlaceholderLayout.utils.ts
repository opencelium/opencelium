import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowDropResult } from '../utils/graph.dragDrop';
import { OFFSETS } from '../utils/graph.constants';
import { collectDescendantNodeIds, getOperatorBottomBranch } from '../utils/graph.traversal';
import { getShiftedNodePosition } from './removalGapLayout.utils';
import {
	boundsFromPosition,
	COPY_PREVIEW_PREFIX,
	resolvePlaceholderCollision,
} from './workflowPageGraph.utils';
import type { DragDropTarget, WorkflowPosition } from './workflowPage.types';

type Params = {
	dropTarget: DragDropTarget;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	draggedNodes: WorkflowNodeModel[];
	draggedIds: Set<string>;
	placeholderIds: Set<string>;
	downstreamIds: Set<string>;
	removalShifts: Map<string, WorkflowPosition>;
	preview: WorkflowDropResult;
	sourceNodeId: string;
};

export const buildInsertionPlaceholderPositions = ({
	dropTarget, nodes, edges, draggedNodes, draggedIds, placeholderIds,
	downstreamIds, removalShifts, preview, sourceNodeId,
}: Params) => {
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const anchor = nodeById.get(dropTarget.target.nodeId);
	const draggedRoot = nodeById.get(sourceNodeId);
	const direction = dropTarget.target.direction;
	const positionOf = (node: WorkflowNodeModel) =>
		getShiftedNodePosition(node, removalShifts);
	const anchorDescendants = anchor
		? collectDescendantNodeIds(anchor.id, edges)
		: new Set<string>();
	const occupiedBounds = nodes.filter((node) =>
		anchorDescendants.has(node.id) && node.id !== dropTarget.target.nodeId &&
		!downstreamIds.has(node.id) && !draggedIds.has(node.id))
		.map((node) => {
			const position = positionOf(node);
			const width = node.measured?.width ?? node.width ?? 96;
			const height = node.measured?.height ?? node.height ?? 96;
			return { minX: position.x, minY: position.y,
				maxX: position.x + width, maxY: position.y + height };
		});

	let clearX = anchor ? positionOf(anchor).x : 0;
	if (anchor && direction === 'right' && (anchor.type === 'if' || anchor.type === 'loop')) {
		getOperatorBottomBranch(anchor.id, nodes, edges).nodeIds.forEach((id) => {
			const branchNode = nodeById.get(id);
			if (branchNode && !draggedIds.has(id)) {
				clearX = Math.max(clearX, positionOf(branchNode).x);
			}
		});
	}
	const offset = OFFSETS[direction];
	const base = anchor && draggedRoot
		? { x: clearX + offset.x, y: positionOf(anchor).y + offset.y }
		: undefined;
	const byDraggedId = new Map<string, WorkflowPosition>();
	const byPreviewId = new Map<string, WorkflowPosition>();
	if (!base || !draggedRoot) return { byDraggedId, byPreviewId };
	const initial = new Map<string, WorkflowPosition>();
	draggedNodes.forEach((node) => initial.set(node.id, {
		x: base.x + node.position.x - draggedRoot.position.x,
		y: base.y + node.position.y - draggedRoot.position.y,
	}));
	const collisionShift = resolvePlaceholderCollision(
		[...initial.values()].map(boundsFromPosition), occupiedBounds, direction);
	draggedNodes.forEach((node) => {
		const position = initial.get(node.id) ?? base;
		byDraggedId.set(node.id, {
			x: position.x + collisionShift.x,
			y: position.y + collisionShift.y,
		});
	});
	preview.nodes.filter((node) => placeholderIds.has(node.id)).forEach((node) => {
		const position = byDraggedId.get(node.id.slice(COPY_PREVIEW_PREFIX.length));
		if (position) byPreviewId.set(node.id, position);
	});
	return { byDraggedId, byPreviewId };
};
