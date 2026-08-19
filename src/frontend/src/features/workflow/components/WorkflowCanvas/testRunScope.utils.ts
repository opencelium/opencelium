import { buildWorkflowIndexes } from '../../api/connectionPayload';
import type { LiveGraphStatus } from '../../test-run/liveGraphStatus';
import type { TestRunCurrentStep } from '../../test-run/TestRunContext';
import type { WorkflowEdgeModel, WorkflowLoopIterationDisplay, WorkflowNodeModel } from '../../types/workflow.types';

export type TestRunScope = {
	// The SINGLE element the paced playback is showing as executing right now
	// (execution is consecutive — see TestRunCurrentStep), plus the single edge
	// feeding it. Sets for consumer convenience, but they hold at most one id.
	activeNodeIds: Set<string>;
	activeEdgeIds: Set<string>;
	// Bumped on every playback transition — including a re-entry of the SAME
	// element on the next loop iteration — so the edge's travelling-dot
	// animation restarts once per transition.
	activeStepNonce: number;
	// For each LOOP the process is currently inside (any ancestor of the
	// current step, at any nesting depth), the live iteration counter.
	iterationByNodeId: Map<string, WorkflowLoopIterationDisplay>;
	// For each IF the process's current position relates to, which label to
	// highlight:
	//  - 'true' — the current step is the IF itself (result known true, and
	//    arrived) or inside its true-branch subtree. Persists for as long as
	//    the token stays inside that subtree.
	//  - 'continue' — either the token is sitting on the IF itself with a
	//    known false result (nothing to descend into), or the token is
	//    travelling THIS INSTANT along the IF's continue edge toward its
	//    immediate next sibling. Deliberately momentary in the second case —
	//    it clears the instant the dot arrives, unlike 'true', because the
	//    continue edge has no subtree of its own to keep highlighting; once
	//    arrived, the target's own state (ring, or its own branch label if
	//    it's another IF) takes over.
	activeBranchByNodeId: Map<string, 'true' | 'continue'>;
	// Nodes where an error actually happened this run — only entries that
	// received error attribution (errorMessage set at error.originOfErrorPath,
	// see reduceLiveGraphStatus), NOT every entry whose status is FAIL: ending a
	// run flips every still-pending node to FAIL (failPendingGraphStatus), and
	// stopping a test mid-loop must not paint every running loop red. Persists
	// after the run ends (unlike everything else above, which only means
	// something while something is still PENDING) so the failure stays visible
	// until the next test run starts.
	failedNodeIds: Set<string>;
	failedNodeErrorByNodeId: Map<string, string>;
};

export const EMPTY_TEST_RUN_SCOPE: TestRunScope = {
	activeNodeIds: new Set(),
	activeEdgeIds: new Set(),
	activeStepNonce: 0,
	iterationByNodeId: new Map(),
	activeBranchByNodeId: new Map(),
	failedNodeIds: new Set(),
	failedNodeErrorByNodeId: new Map(),
};

