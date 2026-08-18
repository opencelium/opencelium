import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import type { PrepareWorkflowParams } from './prepareWorkflowElements.types';
import { buildWorkflowTopology, computeLeafInfo, hasSameWorkflowTopology } from './workflowTopology';
import { EMPTY_TEST_RUN_SCOPE } from './testRunScope.utils';
import { buildJointEdges } from './jointEdges';

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
	jointSourceId,
	jointVerdicts,
	onRemoveJoint,
	cache,
	testRunScope = EMPTY_TEST_RUN_SCOPE,
	isEditLocked = false,
	testRunFailureDismissed = false,
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
		const draggable = !isPreviewNode && (!isEditLocked || node.type === 'start');
		const isLeaf = leaf.isLeaf;
		const nextRightLeaf = isPreviewNode ? false : leaf.rightLeaf;
		const nextBottomLeaf = isPreviewNode ? false : leaf.bottomLeaf;
		const duplicateMethodIndex = methodInstanceById.get(node.id)?.index;
		const duplicateMethodColor = methodInstanceById.get(node.id)?.color;
		const alwaysShowRightAdd = !isPreviewNode && !isEditLocked && node.type === 'start' && onlyStartNode;
		const highlighted = Boolean(node.data.highlighted) || highlightedBranch.nodeIds.has(node.id);
		const jointVerdict = jointVerdicts?.get(node.id);
		const jointCandidate = Boolean(jointVerdict?.valid);
		const jointSource = node.id === jointSourceId;
		// Only surfaced while a joint is being drawn — an unreachable reason on an
		// idle canvas would light every node up on hover.
		const jointInvalidReason = jointVerdict && !jointVerdict.valid && !jointSource
			? jointVerdict.reason : undefined;
		const jointBlockingNodeId = jointVerdict && !jointVerdict.valid
			? jointVerdict.blockingNodeId : undefined;
		const jointBlockingNode = jointBlockingNodeId
			? nodes.find((item) => item.id === jointBlockingNodeId) : undefined;
		const jointBlockingLabel = jointBlockingNode
			? jointBlockingNode.data.subtitle || jointBlockingNode.data.title : undefined;
		const suppressHoverAddControls = isPreviewNode || isEditLocked || activeAction?.sourceNodeId === node.id;
		const lockVisibleAddControls = !isPreviewNode && activeAction?.sourceNodeId === node.id;
		const testRunFailed = testRunScope.failedNodeIds.has(node.id);
		const testRunFailedVisible = testRunFailed && !testRunFailureDismissed;
		const testRunActive = !testRunFailed && testRunScope.activeNodeIds.has(node.id);
		const testRunFailedMessage = testRunFailed
			? testRunScope.failedNodeErrorByNodeId.get(node.id) : undefined;
		const testRunIteration = testRunScope.iterationByNodeId.get(node.id);
		const testRunActiveBranch = testRunScope.activeBranchByNodeId.get(node.id);
		const sig = [
			selectable, draggable, isLeaf, nextRightLeaf, nextBottomLeaf,
			duplicateMethodIndex, duplicateMethodColor, alwaysShowRightAdd,
			highlighted, suppressHoverAddControls, lockVisibleAddControls, isAnyNodeDragging,
			testRunActive, testRunIteration?.iterator, testRunIteration?.count,
			testRunActiveBranch, testRunFailed, testRunFailedMessage,
			testRunFailedVisible, isEditLocked, jointCandidate, jointSource,
			jointInvalidReason, jointBlockingLabel,
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
			&& cached.onRemoveJoint === onRemoveJoint
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
				jointCandidate,
				jointSource,
				jointInvalidReason,
				jointBlockingLabel,
				testRunActive,
				testRunIteration,
				testRunActiveBranch,
				testRunFailed,
				testRunFailedMessage,
				testRunFailedVisible,
				onAddStep: isEditLocked ? undefined : onOpenAddStep,
				onOpenContextMenu: isEditLocked ? undefined : onOpenContextMenu,
				onDeleteNode: isEditLocked ? undefined : onDeleteNode,
				onOpenAggregatorEditor: isEditLocked ? undefined : onOpenAggregatorEditor,
				onRemoveJoint: isEditLocked ? undefined : onRemoveJoint,
			},
		};
		cache?.nodes.set(node.id, { src: node, sig, onAddStep: onOpenAddStep, onOpenContextMenu, onDeleteNode, onOpenAggregatorEditor, onRemoveJoint, out });
		return out;
	});
	const preparedEdges: WorkflowEdgeModel[] = edges.map((edge) => {
		const highlighted = Boolean(edge.data?.highlighted) || highlightedBranch.edgeIds.has(edge.id);
		const testRunActive = testRunScope.activeEdgeIds.has(edge.id);
		const testRunNonce = testRunActive ? testRunScope.activeStepNonce : 0;
		const cached = cache?.edges.get(edge.id);
		if (cached && cached.src === edge && cached.highlighted === highlighted
			&& cached.testRunActive === testRunActive && cached.testRunNonce === testRunNonce) {
			return cached.out;
		}
		const out: WorkflowEdgeModel = {
			...edge,
			data: {
				...edge.data,
				highlighted,
				testRunActive,
				testRunNonce,
			},
		};
		cache?.edges.set(edge.id, { src: edge, highlighted, testRunActive, testRunNonce, out });
		return out;
	});

	const jointEdges = buildJointEdges(nodes, isEditLocked ? undefined : onRemoveJoint, cache?.jointEdges);

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

	return { preparedEdges: [...preparedEdges, ...jointEdges], preparedNodes };
}
