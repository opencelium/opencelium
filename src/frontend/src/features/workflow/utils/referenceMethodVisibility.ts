import type { Connection, MethodWithId } from '../types/connection';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { compareWorkflowIndexes } from './graph.referenceVisibility';

/** Minimal edge shape shared by the saved UI edges and the synthetic joint edges. */
export type ReferenceGraphEdge = { source?: string; target?: string };

type JointCarrier = { id: string; jumpTo?: string };

/**
 * Joints as reference-graph edges. A joint's target inherits the source's
 * reference visibility, which is exactly what an extra `source -> target` edge
 * expresses for an upstream walk — chained joints therefore work for free.
 *
 * Only joints pointing at another method's id are emitted: the same `jumpTo`
 * field carries a workflow index rather than a node id on payload-shaped
 * connections (see connectionPayload.methods.ts), and those must not be
 * mistaken for ids.
 */
export const collectJointReferenceEdges = (carriers: JointCarrier[]): ReferenceGraphEdge[] => {
	const ids = new Set(carriers.map((carrier) => carrier.id));
	return carriers.flatMap(({ id, jumpTo }) => jumpTo && ids.has(jumpTo)
		? [{ source: id, target: jumpTo }]
		: []);
};

export const collectNodeJointReferenceEdges = (nodes: WorkflowNodeModel[]): ReferenceGraphEdge[] =>
	collectJointReferenceEdges(nodes.map((node) => ({ id: node.id, jumpTo: node.data.jumpTo })));

export const getUpstreamNodeIds = (consumerNodeId: string, edges: ReferenceGraphEdge[]) => {
	const sourcesByTarget = new Map<string, string[]>();
	edges.forEach(({ source, target }) => {
		if (source && target) sourcesByTarget.set(target, [...(sourcesByTarget.get(target) ?? []), source]);
	});
	const upstream = new Set<string>();
	const queue = [...(sourcesByTarget.get(consumerNodeId) ?? [])];
	while (queue.length) {
		const nodeId = queue.shift();
		if (!nodeId || upstream.has(nodeId)) continue;
		upstream.add(nodeId);
		queue.push(...(sourcesByTarget.get(nodeId) ?? []));
	}
	return upstream;
};

export const getConnectionFlowEdges = (connection: Connection): ReferenceGraphEdge[] => {
	const ui = connection.ui as { workflowEdges?: unknown; flowchartEdges?: unknown } | undefined;
	if (Array.isArray(ui?.workflowEdges)) return ui.workflowEdges as ReferenceGraphEdge[];
	if (Array.isArray(ui?.flowchartEdges)) return ui.flowchartEdges as ReferenceGraphEdge[];
	return [];
};

/**
 * The methods whose response `currentMethod` may reference: everything upstream
 * of it in the graph, joints included. Falls back to workflow-index order when
 * the connection carries no edges at all (a payload loaded without its `ui`).
 */
export const getEligibleReferenceMethods = (
	connection: Connection | null,
	currentMethod: MethodWithId,
): MethodWithId[] => {
	if (!connection) return [];
	const methods = connection.fromConnector.method;
	const flowEdges = getConnectionFlowEdges(connection);
	if (flowEdges.length > 0) {
		const upstream = getUpstreamNodeIds(currentMethod.id, [
			...flowEdges,
			...collectJointReferenceEdges(methods),
		]);
		return methods.filter((method) => method.id !== currentMethod.id && upstream.has(method.id));
	}
	const currentIndex = String(currentMethod.index ?? '');
	// Nothing to order against — keep the pre-existing "offer everything" behaviour
	// rather than silently emptying the picker.
	if (!currentIndex) return methods.filter((method) => method.id !== currentMethod.id);
	return methods.filter((method) => method.id !== currentMethod.id
		&& compareWorkflowIndexes(String(method.index ?? ''), currentIndex) < 0);
};
