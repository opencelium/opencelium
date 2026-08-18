import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import {
	clearDragFlags,
	clearDragPreviewEdges,
	clearDragPreviewNodes,
	clearEdgeDragFlags,
} from './workflowPageNodes.utils';
import { sanitizeGraphEdges, sanitizeGraphNodes } from './workflowPageGraph.utils';
import type { WorkflowDragSnapshot } from './workflowPage.types';

const restoreGraph = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]) => {
	const restoredNodes = sanitizeGraphNodes(clearDragFlags(clearDragPreviewNodes(nodes)));
	const restoredEdges = sanitizeGraphEdges(
		restoredNodes,
		clearEdgeDragFlags(clearDragPreviewEdges(edges)),
	);
	return { nodes: restoredNodes, edges: restoredEdges };
};

export const restoreDragSnapshotGraph = (snapshot: WorkflowDragSnapshot) =>
	restoreGraph(snapshot.nodes, snapshot.edges);

export const buildFreeRepositionedGraph = (
	snapshot: WorkflowDragSnapshot,
	sourceNodeId: string,
) => {
	const snapshotRoot = snapshot.nodes.find((node) => node.id === sourceNodeId);
	const ghostRoot = snapshot.lastGhostRootPosition;
	if (!snapshotRoot || !ghostRoot ||
		!Number.isFinite(ghostRoot.x) || !Number.isFinite(ghostRoot.y)) {
		return restoreDragSnapshotGraph(snapshot);
	}
	const delta = {
		x: ghostRoot.x - snapshotRoot.position.x,
		y: ghostRoot.y - snapshotRoot.position.y,
	};
	const repositioned = snapshot.nodes.map((node) => node.id === sourceNodeId
		? { ...node, position: {
			x: node.position.x + delta.x,
			y: node.position.y + delta.y,
		} }
		: node);
	return restoreGraph(repositioned, snapshot.edges);
};
