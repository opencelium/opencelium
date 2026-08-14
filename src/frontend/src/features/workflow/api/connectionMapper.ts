import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { HistoryVersionItem } from '../types/history.types';
import { initialEdges, initialNodes } from '../data/initialGraph';
import { OFFSETS } from '../utils/graph.constants';
import { normalizeWorkflowPositions } from '../utils/graph.dragDrop';
import { normalizeConnectionPayload } from './connectionPayload';
import { methodsToEntries } from './connectionMapper.entries';
import { getInvalidSavedEdgeReason, getSavedUiEdges, getSavedUiNodes } from './connectionMapper.savedUi';
import {
	findSavedNode,
	mergeSavedNodeData,
} from './connectionMapper.savedNodeMatching';
import { restoreNodesFromUi } from './connectionMapper.restoreNodes';
import { applyWorkflowLeafState as withLeafState, buildWorkflowEdges as buildEdges } from './connectionMapper.graph';
import {
	assignMissingMethodColors,
	backfillMissingInvokerNames,
	hasStackedNodes,
} from './connectionMapper.nodeNormalization';

export type WorkflowConnectionState = {
	title: string;
	description: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings: any[];
	versions: HistoryVersionItem[];
	viewport?: { x: number; y: number; zoom: number };
	categoryId: number | null;
};

const isViewport = (viewport: any) =>
	typeof viewport?.x === 'number' && typeof viewport?.y === 'number' && typeof viewport?.zoom === 'number';

export function mapConnectionToWorkflowState(
	payload: unknown,
	fallbackViewport?: { x: number; y: number; zoom: number },
): WorkflowConnectionState {
	const connection = normalizeConnectionPayload(payload);
	const methods = connection.fromConnector.method ?? [];
	const operators = connection.fromConnector.operator ?? [];
	const entries = methodsToEntries(methods, operators);
	const savedUiNodes = getSavedUiNodes(connection.ui);
	const savedViewport = isViewport(connection.ui?.viewport) ? connection.ui.viewport : fallbackViewport;
	const savedUiEdges = getSavedUiEdges(connection.ui);
	const shouldRestoreFromUi = entries.length > 0 && savedUiNodes.length > 0 && savedUiEdges.length > 0;
	const restoredFromUi = shouldRestoreFromUi ? restoreNodesFromUi(entries, savedUiNodes) : undefined;
	const builtNodes = restoredFromUi?.nodes ?? (entries.length ? [...initialNodes, ...entries.map((entry) => entry.node)] : initialNodes);
	const entryByNodeId = new Map(entries.map((entry) => [entry.node.id, entry]));
	const usedSavedNodeIds = new Set<string>();
	const nodes = restoredFromUi ? builtNodes : builtNodes.map((node) => {
		const savedNode = findSavedNode(node, entryByNodeId.get(node.id), savedUiNodes, usedSavedNodeIds);
		if (!savedNode) return node;
		usedSavedNodeIds.add(savedNode.id);

		return {
			...node,
			id: node.type === 'start' ? node.id : savedNode.id,
			position: savedNode.position,
			data: mergeSavedNodeData(node.data, savedNode.data),
			draggable: savedNode.draggable ?? node.draggable,
			deletable: savedNode.deletable ?? node.deletable,
		};
	});
	const invalidSavedEdgeReason = getInvalidSavedEdgeReason(nodes, savedUiEdges);
	const useSavedEdges = restoredFromUi
		? savedUiEdges.length > 0
		: entries.length > 0 && savedUiEdges.length > 0 && !invalidSavedEdgeReason;
	const edges = useSavedEdges ? savedUiEdges : entries.length ? buildEdges(entries) : initialEdges;
	const shouldAutoLayout = entries.length > 0
		&& ((!restoredFromUi && savedUiNodes.length === 0) || hasStackedNodes(nodes));
	const positionedNodes = shouldAutoLayout ? normalizeWorkflowPositions(nodes, edges) : nodes;
	const normalizedNodes = backfillMissingInvokerNames(
		withLeafState(assignMissingMethodColors(positionedNodes), edges),
		entries,
	);

	return {
		title: connection.title,
		description: connection.description ?? '',
		nodes: normalizedNodes,
		edges,
		fieldBindings: Array.isArray(connection.fieldBinding)
			? connection.fieldBinding
			: Array.isArray(connection.fieldBindings)
				? connection.fieldBindings
				: [],
		versions: [],
		viewport: savedViewport,
		categoryId: connection.categoryId ?? null,
	};
}
