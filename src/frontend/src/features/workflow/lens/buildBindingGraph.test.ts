import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildBindingGraph } from './buildBindingGraph';

const method = (id: string, name: string, color: string) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle: name, kind: 'connector', color },
}) as unknown as WorkflowNodeModel;

const operator = (id: string, type: 'loop' | 'if') => ({
	id, type, position: { x: 0, y: 0 }, data: { title: type.toUpperCase(), kind: type },
}) as unknown as WorkflowNodeModel;

const startNode = {
	id: 'start-1', type: 'start', position: { x: 0, y: 0 },
	data: { title: 'Start', kind: 'start' },
} as unknown as WorkflowNodeModel;

const edge = (id: string, source: string, target: string,
	sourceHandle?: string, targetHandle?: string) =>
	({ id, type: 'workflow-edge', source, target, sourceHandle, targetHandle }) as unknown as WorkflowEdgeModel;

// start → m1 → LOOP ─bottom→ m2          (m2 sits inside the loop)
//                    └─right→ m3 → m4
const nodes = [
	startNode,
	method('m1', 'GetUsers', '#3fa9f5'),
	operator('loop-1', 'loop'),
	method('m2', 'CreateTicket', '#f5a623'),
	method('m3', 'Notify', '#7ed321'),
	method('m4', 'Archive', '#bd10e0'),
];
const edges = [
	edge('e1', 'start-1', 'm1'),
	edge('e2', 'm1', 'loop-1'),
	edge('e3', 'loop-1', 'm2', 'bottom', 'top'),
	edge('e4', 'loop-1', 'm3', 'right', 'left'),
	edge('e5', 'm3', 'm4'),
];

const binding = (enhanceId: string, resultVar: string, vars: string[],
	script = 'RESULT_VAR = VAR_0') => ({
	enhancement: {
		enhanceId, language: 'js', script,
		args: {
			RESULT_VAR: resultVar,
			...Object.fromEntries(vars.map((value, index) => [`VAR_${index}`, value])),
		},
	},
});

const build = (fieldBindings: unknown[]) => buildBindingGraph(nodes, edges, fieldBindings);

