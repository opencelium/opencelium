import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

const bottomHandle = (node: WorkflowNodeModel) => {
	if (node.type === 'if') return 'true';
	if (node.type === 'loop') return 'bottom';
	return undefined;
};

const rightHandle = (node: WorkflowNodeModel) => {
	if (node.type === 'if') return 'false';
	if (node.type === 'loop') return 'right';
	return undefined;
};

const findOutgoingEdge = (
	edges: WorkflowEdgeModel[],
	nodes: Map<string, WorkflowNodeModel>,
	nodeId: string,
	sourceHandle: string | undefined,
	direction: 'right' | 'bottom',
	visited: Set<string>,
) => {
	const sourceNode = nodes.get(nodeId);
	const targetHandle = direction === 'bottom' ? 'top' : 'left';
	return edges
		.filter((edge) => edge.source === nodeId && (edge.sourceHandle ?? undefined) === sourceHandle)
		.filter((edge) => !visited.has(edge.target))
		.filter((edge) => !edge.targetHandle || edge.targetHandle === targetHandle)
		.filter((edge) => nodes.has(edge.target))
		.sort((left, right) => {
			const leftNode = nodes.get(left.target);
			const rightNode = nodes.get(right.target);
			if (!sourceNode || !leftNode || !rightNode) return 0;
			const leftDistance = direction === 'right'
				? Math.abs(leftNode.position.y - sourceNode.position.y)
				: Math.abs(leftNode.position.x - sourceNode.position.x);
			const rightDistance = direction === 'right'
				? Math.abs(rightNode.position.y - sourceNode.position.y)
				: Math.abs(rightNode.position.x - sourceNode.position.x);
			if (leftDistance !== rightDistance) return leftDistance - rightDistance;
			return direction === 'right'
				? leftNode.position.x - rightNode.position.x
				: leftNode.position.y - rightNode.position.y;
		})[0];
};

export const buildWorkflowIndexes = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
) => {
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const indexes = new Map<string, string>();
	const visited = new Set<string>();
	const walkChain = (
		sourceId: string,
		sourceHandle: string | undefined,
		direction: 'right' | 'bottom',
		prefix?: string,
	) => {
		let edge = findOutgoingEdge(edges, nodeById, sourceId, sourceHandle, direction, visited);
		let order = 0;
		while (edge) {
			const node = nodeById.get(edge.target);
			if (!node || visited.has(node.id)) break;
			const nodeIndex = prefix ? `${prefix}_${order}` : String(order);
			indexes.set(node.id, nodeIndex);
			visited.add(node.id);
			const childHandle = bottomHandle(node);
			if (childHandle) walkChain(node.id, childHandle, 'bottom', nodeIndex);
			edge = findOutgoingEdge(edges, nodeById, node.id, rightHandle(node), 'right', visited);
			order += 1;
		}
	};
	walkChain('start-1', undefined, 'right');
	return indexes;
};
