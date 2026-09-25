import { MarkerType } from '@xyflow/react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { OFFSETS } from './graph.constants';
import { getBottomSourceHandle, getDefaultSourceHandle,
	getDefaultTargetHandle, getRightSourceHandle } from './graph.handles';

type Direction = 'right' | 'bottom';

export const findOutgoingDropEdge = (
	nodeId: string,
	edges: WorkflowEdgeModel[],
	direction: Direction,
) => {
	const targetHandle = getDefaultTargetHandle(direction);
	return edges.find((edge) => edge.source === nodeId && (direction === 'bottom'
		? edge.targetHandle === targetHandle || edge.sourceHandle === 'true' ||
			edge.sourceHandle === 'bottom'
		: edge.targetHandle === targetHandle || edge.sourceHandle === 'false' ||
			edge.sourceHandle === 'right' || !edge.sourceHandle));
};

export const createWorkflowEdge = (source: WorkflowNodeModel,
	target: WorkflowNodeModel, direction: Direction): WorkflowEdgeModel => {
	const sourceHandle = getDefaultSourceHandle(source.type, direction);
	return {
		id: `edge-${source.id}-${target.id}-${sourceHandle ?? 'default'}-${getDefaultTargetHandle(direction)}`,
		source: source.id,
		target: target.id,
		sourceHandle,
		targetHandle: getDefaultTargetHandle(direction),
		type: 'workflow-edge',
		markerEnd: { type: MarkerType.ArrowClosed },
		data: source.type === 'if' && sourceHandle === 'true'
			? { branch: 'true' }
			: source.type === 'if' && sourceHandle === 'false'
				? { branch: 'false' } : undefined,
	};
};

const findDirectionalEdge = (source: WorkflowNodeModel,
	edges: WorkflowEdgeModel[], direction: Direction) => {
	const sourceHandle = direction === 'bottom'
		? getBottomSourceHandle(source.type) ?? 'bottom'
		: getRightSourceHandle(source.type);
	const targetHandle = getDefaultTargetHandle(direction);
	return edges.find((edge) => {
		if (edge.source !== source.id || edge.targetHandle !== targetHandle) return false;
		return sourceHandle === undefined
			? edge.sourceHandle === undefined || edge.sourceHandle === 'right'
			: edge.sourceHandle === sourceHandle;
	});
};

export const normalizeWorkflowPositions = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
) => {
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const startNode = nodes.find((node) => node.type === 'start') ?? nodes[0];
	if (!startNode) return nodes;
	const positions = new Map<string, { x: number; y: number }>();
	const visited = new Set<string>();
	const layoutFrom = (nodeId: string, position: { x: number; y: number }): number => {
		const node = nodeById.get(nodeId);
		if (!node) return position.x;
		if (visited.has(nodeId)) return positions.get(nodeId)?.x ?? position.x;
		visited.add(nodeId);
		positions.set(nodeId, position);
		let maxX = position.x;
		const bottomEdge = findDirectionalEdge(node, edges, 'bottom');
		if (bottomEdge) maxX = Math.max(maxX, layoutFrom(bottomEdge.target, {
			x: position.x + OFFSETS.bottom.x,
			y: position.y + OFFSETS.bottom.y,
		}));
		const rightEdge = findDirectionalEdge(node, edges, 'right');
		if (rightEdge) maxX = Math.max(maxX, layoutFrom(rightEdge.target, {
			x: Math.max(position.x + OFFSETS.right.x, maxX + OFFSETS.right.x),
			y: position.y + OFFSETS.right.y,
		}));
		return maxX;
	};
	layoutFrom(startNode.id, startNode.position);
	return nodes.map((node) => ({
		...node,
		position: positions.get(node.id) ?? node.position,
	}));
};
