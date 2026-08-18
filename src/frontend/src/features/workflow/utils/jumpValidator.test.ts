import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { JointFieldBinding } from './jumpValidator';
import { evaluateJointTargets, pruneInvalidJoints } from './jumpValidator';

// start-1 -> m-first "0" -> loop-outer "1" -> m-last "2" -> if-top "3" -> m-tail "4"
//   loop-outer (bottom) -> m-in-loop "1_0" -> loop-inner "1_1" -> m-after-inner "1_2"
//                                          -> if-in-loop "1_3"
//     loop-inner (bottom) -> m-in-inner-loop "1_1_0"
//     if-in-loop (true)   -> m-in-if-in-loop "1_3_0"
//   if-top (true) -> m-in-if "3_0"
const method = (id: string, color: string): WorkflowNodeModel => ({
	id,
	type: 'connector',
	position: { x: 0, y: 0 },
	data: { title: id, kind: 'connector', color },
} as unknown as WorkflowNodeModel);

const operator = (id: string, type: 'loop' | 'if'): WorkflowNodeModel => ({
	id,
	type,
	position: { x: 0, y: 0 },
	data: { title: id, kind: type },
} as unknown as WorkflowNodeModel);

const baseNodes: WorkflowNodeModel[] = [
	{ id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: { title: 'Start', kind: 'start' } } as unknown as WorkflowNodeModel,
	method('m-first', '#aaaaaa'),
	operator('loop-outer', 'loop'),
	method('m-last', '#bbbbbb'),
	method('m-in-loop', '#cccccc'),
	operator('loop-inner', 'loop'),
	method('m-after-inner', '#dddddd'),
	method('m-in-inner-loop', '#eeeeee'),
	operator('if-in-loop', 'if'),
	method('m-in-if-in-loop', '#ffaaaa'),
	operator('if-top', 'if'),
	method('m-in-if', '#ffbbbb'),
	method('m-tail', '#ffcccc'),
];

const edges = [
	{ id: 'e0', source: 'start-1', target: 'm-first' },
	{ id: 'e1', source: 'm-first', target: 'loop-outer' },
	{ id: 'e2', source: 'loop-outer', target: 'm-in-loop', sourceHandle: 'bottom' },
	{ id: 'e3', source: 'm-in-loop', target: 'loop-inner' },
	{ id: 'e4', source: 'loop-inner', target: 'm-in-inner-loop', sourceHandle: 'bottom' },
	{ id: 'e5', source: 'loop-inner', target: 'm-after-inner', sourceHandle: 'right' },
	{ id: 'e6', source: 'm-after-inner', target: 'if-in-loop' },
	{ id: 'e7', source: 'if-in-loop', target: 'm-in-if-in-loop', sourceHandle: 'true' },
	{ id: 'e8', source: 'loop-outer', target: 'm-last', sourceHandle: 'right' },
	{ id: 'e9', source: 'm-last', target: 'if-top' },
	{ id: 'e10', source: 'if-top', target: 'm-in-if', sourceHandle: 'true' },
	{ id: 'e11', source: 'if-top', target: 'm-tail', sourceHandle: 'false' },
] as unknown as WorkflowEdgeModel[];

const reasonFor = (sourceId: string, targetId: string, nodes = baseNodes, fieldBindings: JointFieldBinding[] = []) => {
	const verdict = evaluateJointTargets(sourceId, nodes, edges, fieldBindings).get(targetId);
	return verdict?.valid ? 'valid' : verdict?.reason;
};

