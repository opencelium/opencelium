import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowUndoChange, WorkflowUndoIcon } from '../types/undoHistory.types';
import { sortValue } from './workflowPage.utils';
import { buildWorkflowEdgeSignature } from './workflowUndoHistory.utils';
import { toAuthoredMethodConfig } from './requestConfig';
import { describeEnhancementChange, describeMethodConfigChange,
	findChangedEnhancementTarget, workflowNodeLabel } from './workflowUndoMethodChange.utils';
import { describeConditionChange } from './workflowUndoConditionChange.utils';

type GraphState = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings: unknown[] | undefined;
};

const stable = (value: unknown) => JSON.stringify(sortValue(value) ?? null);

const nameOf = workflowNodeLabel;

// Node types whose subtitle does not describe them: a system node's is its HTTP
// verb ("GET"), and an operator's is empty. Connector methods keep their own
// name, which is the useful thing there.
const NODE_KIND_NAME_KEYS: Partial<Record<string, string>> = {
	system: 'undoHistory.nodeKind.httpRequest',
	'trigger-connection': 'undoHistory.nodeKind.webhook',
	if: 'undoHistory.nodeKind.if',
	loop: 'undoHistory.nodeKind.loop',
};

/** Which glyph identifies a node in the menu. */
const iconOf = (node: WorkflowNodeModel): WorkflowUndoIcon | undefined => {
	switch (node.type) {
		case 'connector':
			return { kind: 'connector', iconUrl: node.data.connector?.icon ?? null };
		case 'system': return { kind: 'http-request' };
		case 'trigger-connection': return { kind: 'webhook' };
		case 'if': return { kind: 'if' };
		case 'loop': return { kind: 'loop' };
		// The start node is never the subject of an entry.
		default: return undefined;
	}
};

/** How to name one node in a label: by its own name, or by its kind. */
const subjectOf = (node: WorkflowNodeModel) => {
	const nameKey = NODE_KIND_NAME_KEYS[node.type ?? ''];
	return { ...(nameKey ? { nameKey } : { name: nameOf(node) }), icon: iconOf(node) };
};

/** Tags a refined change with the node it concerns. */
const withIcon = (change: WorkflowUndoChange, node: WorkflowNodeModel): WorkflowUndoChange =>
	({ ...change, icon: iconOf(node) });

/**
 * Categories that describe an edit on their own. When exactly one is present it
 * becomes the label; when several are, the entry is just "multiple changes".
 */
type PrimaryKind = Extract<WorkflowUndoChange,
	{ kind: 'nodes-added' | 'nodes-removed' | 'nodes-moved' | 'node-renamed'
		| 'method-config' | 'condition-config' | 'aggregator-config'
		| 'connector-config' }>['kind'];

// Per-node authored fields, in the order they should win when a single node
// changed in more than one of them at once (config edits are more interesting
// to a reader than the rename that may accompany them).
const NODE_FIELD_KINDS: { kind: PrimaryKind; read: (node: WorkflowNodeModel) => unknown }[] = [
	{ kind: 'method-config', read: (node) => toAuthoredMethodConfig(node.data.methodConfig) },
	{ kind: 'condition-config', read: (node) => node.data.conditionConfig },
	{ kind: 'aggregator-config', read: (node) => node.data.dataAggregator ?? null },
	{ kind: 'connector-config', read: (node) => node.data.connector },
	{ kind: 'node-renamed', read: (node) => [node.data.subtitle, node.data.title] },
];

const positionOf = (node: WorkflowNodeModel) =>
	`${Math.round(node.position?.x ?? 0)}:${Math.round(node.position?.y ?? 0)}`;

/**
 * Reconstructs what changed between two recorded states. Edge and field-binding
 * changes are treated as *secondary*: adding a step also adds an edge, and
 * deleting one also prunes references, so surfacing those would turn every
 * structural edit into "multiple changes". They only become the label when
 * nothing else moved.
 */
