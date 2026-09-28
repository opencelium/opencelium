import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { copyWorkflowNodeGroup, moveOrCopyWorkflowNodes,
	moveWorkflowNodeGroup } from './graph.dragDrop';

const M1 = '#C77E7E';
const readsIterator = (iterator: string) => `${M1}.(response).body.$.[${iterator}].id`;

const method = (id: string, color: string, body: Record<string, string> = {}) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle: id, kind: 'connector', color, methodConfig: {
		url: '', headers: {}, queryParams: [], endpointArgs: {},
		bodyFormat: 'json', bodyData: 'json', body,
	} },
}) as unknown as WorkflowNodeModel;

const loop = (id: string, iterator: string) => ({
	id, type: 'loop', position: { x: 0, y: 0 },
	data: { title: 'LOOP', kind: 'loop', conditionConfig: {
		operatorType: 'loop', iterator, expression: `for {%${M1}.(response).body.$.[*]%}`,
		tree: { id: 'root', type: 'group', properties: {}, items: [] },
	} },
}) as unknown as WorkflowNodeModel;

const startNode = {
	id: 'start-1', type: 'start', position: { x: 0, y: 0 },
	data: { title: 'Start', kind: 'start' },
} as unknown as WorkflowNodeModel;

const edge = (source: string, target: string, sourceHandle?: string) =>
	({ id: `${source}-${target}`, type: 'workflow-edge', source, target,
		sourceHandle }) as unknown as WorkflowEdgeModel;

// start → M1 → L(i) → B;  L ▼ A (reads [i]) → A2
const graph = (aBody: Record<string, string> = { id: readsIterator('i') }) => ({
	nodes: [startNode, method('M1', M1), loop('L', 'i'), method('A', '#6477AB', aBody),
		method('A2', '#9EC798'), method('B', '#98BEC7')],
	edges: [edge('start-1', 'M1'), edge('M1', 'L'), edge('L', 'A', 'bottom'),
		edge('A', 'A2'), edge('L', 'B', 'right')],
});

const bodyOf = (nodes: WorkflowNodeModel[], id?: string) =>
	nodes.find((node) => node.id === id)?.data.methodConfig?.body;

describe('loop iterator scope on drop', () => {
	it('flags a method moved out of the loop whose iterator it reads', () => {
		const { nodes, edges } = graph();
		const result = moveOrCopyWorkflowNodes({ sourceNodeId: 'A', mode: 'move',
			target: { nodeId: 'L', direction: 'right' }, nodes, edges, fieldBindings: [] });
		expect(result.invalidReferences).toEqual([{ consumerNodeId: 'A', sourceColor: '#c77e7e', iterator: 'i' }]);
	});

	it('clears only the iterator reference when the drop is confirmed', () => {
		const wholeArray = `${M1}.(response).body.$.[*].name`;
		const { nodes, edges } = graph({ id: readsIterator('i'), name: wholeArray, plain: 'kept' });
		const result = moveWorkflowNodeGroup({ sourceNodeIds: ['A', 'A2'], cleanInvalid: true,
			target: { nodeId: 'L', direction: 'right' }, nodes, edges, fieldBindings: [] });
		expect(result.invalidReferences).toEqual([]);
		expect(bodyOf(result.nodes, 'A')).toEqual({ id: '', name: wholeArray, plain: 'kept' });
	});

	it('keeps the enhancement arguments that do not read the iterator', () => {
		const { nodes, edges } = graph({ id: '' });
		const fieldBindings = [{ enhancement: { enhanceId: 'e1', script: 'RESULT_VAR = VAR_0 + VAR_1',
			args: { RESULT_VAR: '#6477AB.(request).body.$.id', VAR_0: readsIterator('i'),
				VAR_1: `${M1}.(response).body.$.[0].id` } } }];
		const result = moveOrCopyWorkflowNodes({ sourceNodeId: 'A', mode: 'move', cleanInvalid: true,
			target: { nodeId: 'L', direction: 'right' }, nodes, edges, fieldBindings });
		const args = (result.fieldBindings?.[0] as { enhancement: { args: Record<string, string> } })
			.enhancement.args;
		expect(args.VAR_0).toBeUndefined();
		expect(args.VAR_1).toBe(`${M1}.(response).body.$.[0].id`);
	});

	it('flags a copy pasted outside the loop', () => {
		const { nodes, edges } = graph();
		const result = copyWorkflowNodeGroup({ sourceNodeIds: ['A'],
			target: { nodeId: 'B', direction: 'right' }, nodes, edges, fieldBindings: [] });
		expect(result.invalidReferences).toEqual([
			{ consumerNodeId: result.idMap?.get('A'), sourceColor: '#c77e7e', iterator: 'i' },
		]);
	});

	it('accepts a move that stays inside the loop', () => {
		const { nodes, edges } = graph();
		const result = moveOrCopyWorkflowNodes({ sourceNodeId: 'A', mode: 'move',
			target: { nodeId: 'A2', direction: 'right' }, nodes, edges, fieldBindings: [] });
		expect(result.invalidReferences).toEqual([]);
	});

	it('keeps an outer iterator valid when leaving only the inner loop', () => {
		// start → M1 → L(i);  L ▼ L2(j);  L2 ▼ C
		const build = (iterator: string) => ({
			nodes: [startNode, method('M1', M1), loop('L', 'i'), loop('L2', 'j'),
				method('C', '#6477AB', { id: readsIterator(iterator) })],
			edges: [edge('start-1', 'M1'), edge('M1', 'L'), edge('L', 'L2', 'bottom'),
				edge('L2', 'C', 'bottom')],
		});
		const drop = (iterator: string) => {
			const { nodes, edges } = build(iterator);
			return moveOrCopyWorkflowNodes({ sourceNodeId: 'C', mode: 'move',
				target: { nodeId: 'L2', direction: 'right' }, nodes, edges, fieldBindings: [] });
		};
		expect(drop('i').invalidReferences).toEqual([]);
		expect(drop('j').invalidReferences).toEqual([{ consumerNodeId: 'C', sourceColor: '#c77e7e', iterator: 'j' }]);
	});

	it('flags an enhancement argument that reads the iterator', () => {
		const { nodes, edges } = graph({ id: '' });
		const fieldBindings = [{ enhancement: { enhanceId: 'e1', script: 'RESULT_VAR = VAR_0',
			args: { RESULT_VAR: '#6477AB.(request).body.$.id', VAR_0: readsIterator('i') } } }];
		const result = moveOrCopyWorkflowNodes({ sourceNodeId: 'A', mode: 'move',
			target: { nodeId: 'L', direction: 'right' }, nodes, edges, fieldBindings });
		expect(result.invalidReferences).toEqual([{ consumerNodeId: 'A', sourceColor: '#c77e7e', iterator: 'i' }]);
	});
});
