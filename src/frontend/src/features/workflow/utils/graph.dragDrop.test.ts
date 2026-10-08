import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { copyWorkflowNodeGroup, moveOrCopyWorkflowNodes,
	moveWorkflowNodeGroup } from './graph.dragDrop';

const A = '#3fa9f5';
const B = '#f5a623';
const C = '#9013fe';

const config = (body: unknown = {}) => ({
	url: '', headers: {}, queryParams: [], endpointArgs: {},
	bodyFormat: 'json', bodyData: 'json', body,
});

const method = (id: string, color: string, body?: unknown) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle: id, kind: 'connector', color, methodConfig: config(body) },
}) as unknown as WorkflowNodeModel;

const loop = (id: string) => ({
	id, type: 'loop', position: { x: 0, y: 0 },
	data: { title: 'LOOP', kind: 'loop' },
}) as unknown as WorkflowNodeModel;

const startNode = {
	id: 'start-1', type: 'start', position: { x: 0, y: 0 },
	data: { title: 'Start', kind: 'start' },
} as unknown as WorkflowNodeModel;

const edge = (source: string, target: string, sourceHandle?: string) =>
	({ id: `${source}-${target}`, type: 'workflow-edge', source, target,
		sourceHandle }) as unknown as WorkflowEdgeModel;

const readsA = { id: `${A}.(response).body.$.id` };

// start → A → B (reads A) → C
const chain = () => ({
	nodes: [startNode, method('A', A), method('B', B, readsA), method('C', C)],
	edges: [edge('start-1', 'A'), edge('A', 'B'), edge('B', 'C')],
});

const mainLine = (edges: WorkflowEdgeModel[], from = 'start-1') => {
	const order: string[] = [];
	let current: string | undefined = from;
	while (current) {
		const id: string = current;
		order.push(id);
		current = edges.find((item) => item.source === id
			&& item.sourceHandle !== 'bottom')?.target;
	}
	return order;
};

const nodeById = (nodes: WorkflowNodeModel[], id?: string) =>
	nodes.find((node) => node.id === id);

describe('moveOrCopyWorkflowNodes', () => {
	it('reports a reference the moved provider no longer satisfies', () => {
		const { nodes, edges } = chain();
		const result = moveOrCopyWorkflowNodes({ sourceNodeId: 'A', mode: 'move',
			target: { nodeId: 'B', direction: 'right' }, nodes, edges, fieldBindings: [] });
		expect(mainLine(result.edges)).toEqual(['start-1', 'B', 'A', 'C']);
		expect(result.invalidReferences).toEqual([{ consumerNodeId: 'B', sourceColor: A }]);
	});

	it('leaves the graph alone when a node is dropped onto itself', () => {
		const { nodes, edges } = chain();
		const result = moveOrCopyWorkflowNodes({ sourceNodeId: 'B', mode: 'move',
			target: { nodeId: 'B', direction: 'right' }, nodes, edges });
		expect(result.nodes).toBe(nodes);
		expect(result.edges).toBe(edges);
	});

	it('copies a node next to itself with a fresh id and colour', () => {
		const { nodes, edges } = chain();
		const result = moveOrCopyWorkflowNodes({ sourceNodeId: 'C', mode: 'copy',
			target: { nodeId: 'C', direction: 'right' }, nodes, edges });
		const copyId = result.idMap?.get('C');
		expect(mainLine(result.edges)).toEqual(['start-1', 'A', 'B', 'C', copyId]);
		expect(nodeById(result.nodes, copyId)?.data.color).not.toBe(C);
	});
});

