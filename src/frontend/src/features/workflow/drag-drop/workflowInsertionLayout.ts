import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowDropMode, WorkflowDropResult } from '../utils/graph.dragDrop';
import { findInsertionRoomTarget } from './insertionRoomTarget.utils';
import { buildInsertionNodePositions } from './insertionNodeShift.utils';
import { buildInsertionPlaceholderPositions } from './insertionPlaceholderLayout.utils';
import { buildNestedOperatorLayout } from './nestedOperatorLayout.utils';
import { buildRemovalShiftById } from './removalGapLayout.utils';
import { getDragSubtreeNodeIds } from './workflowDropTarget.utils';
import { getPreviewPlaceholderIds } from './workflowDragPreview.utils';
import type { DragDropTarget, InsertionLayout } from './workflowPage.types';

export const computeInsertionLayout = (
	dropTarget: DragDropTarget,
	sourceNodeId: string,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	preview: WorkflowDropResult,
	mode: WorkflowDropMode,
	includeRemovalGapFill: boolean,
): InsertionLayout => {
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const draggedIds = getDragSubtreeNodeIds(sourceNodeId, nodes, edges);
	const placeholderIds = getPreviewPlaceholderIds(sourceNodeId, nodes, edges, preview.nodes, 'copy');
	const draggedNodes = nodes.filter((node) => draggedIds.has(node.id));
	const draggedRoot = nodeById.get(sourceNodeId);
	const nestedLayout = buildNestedOperatorLayout({
		snapshotNodes: nodes,
		draggedNodes,
		draggedIds,
		placeholderIds,
		preview,
	});
	if (nestedLayout) return nestedLayout;

	const removalShifts = buildRemovalShiftById(
		mode, includeRemovalGapFill, nodes, edges, draggedIds);
	const { downstreamIds, makeRoomRoot } = findInsertionRoomTarget(dropTarget, nodes, edges);
	const placeholderPositions = buildInsertionPlaceholderPositions({
		dropTarget,
		nodes,
		edges,
		draggedNodes,
		draggedIds,
		placeholderIds,
		downstreamIds,
		removalShifts,
		preview,
		sourceNodeId,
	});
	const shiftedPositions = buildInsertionNodePositions({
		nodes,
		edges,
		draggedNodes,
		draggedIds,
		draggedRoot,
		makeRoomRoot,
		placeholderPositions: placeholderPositions.byDraggedId,
		removalShifts,
	});
	return {
		draggedIds,
		placeholderIds,
		positionsByRealId: shiftedPositions.positionsByRealId,
		sourcePositionByDraggedId: shiftedPositions.sourcePositionByDraggedId,
		sourceDimmedPositionByDraggedId: shiftedPositions.sourceDimmedPositionByDraggedId,
		placeholderPositionByDraggedId: placeholderPositions.byDraggedId,
		placeholderPositionByPreviewId: placeholderPositions.byPreviewId,
	};
};
