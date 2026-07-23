import { ALL_COLORS } from '../../constants/colors';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { getOperatorBottomBranch, getOutgoingCount, isLeafNode } from '../../utils/graphUtils';
import type { WorkflowCanvasProps } from './WorkflowCanvas.types';

type NodeCacheEntry = {
	src: WorkflowNodeModel;
	sig: string;
	onAddStep: Params['onOpenAddStep'];
	onOpenContextMenu: Params['onOpenContextMenu'];
	onDeleteNode: Params['onDeleteNode'];
	out: WorkflowNodeModel;
};

type EdgeCacheEntry = {
	src: WorkflowEdgeModel;
	highlighted: boolean;
	out: WorkflowEdgeModel;
};

type LeafInfo = { isLeaf: boolean; rightLeaf: boolean; bottomLeaf: boolean };

type TopologyCache = {
	sig: string;
	onlyStartNode: boolean;
	methodInstanceById: Map<string, { index: number; color: string }>;
	highlightedBranch: { nodeIds: Set<string>; edgeIds: Set<string> };
	leafById: Map<string, LeafInfo>;
};

export type PrepareWorkflowCache = {
	nodes: Map<string, NodeCacheEntry>;
	edges: Map<string, EdgeCacheEntry>;
	topology?: TopologyCache;
};

const computeLeafInfo = (node: WorkflowNodeModel, edges: WorkflowEdgeModel[]): LeafInfo => {
	const outgoingCount = getOutgoingCount(node.id, edges);
	const rightLeaf = node.type === 'if'
		? isLeafNode(node.id, edges, 'false')
		: node.type === 'loop'
			? isLeafNode(node.id, edges, 'right')
			: outgoingCount === 0;
	const bottomLeaf = node.type === 'if'
		? isLeafNode(node.id, edges, 'true')
		: node.type === 'loop' && isLeafNode(node.id, edges, 'bottom');
	return { isLeaf: outgoingCount === 0, rightLeaf, bottomLeaf };
};

const buildTopologySignature = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]) => {
	const nodePart = nodes
		.map((node) => [
			node.id,
			node.type,
			node.selected ? 1 : 0,
			node.data.dragGhost ? 1 : 0,
			node.data.dropPlaceholder ? 1 : 0,
			node.data.color ?? '',
			node.data.connector?.connectorId ?? '',
			node.data.subtitle ?? node.data.title ?? '',
			node.data.triggerConnection?.connectionId ?? '',
			node.data.triggerConnection?.schedulerId ?? '',
		].join(':'))
		.join('|');
	const edgePart = edges
		.map((edge) => [edge.id, edge.source, edge.target, edge.sourceHandle ?? '', edge.targetHandle ?? ''].join(':'))
		.join('|');
	return `${nodePart}#${edgePart}`;
};

type Params = Pick<
	WorkflowCanvasProps,
	'nodes' | 'edges' | 'activeAction' | 'isAnyNodeDragging' | 'onOpenAddStep' | 'onOpenContextMenu' | 'onDeleteNode'
> & { cache?: PrepareWorkflowCache };

