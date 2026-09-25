import type { ReactFlowInstance } from '@xyflow/react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type {
	DragDropTarget,
	UseWorkflowPageOptions,
	WorkflowDragSnapshot,
} from './workflowPage.types';
import { findWorkflowDropTarget, getDragSubtreeNodeIds } from './workflowDropTarget.utils';
import { buildPreviewGraphForTarget } from './workflowDragCalculations.utils';
import { computeInsertionLayout } from './workflowInsertionLayout';
import { applyInsertionPreviewPositions } from './workflowCopyPreview.utils';
import { restoreStableNodeData } from './workflowPageNodes.utils';

export function resolveDragCommit(
	instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null,
	event: { clientX?: number; clientY?: number } | undefined,
	sourceNodeId: string,
	snapshot: WorkflowDragSnapshot,
	fieldBindings?: NonNullable<UseWorkflowPageOptions['fieldBindings']>,
) {
	const releasedTarget = findWorkflowDropTarget(
		instance, event, sourceNodeId, snapshot.nodes, snapshot.edges,
	);
	const storedPreview = snapshot.lastInsertionPreview?.sourceNodeId === sourceNodeId
		? snapshot.lastInsertionPreview : undefined;
	const dropTarget: DragDropTarget | undefined = releasedTarget ?? (storedPreview ? {
		target: { nodeId: storedPreview.targetNodeId, direction: storedPreview.direction },
		distance: 0,
	} : undefined);
	if (!dropTarget) return {};
	const { preview } = buildPreviewGraphForTarget(sourceNodeId, dropTarget.target,
		snapshot.mode, snapshot.nodes, snapshot.edges, fieldBindings);
	return {
		target: dropTarget.target,
		layout: computeInsertionLayout(dropTarget, sourceNodeId, snapshot.nodes,
			snapshot.edges, preview, snapshot.mode, true),
	};
}

export function positionDragCommit(
	sourceNodeId: string,
	snapshot: WorkflowDragSnapshot,
	nodes: WorkflowNodeModel[],
	idMap: Map<string, string> | undefined,
	layout: NonNullable<ReturnType<typeof resolveDragCommit>['layout']>,
) {
	const restored = restoreStableNodeData(nodes, snapshot.nodes, snapshot.operatorConfigs);
	const draggedIds = getDragSubtreeNodeIds(sourceNodeId, snapshot.nodes, snapshot.edges);
	const hasNestedOperators = snapshot.nodes.filter((node) =>
		draggedIds.has(node.id) && ['if', 'loop'].includes(node.type ?? '')).length > 1;
	return hasNestedOperators ? restored
		: applyInsertionPreviewPositions(snapshot.mode, restored, idMap, layout);
}
