import { ALL_COLORS } from '../../constants/colors';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { getOperatorBottomBranch, getOutgoingCount, isLeafNode } from '../../utils/graphUtils';
import type { LeafInfo, WorkflowTopology } from './prepareWorkflowElements.types';

export const computeLeafInfo = (
	node: WorkflowNodeModel,
	edges: WorkflowEdgeModel[],
): LeafInfo => {
	const outgoingCount = getOutgoingCount(node.id, edges);
	const rightLeaf = node.type === 'if'
		? isLeafNode(node.id, edges, 'false')
		: node.type === 'loop' ? isLeafNode(node.id, edges, 'right') : outgoingCount === 0;
	const bottomLeaf = node.type === 'if'
		? isLeafNode(node.id, edges, 'true')
		: node.type === 'loop' && isLeafNode(node.id, edges, 'bottom');
	return { isLeaf: outgoingCount === 0, rightLeaf, bottomLeaf };
};

const buildTopologySignature = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]) => {
	const nodePart = nodes.map((node) => [
		node.id, node.type, node.selected ? 1 : 0,
		node.data.dragGhost ? 1 : 0, node.data.dropPlaceholder ? 1 : 0,
		node.data.color ?? '', node.data.connector?.connectorId ?? '',
		node.data.subtitle ?? node.data.title ?? '',
		node.data.triggerConnection?.connectionId ?? '',
		node.data.triggerConnection?.schedulerId ?? '',
	].join(':')).join('|');
	const edgePart = edges.map((edge) => [
		edge.id, edge.source, edge.target, edge.sourceHandle ?? '', edge.targetHandle ?? '',
	].join(':')).join('|');
	return `${nodePart}#${edgePart}`;
};

const getMethodInstanceData = (nodes: WorkflowNodeModel[]) => {
	const result = new Map<string, { index: number; color: string }>();
	const groups = new Map<string, WorkflowNodeModel[]>();
	for (const node of nodes) {
		if (!['connector', 'system', 'trigger-connection'].includes(node.type)) continue;
		if (node.data.dragGhost || node.data.dropPlaceholder) continue;
		const key = node.type === 'trigger-connection'
			? `trigger-connection::${node.data.triggerConnection?.connectionId}::${node.data.triggerConnection?.schedulerId}`
			: `${node.data.connector?.connectorId ?? 'system'}::${node.data.subtitle ?? node.data.title}`;
		const group = groups.get(key);
		if (group) group.push(node);
		else groups.set(key, [node]);
	}
	const usedColors = new Set(nodes.map((node) => node.data.color?.toLowerCase())
		.filter(Boolean) as string[]);
	for (const members of groups.values()) {
		if (members.length < 2) continue;
		members.forEach((member, index) => {
			let color = member.data.color;
			if (!color) {
				color = ALL_COLORS.find((candidate) => !usedColors.has(candidate.toLowerCase()))
					?? ALL_COLORS[index % ALL_COLORS.length];
				usedColors.add(color.toLowerCase());
			}
			result.set(member.id, { index: index + 1, color });
		});
	}
	return result;
};

export const buildWorkflowTopology = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
): WorkflowTopology => {
	const selectedOperator = nodes.find((node) =>
		node.selected && (node.type === 'if' || node.type === 'loop'));
	const leafById = new Map<string, LeafInfo>();
	for (const node of nodes) leafById.set(node.id, computeLeafInfo(node, edges));
	return {
		sig: buildTopologySignature(nodes, edges),
		onlyStartNode: nodes.length === 1 && nodes[0]?.type === 'start',
		methodInstanceById: getMethodInstanceData(nodes),
		highlightedBranch: selectedOperator
			? getOperatorBottomBranch(selectedOperator.id, nodes, edges)
			: { nodeIds: new Set<string>(), edgeIds: new Set<string>() },
		leafById,
	};
};

export const hasSameWorkflowTopology = (
	topology: WorkflowTopology | undefined,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
) => topology?.sig === buildTopologySignature(nodes, edges);
