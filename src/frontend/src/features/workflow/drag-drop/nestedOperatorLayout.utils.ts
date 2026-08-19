import type { WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowDropResult } from '../utils/graph.dragDrop';
import { COPY_PREVIEW_PREFIX } from './workflowPageGraph.utils';
import type { InsertionLayout, WorkflowPosition } from './workflowPage.types';

type Params = {
	snapshotNodes: WorkflowNodeModel[];
	draggedNodes: WorkflowNodeModel[];
	draggedIds: Set<string>;
	placeholderIds: Set<string>;
	preview: WorkflowDropResult;
};

export const buildNestedOperatorLayout = ({
	snapshotNodes,
	draggedNodes,
	draggedIds,
	placeholderIds,
	preview,
}: Params): InsertionLayout | null => {
	const operatorCount = draggedNodes.filter((node) =>
		node.type === 'if' || node.type === 'loop').length;
	if (operatorCount <= 1) return null;

	const previewPositions = new Map(preview.nodes.map((node) => [node.id, node.position]));
	const positionsByRealId = new Map<string, WorkflowPosition>();
	snapshotNodes.filter((node) => !draggedIds.has(node.id)).forEach((node) => {
		const position = previewPositions.get(node.id);
		positionsByRealId.set(node.id, position
			? { x: position.x, y: position.y }
			: { x: node.position.x, y: node.position.y });
	});

	const placeholderPositionByDraggedId = new Map<string, WorkflowPosition>();
	const placeholderPositionByPreviewId = new Map<string, WorkflowPosition>();
	preview.nodes.filter((node) => placeholderIds.has(node.id)).forEach((node) => {
		const position = { x: node.position.x, y: node.position.y };
		placeholderPositionByDraggedId.set(node.id.slice(COPY_PREVIEW_PREFIX.length), position);
		placeholderPositionByPreviewId.set(node.id, position);
	});

	const sourcePositionByDraggedId = new Map<string, WorkflowPosition>();
	const sourceDimmedPositionByDraggedId = new Map<string, WorkflowPosition>();
	draggedNodes.forEach((node) => {
		const previewPosition = previewPositions.get(node.id);
		sourcePositionByDraggedId.set(node.id, previewPosition
			? { x: previewPosition.x, y: previewPosition.y }
			: { x: node.position.x, y: node.position.y });
		sourceDimmedPositionByDraggedId.set(node.id,
			{ x: node.position.x, y: node.position.y });
	});

	return {
		draggedIds,
		placeholderIds,
		positionsByRealId,
		sourcePositionByDraggedId,
		sourceDimmedPositionByDraggedId,
		placeholderPositionByDraggedId,
		placeholderPositionByPreviewId,
	};
};
