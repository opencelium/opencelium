import { describe, expect, it } from 'vitest';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { EMPTY_REMAP_PLAN, remapWorkflowReferences } from './graph.referenceRemap';
import { buildReferenceRemapTargets } from './graph.referenceRemapTargets';
import { cleanBrokenWorkflowReferences } from './graph.brokenReferenceCleanup';
import { deleteNodeGraph } from './deleteNodeGraph';

const OLD = '#7ed321';
const NEW = '#3fa9f5';
const remap = { colors: new Map([[OLD, NEW]]), references: new Map<string, string>() };

const config = (overrides: Record<string, unknown> = {}) => ({
	url: '', headers: {}, queryParams: [], endpointArgs: {},
	bodyFormat: 'json', bodyData: 'json', body: {}, ...overrides,
});

const method = (id: string, color: string, methodConfig?: Record<string, unknown>) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle: id, kind: 'connector', color,
		methodConfig: methodConfig ?? config() },
}) as unknown as WorkflowNodeModel;

const bodyOf = (nodes: WorkflowNodeModel[], id: string) =>
	(nodes.find((node) => node.id === id)?.data.methodConfig as { body: unknown })?.body;

describe('remapWorkflowReferenceColors', () => {
	it('re-points a reference at the replacement, path and direction intact', () => {
		const nodes = [method('m1', '#f5a623',
			config({ body: { userId: `${OLD}.(response).body.$.id` } }))];

		const result = remapWorkflowReferences(nodes, undefined, remap);

		expect(bodyOf(result.nodes, 'm1'))
			.toEqual({ userId: `${NEW}.(response).body.$.id` });
	});

	// The one mistake here that would be silent: a method's own colour is what
	// every reference names it by, and it is a bare hex with no (response) tail.
	it('never touches a method\'s own colour', () => {
		const nodes = [method('m1', OLD, config({ body: { a: `${OLD}.(response).body.$.id` } }))];

		const result = remapWorkflowReferences(nodes, undefined, remap);

		expect(result.nodes[0].data.color).toBe(OLD);
		expect(bodyOf(result.nodes, 'm1')).toEqual({ a: `${NEW}.(response).body.$.id` });
	});

	it('reaches references wherever a method config keeps them', () => {
		const nodes = [method('m1', '#f5a623', config({
			url: `#{%arg-1%}/users`,
			headers: { 'X-Id': `${OLD}.(response).body.$.id` },
			queryParams: [{ id: 'q1', key: 'id', value: `${OLD}.(response).body.$.id`, enabled: true }],
			endpointArgs: { 'arg-1': { id: 'arg-1', source: `${OLD}.(response).body.$.id` } },
			body: { nested: [{ deep: `${OLD}.(response).body.$.name` }] },
		}))];

		const config1 = remapWorkflowReferences(nodes, undefined, remap)
			.nodes[0].data.methodConfig as any;

		expect(config1.headers['X-Id']).toBe(`${NEW}.(response).body.$.id`);
		expect(config1.queryParams[0].value).toBe(`${NEW}.(response).body.$.id`);
		expect(config1.endpointArgs['arg-1'].source).toBe(`${NEW}.(response).body.$.id`);
		expect(config1.body.nested[0].deep).toBe(`${NEW}.(response).body.$.name`);
	});

	it('carries an enhancement over untouched apart from the input it reads', () => {
		const fieldBindings = [{
			enhancement: {
				enhanceId: 'en-1', language: 'js', script: 'return VAR_0 + 1;',
				args: { VAR_0: `${OLD}.(response).body.$.id`,
					RESULT_VAR: '#f5a623.(request).body.$.total' },
			},
			from: [{ color: OLD, path: 'body.$.id' }],
			to: [{ color: '#f5a623', path: 'body.$.total' }],
		}];

		const result = remapWorkflowReferences([], fieldBindings, remap);
		const binding = result.fieldBindings?.[0] as any;

		// The script addresses its input by arg name, so re-pointing the arg is
		// the whole change — the logic never learns the provider moved.
		expect(binding.enhancement.script).toBe('return VAR_0 + 1;');
		expect(binding.enhancement.args.VAR_0).toBe(`${NEW}.(response).body.$.id`);
		expect(binding.enhancement.args.RESULT_VAR).toBe('#f5a623.(request).body.$.total');
		expect(binding.from).toEqual([{ color: NEW, path: 'body.$.id' }]);
		expect(binding.to).toEqual([{ color: '#f5a623', path: 'body.$.total' }]);
	});

	it('leaves references to other methods alone', () => {
		const other = '#bd10e0';
		const nodes = [method('m1', '#f5a623',
			config({ body: { keep: `${other}.(response).body.$.id` } }))];

		expect(bodyOf(remapWorkflowReferences(nodes, undefined, remap).nodes, 'm1'))
			.toEqual({ keep: `${other}.(response).body.$.id` });
	});

	it('matches a stored colour whatever case it was written in', () => {
		const nodes = [method('m1', '#f5a623',
			config({ body: { a: '#7ED321.(response).body.$.id' } }))];

		expect(bodyOf(remapWorkflowReferences(nodes, undefined, remap).nodes, 'm1'))
			.toEqual({ a: `${NEW}.(response).body.$.id` });
	});

	// The undo stack records on a signature of this state: a rebuilt object graph
	// with identical content would read as an edit nobody made.
	it('hands back what it was given when there is nothing to remap', () => {
		const nodes = [method('m1', '#f5a623')];
		const fieldBindings = [{ enhancement: { args: {} } }];

		const result = remapWorkflowReferences(nodes, fieldBindings, EMPTY_REMAP_PLAN);

		expect(result.nodes).toBe(nodes);
		expect(result.fieldBindings).toBe(fieldBindings);
	});

	// The point of a path override: the replacement's response is shaped
	// differently, and keeping body.$.id would leave a reference that looks
	// valid and resolves to nothing.
	it('re-points a single reference at a different field of the new method', () => {
		const nodes = [method('m1', '#f5a623', config({ body: {
			userId: `${OLD}.(response).body.$.id`,
			userName: `${OLD}.(response).body.$.name`,
		} }))];
		const plan = {
			colors: new Map([[OLD, NEW]]),
			references: new Map([[`${OLD}.(response).body.$.id`, `${NEW}.(response).body.$.user.id`]]),
		};

		expect(bodyOf(remapWorkflowReferences(nodes, undefined, plan).nodes, 'm1')).toEqual({
			// Overridden field takes the new path...
			userId: `${NEW}.(response).body.$.user.id`,
			// ...and everything not asked about follows the method, path intact.
			userName: `${NEW}.(response).body.$.name`,
		});
	});

	it('re-points a reference inside an operator condition', () => {
		const operator = {
			id: 'if-1', type: 'if', position: { x: 0, y: 0 },
			data: { title: 'IF', kind: 'if', conditionConfig: { operatorType: 'if',
				expression: `{%${OLD}.(response).body.$.id%} = '1'`, tree: null } },
		} as unknown as WorkflowNodeModel;
		const plan = {
			colors: new Map([[OLD, NEW]]),
			references: new Map([[`${OLD}.(response).body.$.id`, `${NEW}.(response).body.$.user.id`]]),
		};

		const result = remapWorkflowReferences([operator], undefined, plan);

		expect((result.nodes[0].data.conditionConfig as { expression: string }).expression)
			.toBe(`{%${NEW}.(response).body.$.user.id%} = '1'`);
	});

	it('re-points one reference of a ;-separated list and leaves the rest as written', () => {
		const other = '#bd10e0';
		const nodes = [method('m1', '#f5a623', config({ body: {
			mixed: `${OLD}.(response).body.$.id; ${other}.(response).body.$.id`,
		} }))];
		const plan = {
			colors: new Map([[OLD, NEW]]),
			references: new Map<string, string>(),
		};

		expect(bodyOf(remapWorkflowReferences(nodes, undefined, plan).nodes, 'm1')).toEqual({
			mixed: `${NEW}.(response).body.$.id; ${other}.(response).body.$.id`,
		});
	});

	// The order the delete flow relies on: re-point first, and the pass that
	// clears what is left reads the remapped reference as satisfied.
	it('survives the cleanup that would otherwise have cleared it', () => {
		const startNode = {
			id: 'start-1', type: 'start', position: { x: 0, y: 0 },
			data: { title: 'Start', kind: 'start' },
		} as unknown as WorkflowNodeModel;
		const edge = (id: string, source: string, target: string) =>
			({ id, type: 'workflow-edge', source, target }) as any;
		// start → m1 → m2 → m3, m3 reading m2; m2 is deleted and m1 takes over.
		const nodes = [startNode, method('m1', NEW), method('m2', OLD),
			method('m3', '#f5a623', config({ body: { userId: `${OLD}.(response).body.$.id` } }))];
		const edges = [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'm2'), edge('e3', 'm2', 'm3')];

		const after = deleteNodeGraph('m2', nodes, edges);
		const [target] = buildReferenceRemapTargets({ nodes, edges }, after, undefined);
		expect(target.candidates.map((candidate) => candidate.color)).toEqual([NEW]);

		const remapped = remapWorkflowReferences(after.nodes, undefined,
			{ colors: new Map([[target.color, NEW]]), references: new Map<string, string>() });
		const cleanup = cleanBrokenWorkflowReferences(remapped.nodes, after.edges, undefined,
			{ nodes, edges });

		expect(cleanup.brokenCount).toBe(0);
		expect(bodyOf(cleanup.nodes, 'm3')).toEqual({ userId: `${NEW}.(response).body.$.id` });
	});
});