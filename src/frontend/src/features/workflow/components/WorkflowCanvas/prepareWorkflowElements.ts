import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import type { PrepareWorkflowParams } from './prepareWorkflowElements.types';
import { buildWorkflowTopology, computeLeafInfo, hasSameWorkflowTopology } from './workflowTopology';

export type { PrepareWorkflowCache } from './prepareWorkflowElements.types';

export function prepareWorkflowElements({
	nodes,
	edges,
	activeAction,
	isAnyNodeDragging = false,
	onOpenAddStep,
	onOpenContextMenu,
	onDeleteNode,
	onOpenAggregatorEditor,
	cache,
}: PrepareWorkflowParams) {
	let topology = cache?.topology;
	if (!topology || !hasSameWorkflowTopology(topology, nodes, edges)) {
		topology = buildWorkflowTopology(nodes, edges);
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
			&& cached.onOpenAggregatorEditor === onOpenAggregatorEditor
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
				onOpenAggregatorEditor,
			},
		};
		cache?.nodes.set(node.id, { src: node, sig, onAddStep: onOpenAddStep, onOpenContextMenu, onDeleteNode, onOpenAggregatorEditor, out });
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
