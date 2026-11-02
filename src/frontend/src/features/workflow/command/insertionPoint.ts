import type { WorkflowAction, WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

export type InsertPosition = 'after' | 'before';

export type InsertionPoint = Pick<WorkflowAction, 'sourceNodeId' | 'sourceHandle' | 'direction'>;

/** The handle a node continues its row from — the same ones its "+" on the right uses. */
const continueHandle = (node: WorkflowNodeModel): string | undefined => {
	if (node.type === 'if') return 'false';
	if (node.type === 'loop') return 'right';
	return undefined;
};

/** Inside an IF ("true") or a loop ("bottom") a chain grows downwards. */
const directionOf = (handle: string | null | undefined): WorkflowAction['direction'] =>
	handle === 'true' || handle === 'bottom' ? 'bottom' : 'right';

/**
 * Where a step goes to land after or before `anchorId`. There is no "insert before" in the
 * editor; adding always splices in after its source, so "before X" adds from X's incoming
 * edge — the step before it, the operator it opens, or the start node. Null for a node
 * nothing can follow (a note) or precede (the start node).
 */
export function insertionPoint(
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	anchorId: string,
	position: InsertPosition,
): InsertionPoint | null {
	const anchor = nodes.find((node) => node.id === anchorId);
	if (!anchor || anchor.type === 'comment') return null;
	if (position === 'after') return { sourceNodeId: anchor.id, sourceHandle: continueHandle(anchor), direction: 'right' };
	const incoming = edges.find((edge) => edge.target === anchorId);
	if (!incoming) return null;
	return { sourceNodeId: incoming.source, sourceHandle: incoming.sourceHandle ?? undefined, direction: directionOf(incoming.sourceHandle) };
}

/** The last step of the top-level chain, where a step goes when nothing says otherwise. */
export function lastMainStepId(nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]): string | null {
	const byId = new Map(nodes.map((node) => [node.id, node]));
	let current = byId.get('start-1');
	const seen = new Set<string>();
	while (current && !seen.has(current.id)) {
		seen.add(current.id);
		const handle = continueHandle(current);
		const next = edges.find((edge) => edge.source === current!.id && (edge.sourceHandle ?? undefined) === handle);
		const nextNode = next && byId.get(next.target);
		if (!nextNode) return current.id;
		current = nextNode;
	}
	return current?.id ?? null;
}
