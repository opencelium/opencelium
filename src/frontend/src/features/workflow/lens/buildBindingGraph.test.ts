import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { LensBinding } from './bindingLens.types';
import { NOT_EXIST_ARG } from '../utils/enhancementArgs';
import { buildBindingGraph } from './buildBindingGraph';

const enhancementOf = (binding: LensBinding) =>
	binding.source.kind === 'enhancement' ? binding.source : null;

const method = (id: string, name: string, color: string, methodConfig?: unknown) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle: name, kind: 'connector', color, methodConfig },
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

/** The same graph, with m2 filling a body field straight from m1's response —
 *  a plain direct reference, which never reaches `fieldBindings`. */
const withValueReference = (value: unknown, id = 'm2') => nodes.map((node) => node.id === id
	? method(id, node.data.subtitle as string, node.data.color as string,
		{ url: '', headers: {}, queryParams: [], endpointArgs: {},
			bodyFormat: 'json', bodyData: 'json', body: value })
	: node);

describe('buildBindingGraph', () => {
	it('describes a direct wire as one row with both ends resolved', () => {
		const graph = build([
			binding('en-1', '#f5a623.(request).body.$.userId', ['#3fa9f5.(response).body.$.id']),
		]);
		expect(graph.skipped).toEqual({ malformed: 0, outsideScope: 0, unanchored: 0 });
		expect(graph.bindings).toHaveLength(1);
		expect(graph.bindings[0]).toMatchObject({
			key: 'en-1:VAR_0',
			source: { kind: 'enhancement', enhanceId: 'en-1', varKey: 'VAR_0' },
			isScript: false,
			invalidReason: null,
			consumer: { nodeId: 'm2', label: 'CreateTicket', color: '#f5a623',
				direction: 'request', messageProperty: 'body', field: 'userId', path: 'body.$.userId' },
			provider: { nodeId: 'm1', label: 'GetUsers', color: '#3fa9f5',
				direction: 'response', messageProperty: 'body', field: 'id', path: 'body.$.id' },
		});
	});

	it('describes a reference living in a field value, which no field binding mentions', () => {
		const graph = buildBindingGraph(
			withValueReference({ userId: '#3fa9f5.(response).body.$.id' }), edges, []);
		expect(graph.bindings).toHaveLength(1);
		expect(graph.bindings[0]).toMatchObject({
			source: { kind: 'value' },
			isScript: false,
			invalidReason: null,
			consumer: { nodeId: 'm2', label: 'CreateTicket', direction: 'request',
				messageProperty: 'body', field: 'userId', path: 'body.$.userId' },
			provider: { nodeId: 'm1', label: 'GetUsers', path: 'body.$.id' },
		});
	});

	it('describes a field value reference once, not twice, when it also has an enhancement', () => {
		// Creating an enhancement leaves the reference in the field value, so both
		// halves of the derivation see the same binding.
		const graph = buildBindingGraph(
			withValueReference({ userId: '#3fa9f5.(response).body.$.id' }), edges,
			[binding('en-1', '#f5a623.(request).body.$.userId',
				['#3fa9f5.(response).body.$.id'])]);
		expect(graph.bindings).toHaveLength(1);
		expect(graph.bindings[0].source).toMatchObject({ kind: 'enhancement' });
	});

	it('breaks a field value reference on the same rules as an enhancement one', () => {
		// m2 runs inside the loop, so m4 (after it) cannot read m2's response.
		const graph = buildBindingGraph(
			withValueReference({ ticket: '#f5a623.(response).body.$.id' }, 'm4'), edges, []);
		expect(graph.bindings).toHaveLength(1);
		expect(graph.bindings[0]).toMatchObject({
			source: { kind: 'value' },
			invalidReason: 'out-of-scope',
			unreadableProviderNodeId: 'm2',
		});
	});

	it('counts a url reference as out of scope rather than describing it', () => {
		const graph = buildBindingGraph(nodes.map((node) => node.id === 'm2'
			? method('m2', 'CreateTicket', '#f5a623', { url: '/x/{id}', headers: {},
				queryParams: [], endpointArgs: { id: { id: 'id',
					source: '#3fa9f5.(response).body.$.id' } },
				bodyFormat: 'json', bodyData: 'json', body: {} })
			: node), edges, []);
		expect(graph.bindings).toEqual([]);
		expect(graph.skipped.outsideScope).toBe(1);
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
		expect(graph.bindings.map((item) => enhancementOf(item)?.varKey))
			.toEqual(['VAR_0', 'VAR_1']);
		expect(graph.bindings.map((item) => item.provider.nodeId)).toEqual(['m1', 'm3']);
		expect(new Set(graph.bindings.map((item) => enhancementOf(item)?.enhanceId)))
			.toEqual(new Set(['en-2']));
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

describe('buildBindingGraph — a script naming an input it no longer receives', () => {
	it('marks every reference of that enhancement broken, provider or not', () => {
		const graph = build([
			binding('en-1', '#f5a623.(request).body.$.total',
				['#3fa9f5.(response).body.$.net'], `RESULT_VAR = VAR_0 + ${NOT_EXIST_ARG}`),
		]);
		expect(graph.bindings).toHaveLength(1);
		expect(graph.bindings[0]).toMatchObject({
			invalidReason: 'missing-variable',
			isScript: true,
			// The reference it does still have resolves — it is the script that cannot run.
			provider: { nodeId: 'm1' },
		});
	});

	it('keeps a provider-side break as the more specific reason', () => {
		const graph = build([
			binding('en-2', '#7ed321.(request).body.$.ticket',
				['#f5a623.(response).body.$.id'], `RESULT_VAR = VAR_0 + ${NOT_EXIST_ARG}`),
		]);
		// m2 runs inside the loop, so m3 cannot read it whatever the script says.
		expect(graph.bindings[0].invalidReason).toBe('out-of-scope');
	});

	it('describes a script whose every input is gone, which nothing else showed', () => {
		const graph = build([
			binding('en-3', '#f5a623.(request).body.$.name', [],
				`RESULT_VAR = ${NOT_EXIST_ARG}.toUpperCase()`),
		]);
		expect(graph.skipped.malformed).toBe(0);
		expect(graph.bindings).toHaveLength(1);
		expect(graph.bindings[0]).toMatchObject({
			key: 'en-3:script',
			source: { kind: 'enhancement', enhanceId: 'en-3', varKey: null },
			invalidReason: 'missing-variable',
			consumer: { nodeId: 'm2', path: 'body.$.name' },
			// Nothing to anchor an arc on; the marker itself is what the row shows.
			provider: { nodeId: null, label: null, path: NOT_EXIST_ARG },
		});
	});

	it('still counts an argless enhancement with a clean script as malformed', () => {
		const graph = build([
			binding('en-4', '#f5a623.(request).body.$.name', [], 'RESULT_VAR = 1'),
		]);
		expect(graph.bindings).toEqual([]);
		expect(graph.skipped.malformed).toBe(1);
	});
});
