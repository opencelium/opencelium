import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowDropResult } from '../utils/graph.dragDrop';
import {
	buildPlaceholderEdges,
	buildPlaceholderNodes,
	buildSourceDimmedNodes,
	getPreviewPlaceholderIds,
} from './workflowDragPreview.utils';
import { clearDragPreviewEdges } from './workflowPageNodes.utils';
import type { InsertionLayout } from './workflowPage.types';

export const buildInsertionPreviewNodes = (
	layout: InsertionLayout,
	snapshotNodes: WorkflowNodeModel[],
	preview: WorkflowDropResult,
	invalid: boolean,
) => {
	const existingNodes = snapshotNodes
		.filter((node) => !layout.draggedIds.has(node.id))
		.map((node) => ({
			...node,
			position: layout.positionsByRealId.get(node.id) ?? node.position,
			data: {
				...node.data,
				highlighted: false,
				dropTarget: false,
				dropInvalid: false,
				dragGhost: false,
				dropPlaceholder: false,
				dragSourceMoving: false,
				dragSourceFaint: false,
			},
		}));
	return [
		...existingNodes,
		...buildSourceDimmedNodes(
			snapshotNodes,
			layout.draggedIds,
			true,
			layout.sourceDimmedPositionByDraggedId,
		),
		...buildPlaceholderNodes(
			preview.nodes,
			layout.placeholderIds,
			invalid,
			layout.placeholderPositionByPreviewId,
		),
	];
};

export const buildInsertionPreviewEdges = (
	sourceNodeId: string,
	snapshotNodes: WorkflowNodeModel[],
	snapshotEdges: WorkflowEdgeModel[],
	preview: WorkflowDropResult,
	invalid: boolean,
) => {
	const placeholderIds = getPreviewPlaceholderIds(
		sourceNodeId, snapshotNodes, snapshotEdges, preview.nodes, 'copy');
	const baseEdges = clearDragPreviewEdges(preview.edges)
		.filter((edge) => !placeholderIds.has(edge.source) && !placeholderIds.has(edge.target))
		.map((edge) => ({
			...edge,
			data: { ...edge.data, highlighted: false, dropTarget: false,
				dropInvalid: false, dragGhost: false, dropPlaceholder: false },
		}));
	return [...baseEdges, ...buildPlaceholderEdges(preview.edges, placeholderIds, invalid)];
};