const getMethodInstanceData = (nodes: WorkflowNodeModel[]) => {
	const result = new Map<string, { index: number; color: string }>();
	const groups = new Map<string, WorkflowNodeModel[]>();
	for (const node of nodes) {
		if (node.type !== 'connector' && node.type !== 'system' && node.type !== 'trigger-connection') continue;
		if (node.data.dragGhost || node.data.dropPlaceholder) continue;
		const key = node.type === 'trigger-connection'
			? `trigger-connection::${node.data.triggerConnection?.connectionId}::${node.data.triggerConnection?.schedulerId}`
			: `${node.data.connector?.connectorId ?? 'system'}::${node.data.subtitle ?? node.data.title}`;
		const group = groups.get(key);
		if (group) group.push(node);
		else groups.set(key, [node]);
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
	cache,
}: Params) {
	let topology = cache?.topology;
	const topologySig = buildTopologySignature(nodes, edges);
	if (!topology || topology.sig !== topologySig) {
		const selectedOperator = nodes.find((node) => node.selected && (node.type === 'if' || node.type === 'loop'));
		const leafById = new Map<string, LeafInfo>();
		for (const node of nodes) leafById.set(node.id, computeLeafInfo(node, edges));
		topology = {
			sig: topologySig,
			onlyStartNode: nodes.length === 1 && nodes[0]?.type === 'start',
			methodInstanceById: getMethodInstanceData(nodes),
			highlightedBranch: selectedOperator
				? getOperatorBottomBranch(selectedOperator.id, nodes, edges)
				: { nodeIds: new Set<string>(), edgeIds: new Set<string>() },
			leafById,
		};
		if (cache) cache.topology = topology;
	}
	const { onlyStartNode, methodInstanceById, highlightedBranch, leafById } = topology;
	const preparedNodes: WorkflowNodeModel[] = nodes.map((node) => {
		const isPreviewNode = Boolean(node.data.dragGhost || node.data.dropPlaceholder);
		const leaf = leafById.get(node.id) ?? computeLeafInfo(node, edges);

		const selectable = node.type !== 'start' && !isPreviewNode;
		const draggable = !isPreviewNode;
		const isLeaf = leaf.isLeaf;
		const nextRightLeaf = isPreviewNode ? false : leaf.rightLeaf;
		const nextBottomLeaf = isPreviewNode ? false : leaf.bottomLeaf;
		const duplicateMethodIndex = methodInstanceById.get(node.id)?.index;
		const duplicateMethodColor = methodInstanceById.get(node.id)?.color;
		const alwaysShowRightAdd = !isPreviewNode && node.type === 'start' && onlyStartNode;
		const highlighted = Boolean(node.data.highlighted) || highlightedBranch.nodeIds.has(node.id);
		const suppressHoverAddControls = isPreviewNode || activeAction?.sourceNodeId === node.id;
		const lockVisibleAddControls = !isPreviewNode && activeAction?.sourceNodeId === node.id;
		const sig = [
			selectable, draggable, isLeaf, nextRightLeaf, nextBottomLeaf,
			duplicateMethodIndex, duplicateMethodColor, alwaysShowRightAdd,
			highlighted, suppressHoverAddControls, lockVisibleAddControls, isAnyNodeDragging,
		].join('|');

		const cached = cache?.nodes.get(node.id);
		if (
			cached
			&& cached.src === node
			&& cached.sig === sig
			&& cached.onAddStep === onOpenAddStep
			&& cached.onOpenContextMenu === onOpenContextMenu
			&& cached.onDeleteNode === onDeleteNode
		) {
			return cached.out;
		}

		const out: WorkflowNodeModel = {
			...node,
			selectable,
			draggable,
			data: {
				...node.data,
				isLeaf,
				rightLeaf: nextRightLeaf,
				bottomLeaf: nextBottomLeaf,
				duplicateMethodIndex,
				duplicateMethodColor,
				alwaysShowRightAdd,
				highlighted,
				suppressHoverAddControls,
				lockVisibleAddControls,
				isAnyNodeDragging,
				onAddStep: onOpenAddStep,
				onOpenContextMenu,
				onDeleteNode,
			},
		};
		cache?.nodes.set(node.id, { src: node, sig, onAddStep: onOpenAddStep, onOpenContextMenu, onDeleteNode, out });
		return out;
	});
	const preparedEdges: WorkflowEdgeModel[] = edges.map((edge) => {
		const highlighted = Boolean(edge.data?.highlighted) || highlightedBranch.edgeIds.has(edge.id);
		const cached = cache?.edges.get(edge.id);
		if (cached && cached.src === edge && cached.highlighted === highlighted) {
			return cached.out;
		}
		const out: WorkflowEdgeModel = {
			...edge,
			data: {
				...edge.data,
				highlighted,
			},
		};
		cache?.edges.set(edge.id, { src: edge, highlighted, out });
		return out;
	});

	if (cache) {
		const liveNodeIds = new Set(nodes.map((node) => node.id));
		for (const key of cache.nodes.keys()) {
			if (!liveNodeIds.has(key)) cache.nodes.delete(key);
		}
		const liveEdgeIds = new Set(edges.map((edge) => edge.id));
		for (const key of cache.edges.keys()) {
			if (!liveEdgeIds.has(key)) cache.edges.delete(key);
		}
	}

	return { preparedEdges, preparedNodes };
}