describe('buildBindingGraph', () => {
	it('describes a direct wire as one row with both ends resolved', () => {
		const graph = build([
			binding('en-1', '#f5a623.(request).body.$.userId', ['#3fa9f5.(response).body.$.id']),
		]);
		expect(graph.skipped).toEqual({ malformed: 0, outsideScope: 0, unanchored: 0 });
		expect(graph.bindings).toHaveLength(1);
		expect(graph.bindings[0]).toMatchObject({
			key: 'en-1:VAR_0',
			enhanceId: 'en-1',
			varKey: 'VAR_0',
			isScript: false,
			invalidReason: null,
			consumer: { nodeId: 'm2', label: 'CreateTicket', color: '#f5a623',
				direction: 'request', messageProperty: 'body', field: 'userId', path: 'body.$.userId' },
			provider: { nodeId: 'm1', label: 'GetUsers', color: '#3fa9f5',
				direction: 'response', messageProperty: 'body', field: 'id', path: 'body.$.id' },
		});
	});

	it('emits one row per reference and marks a real script', () => {
		const graph = build([
			binding('en-2', '#bd10e0.(request).body.$.summary', [
				'#3fa9f5.(response).body.$.id',
				'#7ed321.(response).body.$.status',
			], 'RESULT_VAR = VAR_0 + VAR_1'),
		]);
		expect(graph.bindings).toHaveLength(2);
		expect(graph.bindings.every((item) => item.isScript)).toBe(true);
		expect(graph.bindings.map((item) => item.varKey)).toEqual(['VAR_0', 'VAR_1']);
		expect(graph.bindings.map((item) => item.provider.nodeId)).toEqual(['m1', 'm3']);
		expect(new Set(graph.bindings.map((item) => item.enhanceId))).toEqual(new Set(['en-2']));
	});

	it('keeps a reference whose provider is out of scope, describing it as broken', () => {
		// m2 runs inside the loop, so nothing after the loop can read its response.
		const graph = build([
			binding('en-3', '#7ed321.(request).body.$.ticket', [
				'#3fa9f5.(response).body.$.id',
				'#f5a623.(response).body.$.ticketId',
			], 'RESULT_VAR = VAR_0 + VAR_1'),
		]);
		expect(graph.bindings).toHaveLength(2);
		expect(graph.bindings[0]).toMatchObject({ invalidReason: null,
			provider: { nodeId: 'm1' } });
		expect(graph.bindings[1]).toMatchObject({
			invalidReason: 'out-of-scope',
			provider: { nodeId: null, label: null, color: '#f5a623', path: 'body.$.ticketId' },
			// the method it meant, so the lens can still draw the broken edge
			unreadableProviderNodeId: 'm2',
		});
	});

	it('reads a provider from inside a loop for a consumer inside the same loop', () => {
		const innerNodes = [...nodes, method('m2b', 'AssignTicket', '#4a4a4a')];
		const innerEdges = [...edges, edge('e6', 'm2', 'm2b')];
		const graph = buildBindingGraph(innerNodes, innerEdges, [
			binding('en-4', '#4a4a4a.(request).body.$.id', ['#f5a623.(response).body.$.ticketId']),
		]);
		expect(graph.bindings[0]).toMatchObject({ invalidReason: null,
			provider: { nodeId: 'm2' }, consumer: { nodeId: 'm2b' } });
	});

	it('separates a missing method from an out-of-scope one', () => {
		const graph = build([
			binding('en-5', '#f5a623.(request).body.$.x', ['#000001.(response).body.$.y']),
		]);
		expect(graph.bindings[0]).toMatchObject({
			invalidReason: 'missing-method',
			provider: { nodeId: null, color: '#000001' },
			unreadableProviderNodeId: null,
		});
	});

	it('picks the last visible provider when a colour has several candidates', () => {
		const twinNodes = [
			startNode,
			method('t1', 'GetUsers', '#3fa9f5'),
			method('t2', 'GetUsersAgain', '#3fa9f5'),
			method('t3', 'CreateTicket', '#f5a623'),
		];
		const twinEdges = [
			edge('t-e1', 'start-1', 't1'),
			edge('t-e2', 't1', 't2'),
			edge('t-e3', 't2', 't3'),
		];
		const graph = buildBindingGraph(twinNodes, twinEdges, [
			binding('en-6', '#f5a623.(request).body.$.userId', ['#3fa9f5.(response).body.$.id']),
		]);
		expect(graph.bindings[0].provider.nodeId).toBe('t2');
	});

	it('covers a header target', () => {
		const graph = build([
			binding('en-7', '#f5a623.(request).header.$.Authorization',
				['#3fa9f5.(response).body.$.token']),
		]);
		expect(graph.bindings[0].consumer).toMatchObject({
			messageProperty: 'header', field: 'Authorization', path: 'header.$.Authorization',
		});
	});

	it('counts what it cannot draw instead of dropping it silently', () => {
		const graph = build([
			binding('en-8', '#f5a623.(request).endpoint.$.path', ['#3fa9f5.(response).body.$.id']),
			binding('en-9', '#abcdef.(request).body.$.x', ['#3fa9f5.(response).body.$.id']),
			binding('en-10', 'not-a-reference', ['#3fa9f5.(response).body.$.id']),
			binding('en-11', '#f5a623.(request).body.$.x', []),
			binding('en-12', '#f5a623.(request).body.$.y', ['not-a-reference']),
			{ enhancement: null },
		]);
		expect(graph.bindings).toHaveLength(0);
		expect(graph.skipped).toEqual({ malformed: 4, outsideScope: 1, unanchored: 1 });
	});

	it('returns an empty graph for a workflow without bindings', () => {
		expect(buildBindingGraph(nodes, edges, undefined)).toEqual({
			bindings: [], skipped: { malformed: 0, outsideScope: 0, unanchored: 0 },
		});
	});
});