describe('evaluateJointTargets', () => {
	it('accepts a later method in the same loop scope at the same level', () => {
		expect(reasonFor('m-in-loop', 'm-after-inner')).toBe('valid');
		expect(reasonFor('m-first', 'm-last')).toBe('valid');
	});

	it('accepts a target on another level as long as the loop scope matches', () => {
		// Into an IF branch, both outside every loop.
		expect(reasonFor('m-first', 'm-in-if')).toBe('valid');
		// Out of an IF branch, both outside every loop.
		expect(reasonFor('m-in-if', 'm-tail')).toBe('valid');
		// Into an IF branch, both inside loop-outer.
		expect(reasonFor('m-in-loop', 'm-in-if-in-loop')).toBe('valid');
	});

	it('rejects a method nested in a loop inside the source loop scope', () => {
		expect(reasonFor('m-in-loop', 'm-in-inner-loop')).toBe('different-loop-scope');
	});

	it('rejects crossing a loop boundary in either direction', () => {
		expect(reasonFor('m-in-loop', 'm-last')).toBe('different-loop-scope');
		expect(reasonFor('m-in-if-in-loop', 'm-tail')).toBe('different-loop-scope');
		expect(reasonFor('m-first', 'm-in-loop')).toBe('different-loop-scope');
	});

	it('rejects a method that runs before the source', () => {
		expect(reasonFor('m-after-inner', 'm-in-loop')).toBe('backwards');
		expect(reasonFor('m-in-if', 'm-last')).toBe('backwards');
		expect(reasonFor('m-tail', 'm-in-if')).toBe('backwards');
	});

	it('rejects operators and the source itself', () => {
		expect(reasonFor('m-in-loop', 'loop-inner')).toBe('not-a-method');
		expect(reasonFor('m-in-loop', 'if-in-loop')).toBe('not-a-method');
		expect(reasonFor('m-first', 'm-first')).toBe('self');
	});

	it('returns no targets when the joint starts on an operator', () => {
		expect(evaluateJointTargets('loop-outer', baseNodes, edges).size).toBe(0);
	});

	it('rejects a jump that would skip a method whose response the target uses', () => {
		const nodes = baseNodes.map((node) => node.id === 'm-last'
			? { ...node, data: { ...node.data, methodConfig: { url: 'https://x/#dddddd.(response).body.$.id' } } } as WorkflowNodeModel
			: node);
		const verdict = evaluateJointTargets('m-first', nodes, edges).get('m-last');
		expect(verdict).toEqual({
			valid: false,
			reason: 'skips-referenced-method',
			blockingNodeId: 'm-after-inner',
		});
	});

	it('rejects a jump that would skip a field-binding provider of the target', () => {
		const fieldBindings = [{
			from: [{ color: '#dddddd' }],
			to: [{ color: '#bbbbbb' }],
		}];
		expect(reasonFor('m-first', 'm-last', baseNodes, fieldBindings)).toBe('skips-referenced-method');
	});

	it('accepts only the methods of the source loop scope that run after it', () => {
		const valid = [...evaluateJointTargets('m-in-loop', baseNodes, edges)]
			.filter(([, verdict]) => verdict.valid)
			.map(([nodeId]) => nodeId);
		expect(valid).toEqual(['m-after-inner', 'm-in-if-in-loop']);
	});
});

describe('pruneInvalidJoints', () => {
	it('keeps a joint that still holds and returns the same array', () => {
		const nodes = baseNodes.map((node) => node.id === 'm-in-loop'
			? { ...node, data: { ...node.data, jumpTo: 'm-after-inner' } } as WorkflowNodeModel
			: node);
		const result = pruneInvalidJoints(nodes, edges);
		expect(result.removedSourceIds).toEqual([]);
		expect(result.nodes).toBe(nodes);
	});

	it('keeps a joint that crosses an IF boundary inside one loop', () => {
		const nodes = baseNodes.map((node) => node.id === 'm-in-loop'
			? { ...node, data: { ...node.data, jumpTo: 'm-in-if-in-loop' } } as WorkflowNodeModel
			: node);
		expect(pruneInvalidJoints(nodes, edges).removedSourceIds).toEqual([]);
	});

	it('drops a joint whose target left the source loop scope', () => {
		const nodes = baseNodes.map((node) => node.id === 'm-in-loop'
			? { ...node, data: { ...node.data, jumpTo: 'm-last' } } as WorkflowNodeModel
			: node);
		const result = pruneInvalidJoints(nodes, edges);
		expect(result.removedSourceIds).toEqual(['m-in-loop']);
		expect(result.nodes.find((node) => node.id === 'm-in-loop')?.data.jumpTo).toBeUndefined();
	});

	it('drops a joint whose target no longer exists', () => {
		const nodes = baseNodes
			.filter((node) => node.id !== 'm-after-inner')
			.map((node) => node.id === 'm-in-loop'
				? { ...node, data: { ...node.data, jumpTo: 'm-after-inner' } } as WorkflowNodeModel
				: node);
		expect(pruneInvalidJoints(nodes, edges).removedSourceIds).toEqual(['m-in-loop']);
	});
});