export const describeWorkflowUndoChange = (
	previous: GraphState,
	next: GraphState,
): WorkflowUndoChange => {
	const previousById = new Map(previous.nodes.map((node) => [node.id, node]));
	const nextById = new Map(next.nodes.map((node) => [node.id, node]));
	const added = next.nodes.filter((node) => !previousById.has(node.id));
	const removed = previous.nodes.filter((node) => !nextById.has(node.id));

	if (added.length && removed.length) return { kind: 'multiple' };
	if (added.length) {
		return { kind: 'nodes-added', count: added.length,
			...(added.length === 1 ? subjectOf(added[0]) : {}) };
	}
	if (removed.length) {
		return { kind: 'nodes-removed', count: removed.length,
			...(removed.length === 1 ? subjectOf(removed[0]) : {}) };
	}

	const kinds = new Set<PrimaryKind>();
	const movedNodes: WorkflowNodeModel[] = [];
	let fieldChanged: { before: WorkflowNodeModel; after: WorkflowNodeModel } | undefined;

	for (const node of next.nodes) {
		const before = previousById.get(node.id);
		// Every mutation path replaces nodes immutably, so identity is a valid
		// (and much cheaper) "definitely unchanged" test.
		if (!before || before === node) continue;
		if (positionOf(before) !== positionOf(node)) movedNodes.push(node);
		for (const field of NODE_FIELD_KINDS) {
			if (stable(field.read(before)) === stable(field.read(node))) continue;
			kinds.add(field.kind);
			fieldChanged ??= { before, after: node };
			break;
		}
	}
	if (movedNodes.length) kinds.add('nodes-moved');

	if (kinds.size > 1) return { kind: 'multiple' };
	const [only] = [...kinds];
	if (only === 'nodes-moved') {
		return { kind: 'nodes-moved', count: movedNodes.length,
			...(movedNodes.length === 1 ? subjectOf(movedNodes[0]) : {}) };
	}
	if (only === 'method-config' && fieldChanged) {
		// Narrow "edited the request" to the editor tab it came from, and to the
		// reference or script that moved when that is what changed.
		const enhancement = findChangedEnhancementTarget(previous.fieldBindings, next.fieldBindings);
		const ownsEnhancement = !!enhancement && (fieldChanged.after.data.color ?? '')
			.toLowerCase() === enhancement.color.toLowerCase();
		return withIcon(describeMethodConfigChange(fieldChanged.before.data.methodConfig,
			fieldChanged.after.data.methodConfig, nameOf(fieldChanged.after),
			ownsEnhancement ? enhancement : null), fieldChanged.after);
	}
	if (only === 'condition-config' && fieldChanged) {
		const operator = fieldChanged.after.type === 'loop' ? 'loop' : 'if';
		return withIcon(describeConditionChange(fieldChanged.before.data.conditionConfig,
			fieldChanged.after.data.conditionConfig, operator, nameOf(fieldChanged.after)),
		fieldChanged.after);
	}
	if (only === 'node-renamed' && fieldChanged) {
		return { kind: 'node-renamed', label: nameOf(fieldChanged.after),
			icon: iconOf(fieldChanged.after) };
	}
	if (only === 'aggregator-config' && fieldChanged) {
		// Aggregators sit on operators as well as methods, so the subject may be a
		// kind ("IF") rather than a method name. Clearing one is a distinct action
		// from picking one, and `undefined` and `null` both mean cleared.
		const next = fieldChanged.after.data.dataAggregator;
		return {
			kind: 'aggregator-config',
			operation: next === null || next === undefined ? 'removed' : 'configured',
			...subjectOf(fieldChanged.after),
		};
	}
	if (only) {
		return { kind: only, name: fieldChanged && nameOf(fieldChanged.after),
			icon: fieldChanged && iconOf(fieldChanged.after) };
	}

	if (buildWorkflowEdgeSignature(previous.edges)
		!== buildWorkflowEdgeSignature(next.edges)) return { kind: 'edges-changed' };
	if (stable(previous.fieldBindings) !== stable(next.fieldBindings)) {
		// Scripts live only in the connection-level bindings, so this is the one
		// path where an enhancement edit can be recognised.
		return describeEnhancementChange(previous.fieldBindings, next.fieldBindings, next.nodes);
	}
	return { kind: 'multiple' };
};
