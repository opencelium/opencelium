import { describe, expect, it, vi } from 'vitest';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import type { JointEdgeCache } from './prepareWorkflowElements.types';
import { buildJointEdges } from './jointEdges';

// No test run in flight, which is what every case here is about; the travelling
// token gets its own case at the bottom.
const IDLE = { activeEdgeIds: new Set<string>(), activeStepNonce: 0 };

const node = (id: string, jump?: string) =>
	({ id, type: 'connector', position: { x: 0, y: 0 }, data: { title: id, kind: 'connector', ...(jump ? { jump } : {}) } } as unknown as WorkflowNodeModel);

describe('buildJointEdges', () => {
	it('builds one edge per joint, wired right-to-left as a workflow edge', () => {
		const onRemoveJoint = vi.fn();
		const edges = buildJointEdges([node('a', 'c'), node('b'), node('c')], onRemoveJoint, IDLE);
		expect(edges).toHaveLength(1);
		expect(edges[0]).toMatchObject({
			id: 'joint-a',
			source: 'a',
			target: 'c',
			sourceHandle: 'right',
			targetHandle: 'left',
			type: 'workflow-edge',
			selectable: true,
			deletable: false,
			data: { joint: true, jointSourceNodeId: 'a', onRemoveJoint },
		});
	});

	it('skips dangling and self joints', () => {
		expect(buildJointEdges([node('a', 'gone'), node('b', 'b')], undefined, IDLE)).toEqual([]);
	});

	it('reuses the cached edge object until the joint or the callback changes', () => {
		const cache: JointEdgeCache = new Map();
		const onRemoveJoint = vi.fn();
		const nodes = [node('a', 'c'), node('c')];
		const first = buildJointEdges(nodes, onRemoveJoint, IDLE, cache);
		const second = buildJointEdges(nodes, onRemoveJoint, IDLE, cache);
		expect(second[0]).toBe(first[0]);

		// Editing is locked -> no delete callback -> the edge has to be rebuilt.
		const locked = buildJointEdges(nodes, undefined, IDLE, cache);
		expect(locked[0]).not.toBe(first[0]);
		expect(locked[0].data?.onRemoveJoint).toBeUndefined();
	});

	it('drops cache entries for joints that are gone', () => {
		const cache: JointEdgeCache = new Map();
		buildJointEdges([node('a', 'c'), node('c')], undefined, IDLE, cache);
		expect([...cache.keys()]).toEqual(['joint-a']);
		buildJointEdges([node('a'), node('c')], undefined, IDLE, cache);
		expect([...cache.keys()]).toEqual([]);
	});

	it('carries the travelling dot while the run is jumping along it', () => {
		const cache: JointEdgeCache = new Map();
		const nodes = [node('a', 'c'), node('c')];
		const idle = buildJointEdges(nodes, undefined, IDLE, cache);
		expect(idle[0].data).toMatchObject({ testRunActive: false, testRunNonce: 0 });

		const active = buildJointEdges(nodes, undefined,
			{ activeEdgeIds: new Set(['joint-a']), activeStepNonce: 12 }, cache);
		expect(active[0].data).toMatchObject({ testRunActive: true, testRunNonce: 12 });
		// A new transition has to produce a new object, or the dot would not restart.
		expect(active[0]).not.toBe(idle[0]);
	});
});
