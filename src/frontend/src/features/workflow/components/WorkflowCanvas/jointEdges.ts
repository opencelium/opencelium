import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import type { JointEdgeCache } from './prepareWorkflowElements.types';

export const jointEdgeId = (sourceNodeId: string) => `joint-${sourceNodeId}`;

/**
 * One edge per joint (`node.data.jump`). These are render-only: they are never
 * part of the graph's `edges` state, so they never reach the saved `ui` payload
 * and never take part in index building — the joint itself is persisted on the
 * method (see connectionPayload.methods.ts).
 *
 * Built through the same cache as the real edges so identities stay stable
 * across renders; xyflow diffs edges by identity.
 */
export const buildJointEdges = (
	nodes: WorkflowNodeModel[],
	onRemoveJoint: ((nodeId: string) => void) | undefined,
	/** The live test run's travelling token, when it is on a joint this render. */
	testRun: { activeEdgeIds: Set<string>; activeStepNonce: number },
	cache?: JointEdgeCache,
): WorkflowEdgeModel[] => {
	const nodeIds = new Set(nodes.map((node) => node.id));
	const edges = nodes.flatMap((node) => {
		const targetId = node.data.jump;
		if (!targetId || targetId === node.id || !nodeIds.has(targetId)) return [];
		const id = jointEdgeId(node.id);
		const testRunActive = testRun.activeEdgeIds.has(id);
		const testRunNonce = testRunActive ? testRun.activeStepNonce : 0;
		const sig = `${targetId}|${!!onRemoveJoint}|${testRunActive}|${testRunNonce}`;
		const cached = cache?.get(id);
		if (cached && cached.sig === sig) return [cached.out];
		const out: WorkflowEdgeModel = {
			id,
			source: node.id,
			target: targetId,
			sourceHandle: 'right',
			targetHandle: 'left',
			type: 'workflow-edge',
			// Selectable so the edge stays interactive: xyflow marks a
			// non-selectable edge with no click handler `inactive`, which sets
			// pointer-events:none and would kill the hover-to-delete control.
			selectable: true,
			deletable: false,
			focusable: false,
			data: { joint: true, jointSourceNodeId: node.id, onRemoveJoint, testRunActive, testRunNonce },
		};
		cache?.set(id, { sig, out });
		return [out];
	});
	if (cache) {
		const liveIds = new Set(edges.map((edge) => edge.id));
		for (const key of cache.keys()) {
			if (!liveIds.has(key)) cache.delete(key);
		}
	}
	return edges;
};
