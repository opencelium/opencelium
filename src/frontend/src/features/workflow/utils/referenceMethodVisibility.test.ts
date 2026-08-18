import { describe, expect, it } from 'vitest';
import type { Connection, MethodWithId } from '../types/connection';
import {
	collectJointReferenceEdges,
	getEligibleReferenceMethods,
	getUpstreamNodeIds,
} from './referenceMethodVisibility';

const method = (id: string, index: string, jumpTo?: string) =>
	({ id, index, name: id, color: `#00000${index}`, ...(jumpTo ? { jumpTo } : {}) } as MethodWithId);

// start -> m0 -> loop -(bottom)-> m1 (inside the loop)
//              loop -(right)-> m2 -> m3
const connectionWith = (methods: MethodWithId[]) => ({
	fromConnector: { method: methods, operator: [] },
	ui: {
		workflowEdges: [
			{ source: 'start-1', target: 'm0' },
			{ source: 'm0', target: 'loop' },
			{ source: 'loop', target: 'm1' },
			{ source: 'loop', target: 'm2' },
			{ source: 'm2', target: 'm3' },
		],
	},
} as unknown as Connection);

describe('getEligibleReferenceMethods', () => {
	const methods = [method('m0', '0'), method('m1', '1_0'), method('m2', '2'), method('m3', '3')];

	it('offers only the methods upstream of the current one', () => {
		const eligible = getEligibleReferenceMethods(connectionWith(methods), methods[2]);
		expect(eligible.map((item) => item.id)).toEqual(['m0']);
	});

	it('adds the joint source and everything it sees to the joint target', () => {
		const jointed = [method('m0', '0'), method('m1', '1_0', 'm3'), method('m2', '2'), method('m3', '3')];
		const eligible = getEligibleReferenceMethods(connectionWith(jointed), jointed[3]);
		expect(eligible.map((item) => item.id).sort()).toEqual(['m0', 'm1', 'm2']);
	});

	it('falls back to workflow-index order when the connection carries no edges', () => {
		const connection = { fromConnector: { method: methods, operator: [] }, ui: {} } as unknown as Connection;
		const eligible = getEligibleReferenceMethods(connection, methods[2]);
		expect(eligible.map((item) => item.id)).toEqual(['m0', 'm1']);
	});
});

describe('collectJointReferenceEdges', () => {
	it('ignores a jumpTo that is not another method id (payload-shaped index)', () => {
		expect(collectJointReferenceEdges([{ id: 'm1', jumpTo: '1_2' }, { id: 'm2' }])).toEqual([]);
		expect(collectJointReferenceEdges([{ id: 'm1', jumpTo: 'm2' }, { id: 'm2' }]))
			.toEqual([{ source: 'm1', target: 'm2' }]);
	});
});

describe('getUpstreamNodeIds', () => {
	it('terminates on a cycle', () => {
		const edges = [{ source: 'a', target: 'b' }, { source: 'b', target: 'a' }];
		expect([...getUpstreamNodeIds('a', edges)].sort()).toEqual(['a', 'b']);
	});
});
