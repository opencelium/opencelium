import type { ReactFlowInstance } from '@xyflow/react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { getOperatorBottomBranch } from '../utils/graph.traversal';
import type { DragDropTarget, WorkflowDragSnapshot } from './workflowPage.types';
import {
	distanceToSegment,
	DROP_EDGE_MAX_DISTANCE,
	DROP_LEAF_MAX_DISTANCE,
} from './workflowPageGraph.utils';

export const findWorkflowDropTarget = (
	instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null,
	event: { clientX?: number; clientY?: number } | undefined,
	sourceNodeId: string,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
): DragDropTarget | undefined => {
	if (!instance || typeof event?.clientX !== 'number' || typeof event?.clientY !== 'number') {
		return undefined;
	}
	const point = instance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const source = nodeById.get(sourceNodeId);
	const sourceBranch = source && (source.type === 'if' || source.type === 'loop')
		? getOperatorBottomBranch(source.id, nodes, edges)
		: { nodeIds: new Set<string>() };
	const movedNodeIds = new Set([sourceNodeId, ...sourceBranch.nodeIds]);
	const closestEdge = edges
		.filter((edge) => !movedNodeIds.has(edge.source) && !movedNodeIds.has(edge.target))
		.map<DragDropTarget | undefined>((edge) => {
			const sourceNode = nodeById.get(edge.source);
			const targetNode = nodeById.get(edge.target);
			if (!sourceNode || !targetNode || sourceNode.type === 'start' && targetNode.type === 'start') {
				return undefined;
			}
			const sourceCenter = {
				x: sourceNode.position.x + (sourceNode.measured?.width ?? sourceNode.width ?? 80) / 2,
				y: sourceNode.position.y + (sourceNode.measured?.height ?? sourceNode.height ?? 80) / 2,
			};
			const targetCenter = {
				x: targetNode.position.x + (targetNode.measured?.width ?? targetNode.width ?? 80) / 2,
				y: targetNode.position.y + (targetNode.measured?.height ?? targetNode.height ?? 80) / 2,
			};
			const direction = edge.targetHandle === 'top' ||
				edge.sourceHandle === 'true' || edge.sourceHandle === 'bottom' ? 'bottom' : 'right';
			return {
				edge,
				target: { nodeId: edge.source, direction },
				distance: distanceToSegment(point, sourceCenter, targetCenter),
			};
		})
		.filter((target): target is DragDropTarget => target !== undefined)
		.sort((left, right) => left.distance - right.distance)[0];
	if (closestEdge && closestEdge.distance <= DROP_EDGE_MAX_DISTANCE) return closestEdge;

	return nodes.filter((node) => node.type !== 'start' && !movedNodeIds.has(node.id))
		.map((node): DragDropTarget => {
			const width = node.measured?.width ?? node.width ?? 80;
			const height = node.measured?.height ?? node.height ?? 80;
			const center = { x: node.position.x + width / 2, y: node.position.y + height / 2 };
			const direction = (node.type === 'if' || node.type === 'loop') &&
				Math.abs(point.x - center.x) < width && point.y > center.y ? 'bottom' : 'right';
			const anchor = direction === 'bottom'
				? { x: center.x, y: node.position.y + height + 30 }
				: { x: node.position.x + width + 30, y: center.y };
			return { target: { nodeId: node.id, direction },
				distance: Math.hypot(point.x - anchor.x, point.y - anchor.y) };
		})
		.sort((left, right) => left.distance - right.distance)
		.find((target) => target.distance <= DROP_LEAF_MAX_DISTANCE);
};

export const resolveStickyDropTarget = (
	snapshot: WorkflowDragSnapshot,
	nextTarget: DragDropTarget | undefined,
) => {
	const activeEdge = snapshot.activeDropTarget?.edge;
	if (activeEdge && nextTarget && !nextTarget.edge &&
		nextTarget.target.direction === 'right' && nextTarget.target.nodeId === activeEdge.target) {
		return snapshot.activeDropTarget;
	}
	snapshot.activeDropTarget = nextTarget;
	return nextTarget;
};

export const getDragSubtreeNodeIds = (
	sourceNodeId: string,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
) => {
	const source = nodes.find((node) => node.id === sourceNodeId);
	if (!source) return new Set<string>();
	if (source.type !== 'if' && source.type !== 'loop') return new Set([sourceNodeId]);
	return new Set([sourceNodeId, ...getOperatorBottomBranch(source.id, nodes, edges).nodeIds]);
};