describe('moveWorkflowNodeGroup', () => {
	it('reports a reference broken by an earlier root of the group', () => {
		const { nodes, edges } = chain();
		const result = moveWorkflowNodeGroup({ sourceNodeIds: ['A', 'C'],
			target: { nodeId: 'B', direction: 'right' }, nodes, edges, fieldBindings: [] });
		expect(mainLine(result.edges)).toEqual(['start-1', 'B', 'A', 'C']);
		expect(result.invalidReferences).toEqual([{ consumerNodeId: 'B', sourceColor: A }]);
	});

	it('does not flag a reference that stays satisfied once the whole group has landed', () => {
		const nodes = [startNode, method('X', C), method('A', A), method('B', B, readsA)];
		const edges = [edge('start-1', 'X'), edge('X', 'A'), edge('A', 'B')];
		const result = moveWorkflowNodeGroup({ sourceNodeIds: ['A', 'B'],
			target: { nodeId: 'start-1', direction: 'right' }, nodes, edges, fieldBindings: [] });
		expect(mainLine(result.edges)).toEqual(['start-1', 'A', 'B', 'X']);
		expect(result.invalidReferences).toEqual([]);
	});

	it('clears the broken reference when asked to', () => {
		const { nodes, edges } = chain();
		const result = moveWorkflowNodeGroup({ sourceNodeIds: ['A', 'C'], cleanInvalid: true,
			target: { nodeId: 'B', direction: 'right' }, nodes, edges, fieldBindings: [] });
		expect(result.invalidReferences).toEqual([]);
		expect(nodeById(result.nodes, 'B')?.data.methodConfig?.body).toEqual({ id: '' });
	});

	it('moves a selected child once, together with its selected operator', () => {
		const nodes = [startNode, method('A', A), loop('L'), method('X', B), method('C', C)];
		const edges = [edge('start-1', 'A'), edge('A', 'L'), edge('L', 'X', 'bottom'),
			edge('L', 'C', 'right')];
		const result = moveWorkflowNodeGroup({ sourceNodeIds: ['L', 'X'],
			target: { nodeId: 'C', direction: 'right' }, nodes, edges });
		expect(mainLine(result.edges)).toEqual(['start-1', 'A', 'C', 'L']);
		expect(result.edges.some((item) => item.source === 'L' && item.target === 'X'
			&& item.sourceHandle === 'bottom')).toBe(true);
		expect(result.nodes.filter((node) => node.id === 'X')).toHaveLength(1);
	});

	it('refuses to drop the group inside one of its own subtrees', () => {
		const nodes = [startNode, method('A', A), loop('L'), method('X', B)];
		const edges = [edge('start-1', 'A'), edge('A', 'L'), edge('L', 'X', 'bottom')];
		const result = moveWorkflowNodeGroup({ sourceNodeIds: ['A', 'L'],
			target: { nodeId: 'X', direction: 'right' }, nodes, edges });
		expect(result.edges).toBe(edges);
	});
});

describe('copyWorkflowNodeGroup', () => {
	it('points a reference between two copied roots at the copy', () => {
		const { nodes, edges } = chain();
		const result = copyWorkflowNodeGroup({ sourceNodeIds: ['A', 'B'],
			target: { nodeId: 'C', direction: 'right' }, nodes, edges, fieldBindings: [] });
		const aCopy = nodeById(result.nodes, result.idMap?.get('A'));
		const bCopy = nodeById(result.nodes, result.idMap?.get('B'));
		expect(mainLine(result.edges)).toEqual(['start-1', 'A', 'B', 'C', aCopy?.id, bCopy?.id]);
		expect(bCopy?.data.methodConfig?.body).toEqual({
			id: `${aCopy?.data.color}.(response).body.$.id`,
		});
		expect(nodeById(result.nodes, 'B')?.data.methodConfig?.body).toEqual(readsA);
		expect(result.invalidReferences).toEqual([]);
	});

	it('keeps a reference to a provider that was not copied', () => {
		const { nodes, edges } = chain();
		const result = copyWorkflowNodeGroup({ sourceNodeIds: ['B', 'C'],
			target: { nodeId: 'C', direction: 'right' }, nodes, edges, fieldBindings: [] });
		const bCopy = nodeById(result.nodes, result.idMap?.get('B'));
		expect(bCopy?.data.methodConfig?.body).toEqual(readsA);
		expect(result.invalidReferences).toEqual([]);
	});

	it('gives every copy its own colour', () => {
		const { nodes, edges } = chain();
		const result = copyWorkflowNodeGroup({ sourceNodeIds: ['A', 'B', 'C'],
			target: { nodeId: 'C', direction: 'right' }, nodes, edges });
		const colors = result.nodes.map((node) => node.data.color).filter(Boolean);
		expect(new Set(colors).size).toBe(colors.length);
	});
});
