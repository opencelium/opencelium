import { describe, expect, it, vi } from 'vitest';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import type { JointEdgeCache } from './prepareWorkflowElements.types';
import { buildJointEdges } from './jointEdges';

const node = (id: string, jump?: string) =>
	({ id, type: 'connector', position: { x: 0, y: 0 }, data: { title: id, kind: 'connector', ...(jump ? { jump } : {}) } } as unknown as WorkflowNodeModel);

describe('buildJointEdges', () => {
	it('builds one edge per joint, wired right-to-left as a workflow edge', () => {
		const onRemoveJoint = vi.fn();
		const edges = buildJointEdges([node('a', 'c'), node('b'), node('c')], onRemoveJoint);
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
		expect(buildJointEdges([node('a', 'gone'), node('b', 'b')], undefined)).toEqual([]);
	});

	it('reuses the cached edge object until the joint or the callback changes', () => {
		const cache: JointEdgeCache = new Map();
		const onRemoveJoint = vi.fn();
		const nodes = [node('a', 'c'), node('c')];
		const first = buildJointEdges(nodes, onRemoveJoint, cache);
		const second = buildJointEdges(nodes, onRemoveJoint, cache);
		expect(second[0]).toBe(first[0]);

		// Editing is locked -> no delete callback -> the edge has to be rebuilt.
		const locked = buildJointEdges(nodes, undefined, cache);
		expect(locked[0]).not.toBe(first[0]);
		expect(locked[0].data?.onRemoveJoint).toBeUndefined();
	});

	it('drops cache entries for joints that are gone', () => {
		const cache: JointEdgeCache = new Map();
		buildJointEdges([node('a', 'c'), node('c')], undefined, cache);
		expect([...cache.keys()]).toEqual(['joint-a']);
		buildJointEdges([node('a'), node('c')], undefined, cache);
		expect([...cache.keys()]).toEqual([]);
	});
});