// While a test run is live, this derives everything the canvas animates from
// liveGraphStatus plus the playback's current step. The model is a single
// travelling token: exactly one node highlighted, one edge carrying the
// moving dot — matching the consecutive nature of the execution. Loop
// iteration counters are the exception: they show on every loop the token is
// currently inside (the ancestors of the current step), because they are
// information, not focus.
//
// Everything except the failure marking only means something while a line is
// still PENDING — once the run's playback ends, the token disappears and only
// the error node (if any) keeps marking the graph until the next run starts.
export const getTestRunScope = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	liveGraphStatus: LiveGraphStatus,
	currentStep: TestRunCurrentStep | null,
): TestRunScope => {
	const entries = Object.entries(liveGraphStatus);
	if (entries.length === 0) return EMPTY_TEST_RUN_SCOPE;

	const nodeIdByIndex = new Map<string, string>();
	buildWorkflowIndexes(nodes, edges).forEach((index, nodeId) => {
		nodeIdByIndex.set(index, nodeId);
	});
	const nodeById = new Map(nodes.map((node) => [node.id, node]));

	const failedNodeIds = new Set<string>();
	const failedNodeErrorByNodeId = new Map<string, string>();
	for (const [indexPath, status] of entries) {
		if (!status.errorMessage) continue;
		const nodeId = nodeIdByIndex.get(indexPath);
		if (!nodeId) continue;
		failedNodeIds.add(nodeId);
		failedNodeErrorByNodeId.set(nodeId, status.errorMessage);
	}

	// The token lives exactly as long as the playback's current step is set —
	// TestRunProvider clears it when the presentation ends. Deliberately NOT
	// gated on "something is still PENDING": a method's own COMPLETE line lands
	// a fraction after its PENDING, and with no enclosing loop still PENDING at
	// that moment the token would vanish before the node's delayed ring (0.5s,
	// see nodes.css) ever became visible.
	if (!currentStep) {
		return { ...EMPTY_TEST_RUN_SCOPE, failedNodeIds, failedNodeErrorByNodeId };
	}

	const currentNodeId = nodeIdByIndex.get(currentStep.indexPath);
	if (!currentNodeId) {
		return { ...EMPTY_TEST_RUN_SCOPE, failedNodeIds, failedNodeErrorByNodeId };
	}

	// The current step is deliberately NOT re-checked against its own status:
	// between its COMPLETE line and the next element's PENDING line the token
	// would otherwise blink off for one playback beat on every transition.
	//
	// Two-phase choreography: while the dot is still travelling the edge
	// (hasArrived false, the step's first 0.5s) only the edge animates and the
	// node stays dark; the highlight turns on the moment the dot reaches it.
	const activeNodeIds = new Set(currentStep.hasArrived ? [currentNodeId] : []);
	const activeEdgeIds = new Set(
		edges.filter((edge) => edge.target === currentNodeId).map((edge) => edge.id),
	);

	// Iteration counters for every loop the token is currently inside, and the
	// true/continue label for every if on the current step's own ancestor
	// chain (including itself) — walk its tree-path prefixes and read the
	// values kept fresh by reduceLiveGraphStatus regardless of each
	// operator's own PENDING/COMPLETE toggling between iterations.
	const iterationByNodeId = new Map<string, WorkflowLoopIterationDisplay>();
	const activeBranchByNodeId = new Map<string, 'true' | 'continue'>();
	const segments = currentStep.indexPath.split('_').map(Number);
	for (let take = 1; take <= segments.length; take += 1) {
		const isSelf = take === segments.length;
		const prefix = segments.slice(0, take).join('_');
		const nodeId = nodeIdByIndex.get(prefix);
		const node = nodeId ? nodeById.get(nodeId) : undefined;
		if (!nodeId || !node) continue;
		const status = liveGraphStatus[prefix];
		if (node.type === 'loop' && status?.iterationCount) {
			iterationByNodeId.set(nodeId, { iterator: status.iterator ?? '', count: status.iterationCount, indexPath: prefix });
		}
		if (node.type === 'if' && status?.ifResult && (!isSelf || currentStep.hasArrived)) {
			// A strict ancestor (isSelf false) already finished its own arrival
			// phase in an earlier step, so it's shown unconditionally; the IF
			// currently being arrived AT waits for hasArrived like everything
			// else, so its label doesn't appear before its ring does.
			activeBranchByNodeId.set(nodeId, status.ifResult === 'true' ? 'true' : 'continue');
		}
	}

	// The momentary "continue" case: the token is travelling THIS INSTANT
	// along some IF's continue edge — i.e. the current step's own tree
	// position is exactly the immediately-preceding sibling's position plus
	// one, and that preceding sibling is an IF. Gated on !hasArrived so it
	// clears the moment the dot lands (see the field doc above for why this
	// one doesn't persist the way the ancestor-chain cases above do).
	if (!currentStep.hasArrived) {
		const ownLevel = segments.length - 1;
		const ownOrder = segments[ownLevel];
		if (ownOrder > 0) {
			const precedingSiblingIndex = [...segments.slice(0, ownLevel), ownOrder - 1].join('_');
			const precedingSiblingId = nodeIdByIndex.get(precedingSiblingIndex);
			const precedingSiblingNode = precedingSiblingId ? nodeById.get(precedingSiblingId) : undefined;
			if (precedingSiblingId && precedingSiblingNode?.type === 'if') {
				activeBranchByNodeId.set(precedingSiblingId, 'continue');
			}
		}
	}

	return {
		activeNodeIds,
		activeEdgeIds,
		activeStepNonce: currentStep.nonce,
		iterationByNodeId,
		activeBranchByNodeId,
		failedNodeIds,
		failedNodeErrorByNodeId,
	};
};
