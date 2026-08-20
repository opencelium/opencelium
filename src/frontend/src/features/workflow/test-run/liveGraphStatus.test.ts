import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildLoopAncestorsByIndexPath, EMPTY_LIVE_GRAPH_STATUS, reduceLiveGraphStatus } from './liveGraphStatus';

// start-1 -> loop-outer -(bottom)-> loop-inner -(bottom)-> method-1
// Mirrors a loop nested inside another loop, the exact shape that re-enters
// (fresh PENDING/COMPLETE cycles) every time the outer loop advances.
const nodes = [
	{ id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: { title: 'Start', kind: 'start' } },
	{ id: 'loop-outer', type: 'loop', position: { x: 0, y: 1 }, data: { title: 'Loop', kind: 'loop' } },
	{ id: 'loop-inner', type: 'loop', position: { x: 0, y: 2 }, data: { title: 'Loop', kind: 'loop' } },
	{ id: 'method-1', type: 'connector', position: { x: 0, y: 3 }, data: { title: 'AddUser', kind: 'connector' } },
] as unknown as WorkflowNodeModel[];

const edges = [
	{ id: 'e1', source: 'start-1', target: 'loop-outer' },
	{ id: 'e2', source: 'loop-outer', target: 'loop-inner', sourceHandle: 'bottom' },
	{ id: 'e3', source: 'loop-inner', target: 'method-1', sourceHandle: 'bottom' },
] as unknown as WorkflowEdgeModel[];

const loopAncestorsByIndexPath = buildLoopAncestorsByIndexPath(nodes, edges);

describe('reduceLiveGraphStatus', () => {
	it('resets a re-entered nested loop back to PENDING even though its previous invocation left it COMPLETE', () => {
		let status = EMPTY_LIVE_GRAPH_STATUS;

		// Outer loop starts (iteration 1).
		status = reduceLiveGraphStatus(
			status,
			{ indexPath: '0', type: 'LOOP', status: 'PENDING', connectorName: null, properties: { iterator: 'i' }, segment: null, error: null } as any,
			loopAncestorsByIndexPath,
		);
		// Inner loop starts (outer iter 1, inner iter 1).
		status = reduceLiveGraphStatus(
			status,
			{ indexPath: '0_0', type: 'LOOP', status: 'PENDING', connectorName: null, properties: { iterator: 'j', loopIndex: '1' }, segment: null, error: null } as any,
			loopAncestorsByIndexPath,
		);
		// Method runs and finishes inside the inner loop's only iteration this pass.
		status = reduceLiveGraphStatus(
			status,
			{ indexPath: '0_0_0', type: 'OPERATION', status: 'COMPLETE', connectorName: null, properties: { loopIndex: '1,1' }, segment: null, error: null } as any,
			loopAncestorsByIndexPath,
		);
		// Inner loop finishes its pass for outer iteration 1.
		status = reduceLiveGraphStatus(
			status,
			{ indexPath: '0_0', type: 'LOOP', status: 'COMPLETE', connectorName: null, properties: { loopIndex: '1' }, segment: null, error: null } as any,
			loopAncestorsByIndexPath,
		);
		expect(status['0_0'].status).toBe('COMPLETE');

		// Outer loop advances to iteration 2 and re-enters the inner loop. Only the
		// nested method's line arrives (no fresh direct line for the inner loop
		// itself) — the ancestor-inference fallback is the only thing that can
		// bring the inner loop back to PENDING.
		status = reduceLiveGraphStatus(
			status,
			{ indexPath: '0_0_0', type: 'OPERATION', status: 'PENDING', connectorName: null, properties: { loopIndex: '2,1' }, segment: null, error: null } as any,
			loopAncestorsByIndexPath,
		);

		expect(status['0_0'].status).toBe('PENDING');
		expect(status['0'].status).toBe('PENDING');
		expect(status['0_0_0'].status).toBe('PENDING');
	});
});
