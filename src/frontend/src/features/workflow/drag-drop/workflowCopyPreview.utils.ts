import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowDropMode, WorkflowDropResult } from '../utils/graph.dragDrop';
import { getDragSubtreeNodeIds } from './workflowDropTarget.utils';
import { COPY_PREVIEW_PREFIX } from './workflowPageGraph.utils';
import type { InsertionLayout, WorkflowPosition } from './workflowPage.types';

const buildCopiedPlaceholderPositions = (
	idMap: Map<string, string> | undefined,
	layout: InsertionLayout,
) => {
	const positions = new Map<string, WorkflowPosition>();
	(idMap ?? new Map<string, string>()).forEach((finalId, sourceId) => {
		const position = layout.placeholderPositionByDraggedId.get(sourceId);
		if (position) positions.set(finalId, position);
	});
	return positions;
};

export const applyInsertionPreviewPositions = (
	mode: WorkflowDropMode,
	nodes: WorkflowNodeModel[],
	idMap: Map<string, string> | undefined,
	layout: InsertionLayout,
) => {
	if (mode === 'move') {
		return nodes.map((node) => {
			const moved = layout.placeholderPositionByDraggedId.get(node.id);
			if (moved) return { ...node, position: moved };
			const existing = layout.positionsByRealId.get(node.id);
			return existing ? { ...node, position: existing } : node;
		});
	}
	const copiedPositions = buildCopiedPlaceholderPositions(idMap, layout);
	return nodes.map((node) => {
		const copied = copiedPositions.get(node.id);
		if (copied) return { ...node, position: copied };
		const original = layout.sourcePositionByDraggedId.get(node.id);
		if (original) return { ...node, position: original };
		const existing = layout.positionsByRealId.get(node.id);
		return existing ? { ...node, position: existing } : node;
	});
};

export const stabilizeCopyPreviewIds = (
	sourceNodeId: string,
	snapshotNodes: WorkflowNodeModel[],
	snapshotEdges: WorkflowEdgeModel[],
	preview: WorkflowDropResult,
): WorkflowDropResult => {
	const snapshotIds = new Set(snapshotNodes.map((node) => node.id));
	const copiedNodes = preview.nodes.filter((node) => !snapshotIds.has(node.id));
	if (copiedNodes.length === 0) return preview;
	const subtreeIds = getDragSubtreeNodeIds(sourceNodeId, snapshotNodes, snapshotEdges);
	const sourceIds = snapshotNodes.filter((node) => subtreeIds.has(node.id)).map((node) => node.id);
	const idMap = new Map(copiedNodes.map((node, index) => [
		node.id,
		`${COPY_PREVIEW_PREFIX}${sourceIds[index] ?? index}`,
	]));
	return {
		...preview,
		nodes: preview.nodes.map((node) =>
			idMap.has(node.id) ? { ...node, id: idMap.get(node.id) ?? node.id } : node),
		edges: preview.edges.map((edge) => {
			const source = idMap.get(edge.source) ?? edge.source;
			const target = idMap.get(edge.target) ?? edge.target;
			return source === edge.source && target === edge.target ? edge : {
				...edge,
				id: `edge-${source}-${target}-${edge.sourceHandle ?? 'default'}-${edge.targetHandle ?? 'default'}`,
				source,
				target,
			};
		}),
	};
};
