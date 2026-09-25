import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { getRightSourceHandle } from '../utils/graph.handles';
import { collectDescendantNodeIds, getOperatorBottomBranch } from '../utils/graph.traversal';
import type { DragDropTarget } from './workflowPage.types';

export const findInsertionRoomTarget = (
	dropTarget: DragDropTarget,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
) => {
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const direction = dropTarget.target.direction;
	const continuationHandle = direction === 'bottom' ? 'top' : 'left';
	const continuationEdge = dropTarget.edge ?? edges.find((edge) =>
		edge.source === dropTarget.target.nodeId &&
		(direction === 'bottom'
			? edge.targetHandle === continuationHandle ||
				edge.sourceHandle === 'true' || edge.sourceHandle === 'bottom'
			: edge.targetHandle === continuationHandle || edge.sourceHandle === 'false' ||
				edge.sourceHandle === 'right' || !edge.sourceHandle));
	const downstreamRoot = continuationEdge
		? nodeById.get(continuationEdge.target)
		: undefined;
	const downstreamIds = downstreamRoot
		? collectDescendantNodeIds(downstreamRoot.id, edges)
		: new Set<string>();
	if (downstreamRoot || direction !== 'right') {
		return { downstreamIds, makeRoomRoot: downstreamRoot };
	}

	const branchOwner = nodes.filter((node) => {
		if (node.type !== 'if' && node.type !== 'loop') return false;
		return getOperatorBottomBranch(node.id, nodes, edges)
			.nodeIds.has(dropTarget.target.nodeId);
	}).sort((left, right) =>
		getOperatorBottomBranch(left.id, nodes, edges).nodeIds.size -
		getOperatorBottomBranch(right.id, nodes, edges).nodeIds.size)[0];
	const rightEdge = branchOwner ? edges.find((edge) =>
		edge.source === branchOwner.id &&
		edge.sourceHandle === getRightSourceHandle(branchOwner.type)) : undefined;
	return {
		downstreamIds,
		makeRoomRoot: rightEdge ? nodeById.get(rightEdge.target) : undefined,
	};
};
