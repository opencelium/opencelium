import { describe, expect, it } from 'vitest';
import type { LiveGraphStatus } from '../../test-run/liveGraphStatus';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { getTestRunScope } from './testRunScope.utils';

// start-1 -> method-top -> loop-outer -(bottom)-> method-inner
const nodes = [
	{ id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: { title: 'Start', kind: 'start' } },
	{ id: 'method-top', type: 'connector', position: { x: 0, y: 1 }, data: { title: 'GetAllUser', kind: 'connector' } },
	{ id: 'loop-outer', type: 'loop', position: { x: 0, y: 2 }, data: { title: 'Loop', kind: 'loop' } },
	{ id: 'method-inner', type: 'connector', position: { x: 0, y: 3 }, data: { title: 'AddUser', kind: 'connector' } },
] as unknown as WorkflowNodeModel[];

const edges = [
	{ id: 'e1', source: 'start-1', target: 'method-top' },
	{ id: 'e2', source: 'method-top', target: 'loop-outer' },
	{ id: 'e3', source: 'loop-outer', target: 'method-inner', sourceHandle: 'bottom' },
] as unknown as WorkflowEdgeModel[];

describe('getTestRunScope', () => {
	it('pulses a top-level method (no enclosing operator) while it is PENDING', () => {
		const liveGraphStatus: LiveGraphStatus = { '0': { status: 'PENDING' } };
		const scope = getTestRunScope(nodes, edges, liveGraphStatus);
		expect(scope.activeNodeIds.has('method-top')).toBe(true);
	});

	it('pulses the operator, but never the method nested inside it, while both are PENDING', () => {
		const liveGraphStatus: LiveGraphStatus = {
			'1': { status: 'PENDING' },
			'1_0': { status: 'PENDING' },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus);
		expect(scope.activeNodeIds.has('loop-outer')).toBe(true);
		expect(scope.activeNodeIds.has('method-inner')).toBe(false);
		expect(scope.scopeNodeIds.has('method-inner')).toBe(true);
	});

	it('keeps the operator active off its pending descendant even while its own line says COMPLETE between iterations', () => {
		// Mirrors what the backend actually does: a loop's own PENDING/COMPLETE
		// line toggles once per iteration boundary. Reacting to that literally
		// used to flash the whole loop body off between every pass.
		const liveGraphStatus: LiveGraphStatus = {
			'1': { status: 'COMPLETE', iterator: 'i', iterationCount: 3, speed: 'slow' },
			'1_0': { status: 'PENDING' },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus);
		expect(scope.activeNodeIds.has('loop-outer')).toBe(true);
		expect(scope.iterationByNodeId.get('loop-outer')).toEqual({ iterator: 'i', count: 3 });
	});

	it('omits the iteration display entirely for a loop classified as fast', () => {
		const liveGraphStatus: LiveGraphStatus = {
			'1': { status: 'PENDING', iterator: 'i', iterationCount: 3, speed: 'fast' },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus);
		expect(scope.iterationByNodeId.has('loop-outer')).toBe(false);
	});

	it('shows the live count for a loop classified as slow', () => {
		const liveGraphStatus: LiveGraphStatus = {
			'1': { status: 'PENDING', iterator: 'i', iterationCount: 3, speed: 'slow' },
		};
		const scope = getTestRunScope(nodes, edges, liveGraphStatus);
		expect(scope.iterationByNodeId.get('loop-outer')).toEqual({ iterator: 'i', count: 3 });
	});
});
