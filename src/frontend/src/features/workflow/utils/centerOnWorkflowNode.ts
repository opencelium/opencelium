import type { ReactFlowInstance } from '@xyflow/react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

/**
 * Pans (keeping the current zoom) so the given node sits in the middle of the
 * viewport. Deferred a frame so a node that was just added — or a graph that is
 * re-rendering behind a dialog on its way out — has been measured by then.
 */
export const centerOnWorkflowNode = (
	instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null,
	nodeId: string,
) => {
	const node = instance?.getNode(nodeId);
	if (!instance || !node) return;
	requestAnimationFrame(() => instance.setCenter(
		node.position.x + (node.measured?.width ?? 0) / 2,
		node.position.y + (node.measured?.height ?? 0) / 2,
		{ zoom: instance.getZoom(), duration: 200 },
	));
};
