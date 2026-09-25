import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowDropMode } from '../utils/graph.dragDrop';
import { getDragSubtreeNodeIds } from './workflowDropTarget.utils';
import { DROP_PLACEHOLDER_PREFIX } from './workflowPageGraph.utils';
import type { WorkflowPosition } from './workflowPage.types';

export const buildFreeDragNodes = (
	sourceNodeId: string,
	nodes: WorkflowNodeModel[],
	delta: WorkflowPosition,
) => nodes.map((node) => {
	const isGrabbed = node.id === sourceNodeId;
	return {
		...node,
		position: isGrabbed
			? { x: node.position.x + delta.x, y: node.position.y + delta.y }
			: node.position,
		data: {
			...node.data,
			highlighted: false,
			dropTarget: false,
			dropInvalid: false,
			dragGhost: false,
			dropPlaceholder: false,
			dragSourceMoving: false,
			dragSourceFaint: false,
			hideAddControls: isGrabbed,
			suppressHoverAddControls: isGrabbed,
		},
	};
}) as WorkflowNodeModel[];

export const buildSourceDimmedNodes = (
	nodes: WorkflowNodeModel[],
	draggedIds: Set<string>,
	faint: boolean,
	positions?: Map<string, WorkflowPosition>,
) => nodes.filter((node) => draggedIds.has(node.id)).map((node) => ({
	...node,
	position: positions?.get(node.id) ?? node.position,
	selected: false,
	draggable: false,
	selectable: false,
	data: {
		...node.data,
		dragGhost: false,
		dropPlaceholder: false,
		dragSourceMoving: true,
		dragSourceFaint: faint,
		hideAddControls: true,
		suppressHoverAddControls: true,
		lockVisibleAddControls: false,
		highlighted: false,
		dropTarget: false,
		dropInvalid: false,
	},
})) as WorkflowNodeModel[];

export const getPreviewPlaceholderIds = (
	sourceNodeId: string,
	snapshotNodes: WorkflowNodeModel[],
	snapshotEdges: WorkflowEdgeModel[],
	previewNodes: WorkflowNodeModel[],
	mode: WorkflowDropMode,
) => {
	if (mode === 'move') return getDragSubtreeNodeIds(sourceNodeId, snapshotNodes, snapshotEdges);
	const snapshotIds = new Set(snapshotNodes.map((node) => node.id));
	return new Set(previewNodes.filter((node) => !snapshotIds.has(node.id)).map((node) => node.id));
};

export const buildPlaceholderNodes = (
	nodes: WorkflowNodeModel[],
	placeholderIds: Set<string>,
	invalid: boolean,
	positions?: Map<string, WorkflowPosition>,
) => nodes.filter((node) => placeholderIds.has(node.id)).map((node) => ({
	...node,
	id: `${DROP_PLACEHOLDER_PREFIX}${node.id}`,
	position: positions?.get(node.id) ?? node.position,
	selected: false,
	draggable: false,
	selectable: false,
	data: { ...node.data, dragGhost: false, dropPlaceholder: true,
		dragSourceMoving: false, dragSourceFaint: false, highlighted: false,
		dropTarget: true, dropInvalid: invalid, suppressHoverAddControls: true,
		lockVisibleAddControls: false, hideAddControls: true },
})) as WorkflowNodeModel[];

export const buildPlaceholderEdges = (
	edges: WorkflowEdgeModel[],
	placeholderIds: Set<string>,
	invalid: boolean,
) => edges.filter((edge) => placeholderIds.has(edge.source) || placeholderIds.has(edge.target))
	.map((edge) => ({
		...edge,
		id: `${DROP_PLACEHOLDER_PREFIX}${edge.id}`,
		source: placeholderIds.has(edge.source) ? `${DROP_PLACEHOLDER_PREFIX}${edge.source}` : edge.source,
		target: placeholderIds.has(edge.target) ? `${DROP_PLACEHOLDER_PREFIX}${edge.target}` : edge.target,
		selected: false,
		data: { ...edge.data, dragGhost: false, dropPlaceholder: true,
			highlighted: false, dropTarget: true, dropInvalid: invalid },
	})) as WorkflowEdgeModel[];
