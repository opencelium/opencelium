import { buildWorkflowIndexes } from '../../api/connectionPayload';
import { collectDescendantEdgeIds, collectDescendantNodeIds } from '../../utils/graphUtils';
import { getBottomSourceHandle, getRightSourceHandle } from '../../utils/graph.handles';
import type { LiveGraphNodeStatus, LiveGraphStatus } from '../../test-run/liveGraphStatus';
import type { WorkflowEdgeModel, WorkflowLoopIterationDisplay, WorkflowNodeModel } from '../../types/workflow.types';

export type TestRunScope = {
	// The exact method/operator currently executing (PENDING right now).
	activeNodeIds: Set<string>;
	// The edge feeding each active node — the "data flowing" cue.
	activeEdgeIds: Set<string>;
	// Nodes/edges nested inside a currently-running LOOP/IF body, excluding the
	// operator itself (which is already in activeNodeIds/activeEdgeIds).
	scopeNodeIds: Set<string>;
	scopeEdgeIds: Set<string>;
	// For each LOOP currently executing, at any nesting depth and re-entered
	// any number of times by an outer loop.
	iterationByNodeId: Map<string, WorkflowLoopIterationDisplay>;
	// Nodes where an error actually happened this run — persists after the run
	// ends (unlike everything else above, which only means something while
	// something is still PENDING) so the failure stays visible until the next
	// test run starts.
	failedNodeIds: Set<string>;
	failedNodeErrorByNodeId: Map<string, string>;
};

export const EMPTY_TEST_RUN_SCOPE: TestRunScope = {
	activeNodeIds: new Set(),
	activeEdgeIds: new Set(),
	scopeNodeIds: new Set(),
	scopeEdgeIds: new Set(),
	iterationByNodeId: new Map(),
	failedNodeIds: new Set(),
	failedNodeErrorByNodeId: new Map(),
};

// Which nested branch of a currently-executing if/loop to treat as "in scope".
// Unlike getOperatorBottomBranch (used for click-to-highlight, which always
// shows the bottom/true branch regardless of anything), this picks the branch
// that is actually running: a loop only ever has one body, but an if's result
// (status.ifResult) says which side was taken. Falls back to the bottom/true
// branch when the result isn't known yet (the if hasn't resolved).
const getActiveOperatorScope = (
	node: WorkflowNodeModel,
	status: LiveGraphNodeStatus,
	edges: WorkflowEdgeModel[],
): { nodeIds: Set<string>; edgeIds: Set<string> } => {
	const sourceHandle =
		node.type === 'if' && status.ifResult === 'false'
			? getRightSourceHandle('if')
			: getBottomSourceHandle(node.type);

	const rootEdge = edges.find((edge) => edge.source === node.id && edge.sourceHandle === sourceHandle);
	if (!rootEdge) return { nodeIds: new Set(), edgeIds: new Set() };

	const nodeIds = collectDescendantNodeIds(rootEdge.target, edges);
	const edgeIds = collectDescendantEdgeIds(nodeIds, edges);
	edgeIds.add(rootEdge.id);
	return { nodeIds, edgeIds };
};

// While a test run is live, this derives everything the canvas animates from
// liveGraphStatus (see liveGraphStatus.ts) — a flat, non-memory-bounded
// per-node status, unlike LiveLogTree which only keeps a loop's first
// iteration in memory. That matters here specifically: a loop nested inside
// another loop re-enters (and re-emits fresh PENDING/COMPLETE lines) every
// single time its parent advances, however many times that is, so this needs
// a source that keeps reflecting it for the whole run, not just the first pass.
//
// Derives:
//  - the edge feeding whichever method/operator is currently PENDING, so the
//    user can watch execution move through the graph;
//  - for a currently-running LOOP/IF, its whole nested (taken) branch, so the
//    user can see the scope's extent, not just the single active step;
//  - the running iteration count for every LOOP currently executing, at any
//    nesting depth, refreshed on every re-entry;
//  - which node(s) an error actually happened at, if any — computed
//    independent of the "anything still pending" checks below, since a
//    failure is meant to keep marking the graph after the run has stopped.
export const getTestRunScope = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	liveGraphStatus: LiveGraphStatus,
): TestRunScope => {
	const entries = Object.entries(liveGraphStatus);
	if (entries.length === 0) return EMPTY_TEST_RUN_SCOPE;

	const nodeIdByIndex = new Map<string, string>();
	buildWorkflowIndexes(nodes, edges).forEach((index, nodeId) => nodeIdByIndex.set(index, nodeId));
	const nodeById = new Map(nodes.map((node) => [node.id, node]));

	const failedNodeIds = new Set<string>();
	const failedNodeErrorByNodeId = new Map<string, string>();
	for (const [indexPath, status] of entries) {
		if (status.status !== 'FAIL') continue;
		const nodeId = nodeIdByIndex.get(indexPath);
		if (!nodeId) continue;
		failedNodeIds.add(nodeId);
		if (status.errorMessage) failedNodeErrorByNodeId.set(nodeId, status.errorMessage);
	}

	const pendingIndexPaths = entries.filter(([, status]) => status.status === 'PENDING').map(([indexPath]) => indexPath);
	if (pendingIndexPaths.length === 0) {
		return { ...EMPTY_TEST_RUN_SCOPE, failedNodeIds, failedNodeErrorByNodeId };
	}

	const activeNodeIds = new Set<string>();
	const scopeNodeIds = new Set<string>();
	const scopeEdgeIds = new Set<string>();
	const iterationByNodeId = new Map<string, WorkflowLoopIterationDisplay>();

	for (const indexPath of pendingIndexPaths) {
		const nodeId = nodeIdByIndex.get(indexPath);
		const node = nodeId ? nodeById.get(nodeId) : undefined;
		if (!nodeId || !node) continue;
		activeNodeIds.add(nodeId);

		const status = liveGraphStatus[indexPath];

		if (node.type === 'if' || node.type === 'loop') {
			const scope = getActiveOperatorScope(node, status, edges);
			scope.nodeIds.forEach((id) => scopeNodeIds.add(id));
			scope.edgeIds.forEach((id) => scopeEdgeIds.add(id));
		}

		if (node.type === 'loop' && status.iterationCount) {
			const iterator = status.iterator ?? '';
			if (status.speed === 'fast') {
				// Already known to be fast (possibly from an earlier invocation) —
				// show the static badge right away, no re-measuring/hiding this time.
				iterationByNodeId.set(nodeId, { kind: 'fast', iterator });
			} else if (status.speed === 'slow' || status.iterationCount >= 2) {
				// Either already known to be a readable speed, or (this loop's very
				// first invocation) we've just timed enough to know it isn't fast.
				iterationByNodeId.set(nodeId, { kind: 'count', iterator, count: status.iterationCount });
			}
			// else: still on iteration 1 of this loop's very first-ever invocation —
			// nothing to show yet, timing is in progress.
		}
	}

	if (activeNodeIds.size === 0) {
		return { ...EMPTY_TEST_RUN_SCOPE, failedNodeIds, failedNodeErrorByNodeId };
	}

	const activeEdgeIds = new Set(edges.filter((edge) => activeNodeIds.has(edge.target)).map((edge) => edge.id));

	return { activeNodeIds, activeEdgeIds, scopeNodeIds, scopeEdgeIds, iterationByNodeId, failedNodeIds, failedNodeErrorByNodeId };
};
