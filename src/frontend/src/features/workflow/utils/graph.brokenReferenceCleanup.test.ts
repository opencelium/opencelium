import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { NOT_EXIST_ARG } from './enhancementArgs';
import { cleanBrokenWorkflowReferences } from './graph.brokenReferenceCleanup';
import { deleteNodeGraph } from './deleteNodeGraph';

const config = (overrides: Record<string, unknown> = {}) => ({
	url: '', headers: {}, queryParams: [], endpointArgs: {},
	bodyFormat: 'json', bodyData: 'json', body: {}, ...overrides,
});

const method = (id: string, color: string, body?: unknown,
	type = 'connector', methodConfig?: Record<string, unknown>) => ({
	id, type, position: { x: 0, y: 0 },
	data: {
		title: 'Method', subtitle: id, kind: type, color,
		methodConfig: methodConfig ?? config({ body: body ?? {} }),
	},
}) as unknown as WorkflowNodeModel;

const rule = (id: string, leftField: string) =>
	({ id, type: 'rule' as const, properties: { leftField, operator: '=' as const, rightField: '1' } });

const operator = (id: string, operatorType: 'if' | 'loop', items: unknown[]) => ({
	id, type: operatorType, position: { x: 0, y: 0 },
	data: {
		title: operatorType.toUpperCase(), kind: operatorType,
		conditionConfig: { operatorType, expression: '', iterator: 'item',
			tree: { id: 'root', type: 'group', properties: { conjunction: 'and' }, items } },
	},
}) as unknown as WorkflowNodeModel;

const startNode = {
	id: 'start-1', type: 'start', position: { x: 0, y: 0 },
	data: { title: 'Start', kind: 'start' },
} as unknown as WorkflowNodeModel;

const edge = (id: string, source: string, target: string) =>
	({ id, type: 'workflow-edge', source, target }) as unknown as WorkflowEdgeModel;

/** The colour of a method that has just been deleted: nothing on the graph
 *  carries it any more, so every reference naming it is unsatisfiable. */
const DELETED = '#7ed321';

// start → m1 (provider, still there) → m2 (consumer)
const graph = (body?: unknown) => ({
	nodes: [startNode, method('m1', '#3fa9f5'), method('m2', '#f5a623', body)],
	edges: [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'm2')],
});

const binding = (script: string, args: Record<string, string>) =>
	({ enhancement: { enhanceId: 'en-1', language: 'js', script, args } });

const RESULT_VAR = '#f5a623.(request).body.$.total';

const enhancementOf = (fieldBindings: unknown[] | undefined) =>
	(fieldBindings?.[0] as { enhancement: { script: string; args: Record<string, string> } })
		?.enhancement;

describe('cleanBrokenWorkflowReferences', () => {
	it('clears a plain reference to a method that is gone from the field value', () => {
		const { nodes, edges } = graph({
			userId: `${DELETED}.(response).body.$.id`,
			kept: '#3fa9f5.(response).body.$.id',
			plain: 'text',
		});
		const result = cleanBrokenWorkflowReferences(nodes, edges, []);
		expect(result.brokenCount).toBe(1);
		expect(result.nodes[2].data.methodConfig?.body).toEqual({
			userId: '', kept: '#3fa9f5.(response).body.$.id', plain: 'text',
		});
	});

	it('drops the dead argument and marks the script that used it', () => {
		const { nodes, edges } = graph();
		const result = cleanBrokenWorkflowReferences(nodes, edges, [
			binding('RESULT_VAR = VAR_0 + VAR_1', {
				RESULT_VAR,
				VAR_0: '#3fa9f5.(response).body.$.net',
				VAR_1: `${DELETED}.(response).body.$.tax`,
			}),
		]);
		expect(result.brokenCount).toBe(1);
		const enhancement = enhancementOf(result.fieldBindings);
		expect(enhancement.script).toBe(`RESULT_VAR = VAR_0 + ${NOT_EXIST_ARG}`);
		expect(Object.keys(enhancement.args)).toEqual(['RESULT_VAR', 'VAR_0']);
	});

	it('keeps an authored script whose every input died, so the loss is visible', () => {
		const { nodes, edges } = graph();
		const result = cleanBrokenWorkflowReferences(nodes, edges, [
			binding('RESULT_VAR = VAR_0.toUpperCase()', {
				RESULT_VAR, VAR_0: `${DELETED}.(response).body.$.name`,
			}),
		]);
		expect(result.fieldBindings).toHaveLength(1);
		expect(enhancementOf(result.fieldBindings).script)
			.toBe(`RESULT_VAR = ${NOT_EXIST_ARG}.toUpperCase()`);
	});

	it('drops a passthrough enhancement instead, since its reference was all it was', () => {
		const { nodes, edges } = graph();
		const result = cleanBrokenWorkflowReferences(nodes, edges, [
			binding('RESULT_VAR = VAR_0', {
				RESULT_VAR, VAR_0: `${DELETED}.(response).body.$.id`,
			}),
		]);
		expect(result.fieldBindings).toEqual([]);
	});

	it('leaves a graph whose references all still resolve untouched', () => {
		const { nodes, edges } = graph({ userId: '#3fa9f5.(response).body.$.id' });
		const result = cleanBrokenWorkflowReferences(nodes, edges, [
			binding('RESULT_VAR = VAR_0', { RESULT_VAR, VAR_0: '#3fa9f5.(response).body.$.id' }),
		]);
		expect(result.brokenCount).toBe(0);
		expect(result.nodes).toBe(nodes);
	});
});

