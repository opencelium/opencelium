import type {
	WorkflowEdgeData,
	WorkflowEdgeModel,
	WorkflowNodeData,
	WorkflowNodeModel,
} from '../types/workflow.types';
import { sortValue } from './workflowPage.utils';
import { toAuthoredMethodConfig } from './requestConfig';

/**
 * Node-data keys that describe how the graph currently *looks* rather than what
 * the user built: hover/drag decorations, the leaf and duplicate-method hints
 * recomputed on every render by `prepareWorkflowElements`, command-palette
 * search rings, validation errors, live test-run state, and the node callbacks.
 *
 * This is a denylist on purpose. A new *authored* field is then covered by the
 * undo signature automatically; only new render-only flags need adding here (a
 * missed one costs a redundant undo entry, whereas a missed authored field would
 * silently make that edit un-undoable). Typed as `keyof WorkflowNodeData` so a
 * renamed field fails the build instead of drifting unnoticed.
 */
const EPHEMERAL_NODE_DATA_KEYS = new Set<keyof WorkflowNodeData>([
	'isLeaf', 'rightLeaf', 'bottomLeaf', 'duplicateMethodIndex',
	'duplicateMethodColor', 'alwaysShowRightAdd', 'highlighted', 'searchHighlighted',
	'hasError', 'errorMessage', 'dropTarget', 'dropInvalid', 'dragGhost',
	'dropPlaceholder', 'dragSourceMoving', 'dragSourceFaint', 'hideAddControls',
	'suppressHoverAddControls', 'lockVisibleAddControls', 'isAnyNodeDragging',
	'testRunActive', 'testRunIteration', 'testRunActiveBranch', 'testRunFailed',
	'testRunFailedMessage', 'testRunFailedVisible', 'onAddStep',
	'onOpenContextMenu', 'onDeleteNode', 'onOpenAggregatorEditor',
]);

/** Same idea for edges: only `branch` is authored, the rest is render state. */
const EPHEMERAL_EDGE_DATA_KEYS = new Set<keyof WorkflowEdgeData>([
	'highlighted', 'dropTarget', 'dropInvalid', 'dragGhost', 'dropPlaceholder',
	'testRunActive', 'testRunNonce',
]);

const withoutKeys = <T extends object>(data: T | undefined, ephemeral: Set<keyof T>) =>
	!data ? data : Object.fromEntries(Object.entries(data)
		.filter(([key, value]) => !ephemeral.has(key as keyof T) && typeof value !== 'function'));

const toAuthoredNodeData = (data: WorkflowNodeData) => {
	const authored = withoutKeys(data, EPHEMERAL_NODE_DATA_KEYS) as Record<string, unknown>;
	if (!authored || !('methodConfig' in authored)) return authored;
	return { ...authored, methodConfig: toAuthoredMethodConfig(data.methodConfig) };
};

const toAuthoredNode = (node: WorkflowNodeModel) => ({
	id: node.id,
	type: node.type,
	// Rounded so sub-pixel drag noise doesn't register as an edit.
	x: Math.round(node.position?.x ?? 0),
	y: Math.round(node.position?.y ?? 0),
	draggable: node.draggable,
	deletable: node.deletable,
	hidden: node.hidden,
	data: toAuthoredNodeData(node.data),
});

const toAuthoredEdge = (edge: WorkflowEdgeModel) => ({
	id: edge.id,
	type: edge.type,
	source: edge.source,
	target: edge.target,
	sourceHandle: edge.sourceHandle,
	targetHandle: edge.targetHandle,
	data: withoutKeys(edge.data, EPHEMERAL_EDGE_DATA_KEYS),
});

/** Authored identity of the edge set alone — used by the change describer to
 * tell "connections changed" from "only node data changed". */
export const buildWorkflowEdgeSignature = (edges: WorkflowEdgeModel[]) =>
	JSON.stringify(sortValue(edges.map(toAuthoredEdge)));

/**
 * Stable string identity of everything the user authored. Keys are deep-sorted
 * (`sortValue`) because the editor's mutation paths spread objects in different
 * orders — without that, re-saving an unchanged method config would read as a
 * fresh edit.
 */
export const buildWorkflowUndoSignature = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	fieldBindings: unknown[] | undefined,
) => JSON.stringify(sortValue({
	nodes: nodes.map(toAuthoredNode),
	edges: edges.map(toAuthoredEdge),
	fieldBindings,
}));

/** True while the graph still carries drag ghosts / drop placeholders, i.e. it
 * is a half-finished drag rather than a state worth remembering. */
export const hasWorkflowDragPreview = (nodes: WorkflowNodeModel[]) =>
	nodes.some((node) => node.data.dragGhost || node.data.dropPlaceholder);
