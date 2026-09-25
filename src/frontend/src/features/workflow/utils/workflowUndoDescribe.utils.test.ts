import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { describeWorkflowUndoChange } from './workflowUndoDescribe.utils';
import { undoChangeLabel } from './workflowUndoLabel.utils';

const node = (id: string, subtitle: string, extra: Record<string, unknown> = {}) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle, kind: 'connector', ...extra },
}) as unknown as WorkflowNodeModel;

const edge = (id: string, source: string, target: string) =>
	({ id, type: 'workflow-edge', source, target }) as unknown as WorkflowEdgeModel;

const base = {
	nodes: [node('start-1', 'Start'), node('m1', 'GetAllUser')],
	edges: [edge('e1', 'start-1', 'm1')],
	fieldBindings: undefined as unknown[] | undefined,
};

const withNodes = (nodes: WorkflowNodeModel[], edges = base.edges) =>
	({ ...base, nodes, edges });

describe('describeWorkflowUndoChange', () => {
	it('names a single added node, ignoring the edge that came with it', () => {
		const next = withNodes([...base.nodes, node('m2', 'AddUser')],
			[...base.edges, edge('e2', 'm1', 'm2')]);
		expect(describeWorkflowUndoChange(base, next))
			.toMatchObject({ kind: 'nodes-added', count: 1, name: 'AddUser' });
	});

	it('counts a multi-node addition without naming one', () => {
		const next = withNodes([...base.nodes, node('m2', 'AddUser'), node('m3', 'Notify')]);
		const change = describeWorkflowUndoChange(base, next);
		expect(change).toMatchObject({ kind: 'nodes-added', count: 2 });
		expect(change).not.toHaveProperty('name');
	});

	it('names a deletion and is not confused by the pruned references', () => {
		const next = { ...withNodes([base.nodes[0]], []), fieldBindings: [] };
		expect(describeWorkflowUndoChange(base, next))
			.toMatchObject({ kind: 'nodes-removed', count: 1, name: 'GetAllUser' });
	});

	it('reports a move, absorbing the edge rewiring of a re-parent', () => {
		const moved = base.nodes.map((item) => item.id !== 'm1' ? item
			: { ...item, position: { x: 320, y: 80 } } as WorkflowNodeModel);
		const next = withNodes(moved, [edge('e9', 'start-1', 'm1')]);
		expect(describeWorkflowUndoChange(base, next))
			.toMatchObject({ kind: 'nodes-moved', count: 1, name: 'GetAllUser' });
	});

	// Aggregator edits carry an operation and are covered on their own below.
	it('distinguishes each per-node config edit', () => {
		const cases = [
			// A request edit is refined further by describeMethodConfigChange — the
			// generic 'method-config' only survives when nothing narrower fits.
			['method-url', { methodConfig: { url: '/user' } }],
			['method-header', { methodConfig: { headers: { 'X-Tenant': 'acme' } } }],
			['method-body', { methodConfig: { body: { name: 'literal' } } }],
			['condition-config', { conditionConfig: { rules: [] } }],
			['connector-config', { connector: { connectorId: 7, title: 'i-doit' } }],
		] as const;
		for (const [kind, patch] of cases) {
			const next = withNodes(base.nodes.map((item) => item.id !== 'm1' ? item
				: node('m1', 'GetAllUser', patch)));
			expect(describeWorkflowUndoChange(base, next))
				.toMatchObject({ kind, name: 'GetAllUser' });
		}
	});

	it('reports a relabel with the new label', () => {
		const next = withNodes(base.nodes.map((item) => item.id !== 'm1' ? item
			: node('m1', 'FetchUsers', { labelEdited: true })));
		expect(describeWorkflowUndoChange(base, next))
			.toMatchObject({ kind: 'node-renamed', label: 'FetchUsers' });
	});

	it('names the aggregator subject by method name or operator kind', () => {
		const withAggregator = withNodes(base.nodes.map((item) => item.id !== 'm1' ? item
			: node('m1', 'GetAllUser', { dataAggregator: 3 })));
		expect(describeWorkflowUndoChange(base, withAggregator))
			.toMatchObject({ kind: 'aggregator-config', operation: 'configured', name: 'GetAllUser' });

		// Clearing it is a distinct action; null and undefined both mean cleared.
		expect(describeWorkflowUndoChange(withAggregator, withNodes(base.nodes.map(
			(item) => item.id !== 'm1' ? item : node('m1', 'GetAllUser', { dataAggregator: null }),
		)))).toMatchObject({ kind: 'aggregator-config', operation: 'removed', name: 'GetAllUser' });
		expect(describeWorkflowUndoChange(withAggregator, base))
			.toMatchObject({ kind: 'aggregator-config', operation: 'removed', name: 'GetAllUser' });

		const operator = (dataAggregator?: number) => ({ id: 'if1', type: 'if',
			position: { x: 0, y: 0 },
			data: { title: 'If', kind: 'if', ...(dataAggregator ? { dataAggregator } : {}) },
		}) as unknown as WorkflowNodeModel;
		expect(describeWorkflowUndoChange(
			withNodes([...base.nodes, operator()]),
			withNodes([...base.nodes, operator(2)]),
		)).toMatchObject({ kind: 'aggregator-config', operation: 'configured',
			nameKey: 'undoHistory.nodeKind.if' });
	});

	it('falls back to "multiple" when unrelated categories changed at once', () => {
		const next = withNodes(base.nodes.map((item) => item.id !== 'm1' ? item
			: { ...node('m1', 'GetAllUser', { methodConfig: { url: '/user' } }),
				position: { x: 400, y: 0 } } as WorkflowNodeModel));
		expect(describeWorkflowUndoChange(base, next)).toMatchObject({ kind: 'multiple' });
	});

	it('routes a reference edit and an enhancement edit through to their labels', () => {
		const withReference = withNodes(base.nodes.map((item) => item.id !== 'm1' ? item
			: node('m1', 'GetAllUser', {
				methodConfig: { body: { id: '{%#C77E7E.(response).body.$.id%}' } },
			})));
		expect(describeWorkflowUndoChange(base, withReference)).toMatchObject({
			kind: 'method-reference', section: 'body', operation: 'added', name: 'GetAllUser',
		});

		const coloured = base.nodes.map((item) => item.id !== 'm1' ? item
			: node('m1', 'GetAllUser', { color: '#C77E7E' }));
		const bindingsChanged = {
			...withNodes(coloured),
			fieldBindings: [{ enhancement: { enhanceId: 'e1', script: 'RESULT_VAR = VAR_0.trim()',
				args: { RESULT_VAR: '#C77E7E.(request).header.$.Authorization' } } }],
		};
		expect(describeWorkflowUndoChange({ ...base, nodes: coloured }, bindingsChanged)).toMatchObject({
			kind: 'method-enhancement', section: 'header', aspect: 'script', name: 'GetAllUser',
		});
	});

	it('names the section when a body write and an enhancement edit land together', () => {
		// What the request dialog actually does on close: one entry in which the
		// node's methodConfig and the connection's fieldBindings both changed.
		const coloured = base.nodes.map((item) => item.id !== 'm1' ? item
			: node('m1', 'GetAllUser', {
				color: '#C77E7E',
				methodConfig: { url: '/user', method: 'GET', body: { name: 'before' } },
			}));
		const enhanced = base.nodes.map((item) => item.id !== 'm1' ? item
			: node('m1', 'GetAllUser', {
				color: '#C77E7E',
				methodConfig: { url: '/user', method: 'GET', body: { name: 'after' } },
			}));
		const bindingOf = (script: string) => [{ enhancement: { enhanceId: 'e1', script,
			args: { RESULT_VAR: '#C77E7E.(request).body.$.name', VAR_0: '#6477AB.(response).body.$.id' } } }];

		expect(describeWorkflowUndoChange(
			{ ...withNodes(coloured), fieldBindings: bindingOf('RESULT_VAR = VAR_0') },
			{ ...withNodes(enhanced), fieldBindings: bindingOf('RESULT_VAR = VAR_0.toUpperCase()') },
		)).toMatchObject({ kind: 'method-body', name: 'GetAllUser' });
	});

	it('does not claim an enhancement edit when the changed binding belongs to another method', () => {
		const coloured = base.nodes.map((item) => item.id !== 'm1' ? item
			: node('m1', 'GetAllUser', {
				color: '#C77E7E', methodConfig: { url: '/user', body: { name: 'before' } },
			}));
		const edited = base.nodes.map((item) => item.id !== 'm1' ? item
			: node('m1', 'GetAllUser', {
				color: '#C77E7E', methodConfig: { url: '/user', body: { name: 'after' } },
			}));
		const otherMethodBinding = (script: string) => [{ enhancement: { enhanceId: 'e9', script,
			args: { RESULT_VAR: '#6477AB.(request).body.$.other' } } }];

		expect(describeWorkflowUndoChange(
			{ ...withNodes(coloured), fieldBindings: otherMethodBinding('a') },
			{ ...withNodes(edited), fieldBindings: otherMethodBinding('b') },
		)).toMatchObject({ kind: 'method-body', name: 'GetAllUser' });
	});

	it('names an added node by its kind when its own subtitle is unhelpful', () => {
		const httpRequest = { id: 's1', type: 'system', position: { x: 0, y: 0 },
			data: { title: 'HTTP Request', subtitle: 'GET', kind: 'system' } } as unknown as WorkflowNodeModel;
		expect(describeWorkflowUndoChange(base, withNodes([...base.nodes, httpRequest])))
			.toMatchObject({ kind: 'nodes-added', count: 1, nameKey: 'undoHistory.nodeKind.httpRequest' });

		const webhook = { id: 't1', type: 'trigger-connection', position: { x: 0, y: 0 },
			data: { title: 'Some Workflow', subtitle: 'Some schedule', kind: 'trigger-connection' } } as unknown as WorkflowNodeModel;
		expect(describeWorkflowUndoChange(base, withNodes([...base.nodes, webhook])))
			.toMatchObject({ kind: 'nodes-added', count: 1, nameKey: 'undoHistory.nodeKind.webhook' });

		// A connector method keeps its own name — that is the useful thing there.
		expect(describeWorkflowUndoChange(base, withNodes([...base.nodes, node('m2', 'AddUser')])))
			.toMatchObject({ kind: 'nodes-added', count: 1, name: 'AddUser' });
	});

	it('tags each entry with the glyph of the node it concerns', () => {
		const withIconNode = (id: string, type: string, data: Record<string, unknown>) =>
			({ id, type, position: { x: 0, y: 0 }, data: { title: id, kind: type, ...data } }) as unknown as WorkflowNodeModel;

		// A connector method carries its own logo; the rest are identified by kind.
		expect(describeWorkflowUndoChange(base, withNodes([...base.nodes,
			withIconNode('m9', 'connector', { subtitle: 'AddUser', connector: { icon: 'logo.png' } })])).icon)
			.toMatchObject({ kind: 'connector', iconUrl: 'logo.png' });
		expect(describeWorkflowUndoChange(base, withNodes([...base.nodes,
			withIconNode('m9', 'connector', { subtitle: 'AddUser' })])).icon)
			.toMatchObject({ kind: 'connector', iconUrl: null });
		expect(describeWorkflowUndoChange(base, withNodes([...base.nodes,
			withIconNode('s9', 'system', { subtitle: 'GET' })])).icon)
			.toMatchObject({ kind: 'http-request' });
		expect(describeWorkflowUndoChange(base, withNodes([...base.nodes,
			withIconNode('t9', 'trigger-connection', {})])).icon)
			.toMatchObject({ kind: 'webhook' });
		expect(describeWorkflowUndoChange(base, withNodes([...base.nodes,
			withIconNode('if9', 'if', {})])).icon).toMatchObject({ kind: 'if' });
		expect(describeWorkflowUndoChange(base, withNodes([...base.nodes,
			withIconNode('lp9', 'loop', {})])).icon).toMatchObject({ kind: 'loop' });
	});

	it('tags a config edit with the icon of the node it happened on', () => {
		const edited = withNodes(base.nodes.map((item) => item.id !== 'm1' ? item
			: node('m1', 'GetAllUser', { methodConfig: { url: '/user/1' } })));
		expect(describeWorkflowUndoChange(base, edited).icon)
			.toMatchObject({ kind: 'connector', iconUrl: null });
	});

	it('routes an operator condition edit to the rule or group it happened to', () => {
		const operatorNode = (items: unknown[]) => ({
			id: 'if1', type: 'if', position: { x: 0, y: 0 },
			data: { title: 'If', kind: 'if', conditionConfig: { operatorType: 'if', expression: '',
				tree: { id: 'root', type: 'group', properties: { conjunction: '&&' }, items } } },
		}) as unknown as WorkflowNodeModel;
		const withOperator = (items: unknown[]) =>
			withNodes([...base.nodes, operatorNode(items)]);
		const aRule = { id: 'r1', type: 'rule', properties: { leftField: 'a' } };

		expect(describeWorkflowUndoChange(withOperator([]), withOperator([aRule])))
			.toMatchObject({ kind: 'condition-rule', operator: 'if', operation: 'added' });
		expect(describeWorkflowUndoChange(withOperator([]),
			withOperator([{ id: 'g1', type: 'group', properties: { conjunction: '&&' }, items: [] }])))
			.toMatchObject({ kind: 'condition-group', operator: 'if', operation: 'added' });
	});

	it('surfaces edge-only and reference-only edits', () => {
		expect(describeWorkflowUndoChange(base, withNodes(base.nodes, [])))
			.toMatchObject({ kind: 'edges-changed' });
		expect(describeWorkflowUndoChange(base, { ...base, fieldBindings: [{ id: 'b1' }] }))
			.toMatchObject({ kind: 'references' });
	});
});

describe('undoChangeLabel', () => {
	it('picks the named key when a name is known and the counted key otherwise', () => {
		expect(undoChangeLabel({ kind: 'nodes-added', count: 1, name: 'AddUser' }))
			.toEqual({ key: 'undoHistory.change.nodeAdded', values: { name: 'AddUser' } });
		expect(undoChangeLabel({ kind: 'nodes-added', count: 3 }))
			.toEqual({ key: 'undoHistory.change.nodesAdded', values: { count: 3 } });
		expect(undoChangeLabel({ kind: 'initial' })).toEqual({ key: 'undoHistory.change.initial' });
	});
});