describe('cleanBrokenWorkflowReferences — every place a method can be referenced', () => {
	it('clears an endpoint reference, its argument and its token in the url', () => {
		const nodes = [startNode, method('m1', '#3fa9f5'),
			method('m2', '#f5a623', undefined, 'connector', config({
				url: 'https://api.test/users/#{% dead %}/tags/#{% kept %}',
				endpointArgs: {
					dead: { id: 'dead', source: `${DELETED}.(response).body.$.id` },
					kept: { id: 'kept', source: '#3fa9f5.(response).body.$.id' },
				},
			}))];
		const edges = [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'm2')];
		const result = cleanBrokenWorkflowReferences(nodes, edges, []);
		expect(result.brokenCount).toBe(1);
		const cleaned = result.nodes[2].data.methodConfig as unknown as {
			url: string; endpointArgs: Record<string, unknown>;
		};
		expect(Object.keys(cleaned.endpointArgs)).toEqual(['kept']);
		expect(cleaned.url).toBe('https://api.test/users//tags/#{% kept %}');
	});

	it('clears a reference in a query parameter value', () => {
		const nodes = [startNode, method('m1', '#3fa9f5'),
			method('m2', '#f5a623', undefined, 'connector', config({
				queryParams: [{ id: 'q1', key: 'since', enabled: true,
					value: `${DELETED}.(response).body.$.date` }],
			}))];
		const edges = [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'm2')];
		const result = cleanBrokenWorkflowReferences(nodes, edges, []);
		expect(result.brokenCount).toBe(1);
		const cleaned = result.nodes[2].data.methodConfig as unknown as {
			queryParams: { value: string }[];
		};
		expect(cleaned.queryParams[0].value).toBe('');
	});

	it("drops an IF's rule that compared against a method that is gone", () => {
		const nodes = [startNode, method('m1', '#3fa9f5'),
			operator('if-1', 'if', [
				rule('r1', `${DELETED}.(response).body.$.status`),
				rule('r2', '#3fa9f5.(response).body.$.status'),
			])];
		const edges = [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'if-1')];
		const result = cleanBrokenWorkflowReferences(nodes, edges, []);
		expect(result.brokenCount).toBe(1);
		const tree = result.nodes[2].data.conditionConfig?.tree;
		expect(tree?.items?.map((item) => item.id)).toEqual(['r2']);
	});

	it("keeps a loop's tree non-empty when its only rule referenced that method", () => {
		const nodes = [startNode, method('m1', '#3fa9f5'),
			operator('loop-1', 'loop', [rule('r1', `${DELETED}.(response).body.$.items`)])];
		const edges = [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'loop-1')];
		const result = cleanBrokenWorkflowReferences(nodes, edges, []);
		expect(result.brokenCount).toBe(1);
		// A loop with no rule at all cannot be edited back into shape, so the
		// cleanup re-seeds an empty one (see removeConditionReferenceColors).
		const items = result.nodes[2].data.conditionConfig?.tree?.items ?? [];
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({ type: 'rule' });
		expect((items[0] as { properties?: { leftField?: string } }).properties?.leftField)
			.toBeUndefined();
	});

	it('validates a webhook step like any other method', () => {
		const nodes = [startNode, method('m1', '#3fa9f5'),
			method('w1', '#f5a623', { id: `${DELETED}.(response).body.$.id` },
				'trigger-connection')];
		const edges = [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'w1')];
		const result = cleanBrokenWorkflowReferences(nodes, edges, []);
		expect(result.brokenCount).toBe(1);
		expect(result.nodes[2].data.methodConfig?.body).toEqual({ id: '' });
	});
});

