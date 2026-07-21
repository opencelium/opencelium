import { ALL_COLORS } from '../../constants/colors';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { getOperatorBottomBranch, getOutgoingCount, isLeafNode } from '../../utils/graphUtils';
import type { WorkflowCanvasProps } from './WorkflowCanvas.types';

type Params = Pick<
	WorkflowCanvasProps,
	'nodes' | 'edges' | 'activeAction' | 'isAnyNodeDragging' | 'onOpenAddStep' | 'onOpenContextMenu' | 'onDeleteNode'
>;

const getMethodInstanceData = (nodes: WorkflowNodeModel[]) => {
	const result = new Map<string, { index: number; color: string }>();
	const groups = new Map<string, WorkflowNodeModel[]>();
	for (const node of nodes) {
		if (node.type !== 'connector' && node.type !== 'system' && node.type !== 'trigger-connection') continue;
		if (node.data.dragGhost || node.data.dropPlaceholder) continue;
		const key = node.type === 'trigger-connection'
			? `trigger-connection::${node.data.triggerConnection?.connectionId}::${node.data.triggerConnection?.schedulerId}`
			: `${node.data.connector?.connectorId ?? 'system'}::${node.data.subtitle ?? node.data.title}`;
		groups.set(key, [...(groups.get(key) ?? []), node]);
	}
	const usedColors = new Set(nodes.map((node) => node.data.color?.toLowerCase()).filter(Boolean) as string[]);
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

export function prepareWorkflowElements({
	nodes,
	edges,
	activeAction,
	isAnyNodeDragging = false,
	onOpenAddStep,
	onOpenContextMenu,
	onDeleteNode,
}: Params) {
	const onlyStartNode = nodes.length === 1 && nodes[0]?.type === 'start';
	const selectedOperator = nodes.find((node) => node.selected && (node.type === 'if' || node.type === 'loop'));
	const highlightedBranch = selectedOperator
		? getOperatorBottomBranch(selectedOperator.id, nodes, edges)
		: { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
	const methodInstanceById = getMethodInstanceData(nodes);
	const preparedNodes: WorkflowNodeModel[] = nodes.map((node) => {
		const isPreviewNode = Boolean(node.data.dragGhost || node.data.dropPlaceholder);
		const outgoingCount = getOutgoingCount(node.id, edges);
		const rightLeaf = node.type === 'if'
			? isLeafNode(node.id, edges, 'false')
			: node.type === 'loop'
				? isLeafNode(node.id, edges, 'right')
				: outgoingCount === 0;
		const bottomLeaf = node.type === 'if'
			? isLeafNode(node.id, edges, 'true')
			: node.type === 'loop' && isLeafNode(node.id, edges, 'bottom');

		return {
			...node,
			selectable: node.type !== 'start' && !isPreviewNode,
			draggable: !isPreviewNode,
			data: {
				...node.data,
				isLeaf: outgoingCount === 0,
				rightLeaf: isPreviewNode ? false : rightLeaf,
				bottomLeaf: isPreviewNode ? false : bottomLeaf,
				duplicateMethodIndex: methodInstanceById.get(node.id)?.index,
				duplicateMethodColor: methodInstanceById.get(node.id)?.color,
				alwaysShowRightAdd: !isPreviewNode && node.type === 'start' && onlyStartNode,
				highlighted: Boolean(node.data.highlighted) || highlightedBranch.nodeIds.has(node.id),
				suppressHoverAddControls: isPreviewNode || activeAction?.sourceNodeId === node.id,
				lockVisibleAddControls: !isPreviewNode && activeAction?.sourceNodeId === node.id,
				isAnyNodeDragging,
				onAddStep: onOpenAddStep,
				onOpenContextMenu,
				onDeleteNode,
			},
		};
	});
	const preparedEdges: WorkflowEdgeModel[] = edges.map((edge) => ({
		...edge,
		data: {
			...edge.data,
			highlighted: Boolean(edge.data?.highlighted) || highlightedBranch.edgeIds.has(edge.id),
		},
	}));

	return { preparedEdges, preparedNodes };
}
