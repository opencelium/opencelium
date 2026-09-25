import type { Dispatch, SetStateAction } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowDragSnapshot } from '../drag-drop/workflowPage.types';
import { buildFreeRepositionedGraph, restoreDragSnapshotGraph } from '../drag-drop/workflowDragRestore.utils';

type Snapshot = NonNullable<WorkflowDragSnapshot>;

export const useWorkflowDragPreviewState = (
	setNodes: Dispatch<SetStateAction<WorkflowNodeModel[]>>,
	setEdges: Dispatch<SetStateAction<WorkflowEdgeModel[]>>,
) => {
	const updateEdges = (snapshot: Snapshot, key: string, edges: WorkflowEdgeModel[]) => {
		if (snapshot.previewEdgeKey === key) return;
		snapshot.previewEdgeKey = key;
		setEdges(edges);
	};
	const updateNodes = (
		snapshot: Snapshot,
		key: string,
		buildNodes: () => WorkflowNodeModel[],
	) => {
		if (snapshot.previewNodeKey === key) return;
		snapshot.previewNodeKey = key;
		setNodes(buildNodes());
	};
	const clear = (snapshot: Snapshot) => {
		const restored = restoreDragSnapshotGraph(snapshot);
		setNodes(restored.nodes);
		setEdges(restored.edges);
	};
	const commitFreeReposition = (snapshot: Snapshot, sourceNodeId: string) => {
		const restored = buildFreeRepositionedGraph(snapshot, sourceNodeId);
		setNodes(restored.nodes);
		setEdges(restored.edges);
	};

	return { updateEdges, updateNodes, clear, commitFreeReposition };
};
