import { describe, expect, it } from 'vitest';
import type { LiveGraphStatus } from '../../test-run/liveGraphStatus';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { getTestRunScope } from './testRunScope.utils';

// start-1 -> method-top -> loop-outer -(bottom)-> if-inner
//   if-inner -(true/bottom)-> method-inner          (nested true-branch: 1_0_0)
//   if-inner -(false/right, "continue")-> method-after (same-level sibling: 1_1)
// Mirrors the reported example: 1_0_0 if, 1_0_0_0 method (true branch), 1_0_1
// method (continue) — offset by one level here since there's no outer if wrapper.
const nodes = [
	{ id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: { title: 'Start', kind: 'start' } },
	{ id: 'method-top', type: 'connector', position: { x: 0, y: 1 }, data: { title: 'GetAllUser', kind: 'connector' } },
	{ id: 'loop-outer', type: 'loop', position: { x: 0, y: 2 }, data: { title: 'Loop', kind: 'loop' } },
	{ id: 'if-inner', type: 'if', position: { x: 0, y: 3 }, data: { title: 'If', kind: 'if' } },
	{ id: 'method-inner', type: 'connector', position: { x: 0, y: 4 }, data: { title: 'AddUser', kind: 'connector' } },
	{ id: 'method-after', type: 'connector', position: { x: 0, y: 5 }, data: { title: 'NotifyUser', kind: 'connector' } },
] as unknown as WorkflowNodeModel[];

const edges = [
	{ id: 'e1', source: 'start-1', target: 'method-top' },
	{ id: 'e2', source: 'method-top', target: 'loop-outer' },
	{ id: 'e3', source: 'loop-outer', target: 'if-inner', sourceHandle: 'bottom' },
	{ id: 'e4', source: 'if-inner', target: 'method-inner', sourceHandle: 'true' },
	{ id: 'e5', source: 'if-inner', target: 'method-after', sourceHandle: 'false' },
] as unknown as WorkflowEdgeModel[];

