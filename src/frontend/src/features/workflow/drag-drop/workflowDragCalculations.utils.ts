import type { ReactFlowInstance } from '@xyflow/react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import {
	moveOrCopyWorkflowNodes,
	type WorkflowDropMode,
	type WorkflowDropResult,
} from '../utils/graph.dragDrop';
import { stabilizeCopyPreviewIds } from './workflowCopyPreview.utils';
import type { DragDropTarget, WorkflowDragSnapshot, WorkflowPosition } from './workflowPage.types';

export const buildPreviewGraphForTarget = (
	sourceNodeId: string,
	target: DragDropTarget['target'],
	mode: WorkflowDropMode,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	fieldBindings?: any[],
): { preview: WorkflowDropResult; invalid: boolean } => {
	const layout = moveOrCopyWorkflowNodes({
		sourceNodeId,
		target,
		mode: 'copy',
		nodes,
		edges,
		fieldBindings,
	});
	const preview = stabilizeCopyPreviewIds(sourceNodeId, nodes, edges, layout);
	const invalid = mode === 'copy'
		? layout.invalidReferences.length > 0
		: moveOrCopyWorkflowNodes({
			sourceNodeId,
			target,
			mode,
			nodes,
			edges,
			fieldBindings,
		}).invalidReferences.length > 0;
	return { preview, invalid };
};

export const computeGhostRootPosition = (
	instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null,
	event: { clientX?: number; clientY?: number } | undefined,
	snapshot: WorkflowDragSnapshot,
): WorkflowPosition | undefined => {
	const offset = snapshot.pointerOffsetFromRoot;
	if (!instance || !offset ||
		typeof event?.clientX !== 'number' || typeof event?.clientY !== 'number') {
		return undefined;
	}
	const pointer = instance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
	return { x: pointer.x - offset.x, y: pointer.y - offset.y };
};