describe('cleanBrokenWorkflowReferences — deleting an operator with steps inside it', () => {
	// start → m1 → LOOP ─bottom→ inner1 → inner2
	//                └─right→ m4        (m4 reads both nested methods)
	const nestedGraph = () => ({
		nodes: [
			startNode,
			method('m1', '#3fa9f5'),
			operator('loop-1', 'loop', [rule('r1', '#3fa9f5.(response).body.$.items')]),
			method('inner1', '#7ed321'),
			method('inner2', '#bd10e0'),
			method('m4', '#f5a623', {
				fromInner1: '#7ed321.(response).body.$.id',
				fromOutside: '#3fa9f5.(response).body.$.id',
			}),
		],
		edges: [
			edge('e1', 'start-1', 'm1'),
			edge('e2', 'm1', 'loop-1'),
			{ ...edge('e3', 'loop-1', 'inner1'), sourceHandle: 'bottom', targetHandle: 'top' },
			edge('e4', 'inner1', 'inner2'),
			{ ...edge('e5', 'loop-1', 'm4'), sourceHandle: 'right', targetHandle: 'left' },
		] as WorkflowEdgeModel[],
	});

	it('clears references to every step inside the operator, not just the operator', () => {
		const { nodes, edges } = nestedGraph();
		const bindings = [binding('RESULT_VAR = VAR_0.trim()', {
			RESULT_VAR: '#f5a623.(request).body.$.label',
			// inner2, which is nested one level deeper than the operator's own child
			VAR_0: '#bd10e0.(response).body.$.name',
		})];
		const after = deleteNodeGraph('loop-1', nodes, edges);
		expect(after.nodes.map((node) => node.id).sort())
			.toEqual(['m1', 'm4', 'start-1']);

		const result = cleanBrokenWorkflowReferences(after.nodes, after.edges, bindings);
		// One consumer (m4), two dead providers (inner1 by value, inner2 by script).
		expect(result.brokenCount).toBe(2);
		expect(result.affectedNodeIds).toEqual(['m4']);
		const survivor = result.nodes.find((node) => node.id === 'm4');
		expect(survivor?.data.methodConfig?.body).toEqual({
			fromInner1: '',
			// The reference to a method outside the operator is untouched.
			fromOutside: '#3fa9f5.(response).body.$.id',
		});
		expect(enhancementOf(result.fieldBindings).script)
			.toBe(`RESULT_VAR = ${NOT_EXIST_ARG}.trim()`);
	});

	it('leaves nothing behind when the operator held the only consumer', () => {
		const { nodes, edges } = nestedGraph();
		// inner2 reads inner1 and both go with the operator, while the surviving m4
		// only reads a method outside it — so there is nothing to fix.
		const withInnerReference = nodes.map((node) => {
			if (node.id === 'inner2') {
				return method('inner2', '#bd10e0', { id: '#7ed321.(response).body.$.id' });
			}
			return node.id === 'm4'
				? method('m4', '#f5a623', { fromOutside: '#3fa9f5.(response).body.$.id' })
				: node;
		});
		const after = deleteNodeGraph('loop-1', withInnerReference, edges);
		const result = cleanBrokenWorkflowReferences(after.nodes, after.edges, []);
		expect(result.brokenCount).toBe(0);
		expect(result.affectedNodeIds).toEqual([]);
	});
});

describe('cleanBrokenWorkflowReferences — a reference that only a joint made readable', () => {
	// start → m1 → LOOP ─bottom→ inner        (inner runs inside the loop)
	//                    └─right→ after       (after cannot read inner's response…)
	// …unless a joint from inner to after widens what `after` can see.
	const jointGraph = (withJoint: boolean) => ({
		nodes: [
			startNode,
			method('m1', '#3fa9f5'),
			operator('loop-1', 'loop', [rule('r1', '#3fa9f5.(response).body.$.items')]),
			{
				...method('inner', '#7ed321'),
				data: { ...method('inner', '#7ed321').data, jump: withJoint ? 'after' : undefined },
			} as WorkflowNodeModel,
			method('after', '#f5a623', { ticket: '#7ed321.(response).body.$.id' }),
		],
		edges: [
			edge('e1', 'start-1', 'm1'),
			edge('e2', 'm1', 'loop-1'),
			{ ...edge('e3', 'loop-1', 'inner'), sourceHandle: 'bottom', targetHandle: 'top' },
			{ ...edge('e4', 'loop-1', 'after'), sourceHandle: 'right', targetHandle: 'left' },
		] as WorkflowEdgeModel[],
	});

	it('leaves the reference alone while the joint is there', () => {
		const { nodes, edges } = jointGraph(true);
		const result = cleanBrokenWorkflowReferences(nodes, edges, []);
		expect(result.brokenCount).toBe(0);
		expect(result.nodes).toBe(nodes);
	});

	it('clears it once the joint is gone, since nothing can read it any more', () => {
		const { nodes, edges } = jointGraph(false);
		const result = cleanBrokenWorkflowReferences(nodes, edges, [
			binding('RESULT_VAR = VAR_0', {
				RESULT_VAR: '#f5a623.(request).body.$.id',
				VAR_0: '#7ed321.(response).body.$.id',
			}),
		]);
		expect(result.brokenCount).toBe(1);
		expect(result.affectedNodeIds).toEqual(['after']);
		// The provider method is still on the canvas — it is only unreadable from
		// here — so this is the out-of-scope break, cleared the same way.
		expect(result.nodes.find((node) => node.id === 'inner')).toBeTruthy();
		expect(result.nodes.find((node) => node.id === 'after')?.data.methodConfig?.body)
			.toEqual({ ticket: '' });
		expect(result.fieldBindings).toEqual([]);
	});
});