describe('getTestRunScope', () => {
	it('highlights exactly the current step and the single edge feeding it', () => {
		const liveGraphStatus: LiveGraphStatus = { '0': { status: 'PENDING' } };
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, { indexPath: '0', nonce: 1, hasArrived: true });
		expect([...scope.activeNodeIds]).toEqual(['method-top']);
		expect([...scope.activeEdgeIds]).toEqual(['e1']);
		expect(scope.activeStepNonce).toBe(1);
	});

	it('keeps the node dark while the dot is still travelling, lighting only the edge', () => {
		const liveGraphStatus: LiveGraphStatus = { '0': { status: 'PENDING' } };
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, { indexPath: '0', nonce: 1, hasArrived: false });
		expect(scope.activeNodeIds.size).toBe(0);
		expect([...scope.activeEdgeIds]).toEqual(['e1']);
	});

	it('moves the single highlight to the nested method while its enclosing loop stays unlit', () => {
		// Execution is consecutive — the token sits on the method the playback
		// is showing, never simultaneously on the operators around it.
		const liveGraphStatus: LiveGraphStatus = {
			'1': { status: 'PENDING', iterator: 'i', iterationCount: 3 },
			'1_0': { status: 'COMPLETE', ifResult: 'true' },
			'1_0_0': { status: 'PENDING' },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, { indexPath: '1_0_0', nonce: 7, hasArrived: true });
		expect([...scope.activeNodeIds]).toEqual(['method-inner']);
		expect([...scope.activeEdgeIds]).toEqual(['e4']);
		expect(scope.activeStepNonce).toBe(7);
	});

	it('keeps the iteration counter on every loop the current step is nested inside', () => {
		const liveGraphStatus: LiveGraphStatus = {
			'1': { status: 'COMPLETE', iterator: 'i', iterationCount: 3 },
			'1_0': { status: 'COMPLETE', ifResult: 'true' },
			'1_0_0': { status: 'PENDING' },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, { indexPath: '1_0_0', nonce: 2, hasArrived: true });
		expect(scope.iterationByNodeId.get('loop-outer')).toEqual({ iterator: 'i', count: 3, indexPath: '1' });
	});

	it('highlights the taken branch on every if the current step is on or nested inside', () => {
		const liveGraphStatus: LiveGraphStatus = {
			'1_0': { status: 'COMPLETE', ifResult: 'true' },
			'1_0_0': { status: 'PENDING' },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, { indexPath: '1_0_0', nonce: 5, hasArrived: true });
		expect(scope.activeBranchByNodeId.get('if-inner')).toBe('true');
	});

	it('highlights "continue" while sitting on the if itself once its result is false', () => {
		// A false result never has a branch to descend into — the continue edge
		// is effectively already taken the moment the result is known.
		const liveGraphStatus: LiveGraphStatus = {
			'1_0': { status: 'PENDING', ifResult: 'false' },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, { indexPath: '1_0', nonce: 6, hasArrived: true });
		expect(scope.activeBranchByNodeId.get('if-inner')).toBe('continue');
	});

	it('highlights "continue" only while the dot travels to the continue sibling, clearing once it arrives', () => {
		// Reported example: if(1_0) -> true branch method(1_0_0) -> continue
		// sibling method(1_1). The if's own result was TRUE, but while the dot
		// travels toward the sibling reached via its continue edge, "continue"
		// — not "true" — is what should light up, and only for that transit.
		const liveGraphStatus: LiveGraphStatus = {
			'1_0': { status: 'COMPLETE', ifResult: 'true' },
			'1_0_0': { status: 'COMPLETE' },
			'1_1': { status: 'PENDING' },
		};
		const travelling = getTestRunScope(nodes, edges, liveGraphStatus, { indexPath: '1_1', nonce: 8, hasArrived: false });
		expect(travelling.activeBranchByNodeId.get('if-inner')).toBe('continue');
		expect(travelling.activeNodeIds.size).toBe(0);

		const arrived = getTestRunScope(nodes, edges, liveGraphStatus, { indexPath: '1_1', nonce: 8, hasArrived: true });
		expect(arrived.activeBranchByNodeId.has('if-inner')).toBe(false);
		expect([...arrived.activeNodeIds]).toEqual(['method-after']);
	});

	it('waits for the dot to arrive at the if itself before showing its own label, even with a known result', () => {
		const liveGraphStatus: LiveGraphStatus = {
			'1_0': { status: 'PENDING', ifResult: 'false' },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, { indexPath: '1_0', nonce: 6, hasArrived: false });
		expect(scope.activeBranchByNodeId.has('if-inner')).toBe(false);
	});

	it('does not highlight a branch before the if result is known', () => {
		const liveGraphStatus: LiveGraphStatus = {
			'1_0': { status: 'PENDING' },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, { indexPath: '1_0', nonce: 1, hasArrived: true });
		expect(scope.activeBranchByNodeId.has('if-inner')).toBe(false);
	});

	it('shows the live count from the very first iteration when the loop itself is the current step', () => {
		const liveGraphStatus: LiveGraphStatus = {
			'1': { status: 'PENDING', iterator: 'i', iterationCount: 1 },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, { indexPath: '1', nonce: 1, hasArrived: true });
		expect([...scope.activeNodeIds]).toEqual(['loop-outer']);
		expect(scope.iterationByNodeId.get('loop-outer')).toEqual({ iterator: 'i', count: 1, indexPath: '1' });
	});

	it('keeps the token on a completed step until the next one starts (no mid-run blink)', () => {
		// A top-level method's COMPLETE line lands a fraction after its PENDING —
		// with nothing else PENDING at that instant, the token must survive the
		// gap or the node's delayed ring (0.5s) would never become visible.
		const liveGraphStatus: LiveGraphStatus = {
			'0': { status: 'COMPLETE' },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, { indexPath: '0', nonce: 3, hasArrived: true });
		expect([...scope.activeNodeIds]).toEqual(['method-top']);
		expect([...scope.activeEdgeIds]).toEqual(['e1']);
	});

	it('drops the token entirely once playback ends and the current step is cleared', () => {
		const liveGraphStatus: LiveGraphStatus = {
			'0': { status: 'COMPLETE' },
			'1': { status: 'COMPLETE', iterator: 'i', iterationCount: 3 },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, null);
		expect(scope.activeNodeIds.size).toBe(0);
		expect(scope.activeEdgeIds.size).toBe(0);
		expect(scope.iterationByNodeId.size).toBe(0);
	});

	it('marks only the node that received error attribution as failed, not every FAIL entry', () => {
		// A real failure inside a loop: the error is attributed (errorMessage) to
		// the inner method via error.originOfErrorPath, while the enclosing loop's
		// own line also ends up FAIL (its last status line, or failPendingGraphStatus).
		const liveGraphStatus: LiveGraphStatus = {
			'1': { status: 'FAIL' },
			'1_0_0': { status: 'FAIL', errorMessage: 'boom' },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, null);
		expect(scope.failedNodeIds.has('method-inner')).toBe(true);
		expect(scope.failedNodeIds.has('loop-outer')).toBe(false);
		expect(scope.failedNodeErrorByNodeId.get('method-inner')).toBe('boom');
	});

	it('marks nothing as failed when a run is stopped without an error', () => {
		// Stopping a test flips every still-pending entry to FAIL
		// (failPendingGraphStatus) — none of them carry an errorMessage, so none
		// of them may turn red.
		const liveGraphStatus: LiveGraphStatus = {
			'0': { status: 'COMPLETE' },
			'1': { status: 'FAIL', iterator: 'i', iterationCount: 3 },
			'1_0': { status: 'FAIL' },
		};
		// finishPresentation clears the current step when the stopped run's
		// playback is closed, so the scope is queried with null.
		const scope = getTestRunScope(nodes, edges, liveGraphStatus, null);
		expect(scope.failedNodeIds.size).toBe(0);
		expect(scope.failedNodeErrorByNodeId.size).toBe(0);
		expect(scope.activeNodeIds.size).toBe(0);
	});

	// The reported log: inside the loop's second iteration the IF's true branch
	// runs 1_0_0, then execution resumes at 1_1 — the method between them never
	// appears, because a joint on 1_0_0 skipped straight there.
	describe('a joint the engine took', () => {
		const nodesWithJoint = nodes.map((node) => (node.id === 'method-inner'
			? { ...node, data: { ...node.data, jump: 'method-after' } }
			: node)) as unknown as WorkflowNodeModel[];
		const liveGraphStatus: LiveGraphStatus = {
			'1': { status: 'PENDING', iterator: 'i', iterationCount: 2 },
			'1_0': { status: 'COMPLETE', ifResult: 'true' },
			'1_0_0': { status: 'COMPLETE' },
			'1_1': { status: 'COMPLETE' },
		};

		it('animates the joint instead of the edge into the target', () => {
			const scope = getTestRunScope(nodesWithJoint, edges, liveGraphStatus,
				{ indexPath: '1_1', loopIndex: '1', fromIndexPath: '1_0_0', nonce: 9, hasArrived: false });

			expect([...scope.activeEdgeIds]).toEqual(['joint-method-inner']);
			// The natural edge into that same target stays dark — one token, one edge.
			expect(scope.activeEdgeIds.has('e5')).toBe(false);
			expect(scope.activeStepNonce).toBe(9);
		});

		it('animates the ordinary edge when the same target is reached without jumping', () => {
			// Same node entered from the IF above it (the false/continue edge), as in
			// the iteration where the branch that owns the joint never ran.
			const scope = getTestRunScope(nodesWithJoint, edges, liveGraphStatus,
				{ indexPath: '1_1', loopIndex: '0', fromIndexPath: '1_0', nonce: 4, hasArrived: false });

			expect([...scope.activeEdgeIds]).toEqual(['e5']);
		});

		it('ignores a joint that does not point at the node being entered', () => {
			const elsewhere = nodes.map((node) => (node.id === 'method-inner'
				? { ...node, data: { ...node.data, jump: 'method-top' } }
				: node)) as unknown as WorkflowNodeModel[];

			const scope = getTestRunScope(elsewhere, edges, liveGraphStatus,
				{ indexPath: '1_1', loopIndex: '1', fromIndexPath: '1_0_0', nonce: 5, hasArrived: false });

			expect([...scope.activeEdgeIds]).toEqual(['e5']);
		});

		it('falls back to the ordinary edge on the first step, which departed from nowhere', () => {
			const scope = getTestRunScope(nodesWithJoint, edges, liveGraphStatus,
				{ indexPath: '1_1', loopIndex: '1', nonce: 1, hasArrived: false });

			expect([...scope.activeEdgeIds]).toEqual(['e5']);
		});
	});
});
