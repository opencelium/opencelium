import { describe, expect, it } from 'vitest';
import type { Connector } from '@entities/connector/model/types';
import { mapConnectionToWorkflowState } from '@features/workflow/api/connectionMapper';
import { generateTreeByExpression } from '@features/workflow/components/condition-builder/conditionExpressionParser';
import type { WorkflowDsl } from '../model/workflowDsl.schema';
import { dslToConnection } from './dslToConnection';

const body = (fields: unknown) => ({ type: 'object', format: 'json', data: 'raw', fields });
const response = (fields: unknown) => ({
	name: 'response',
	success: { status: '200', header: {}, body: body(fields) },
	fail: { status: '400', header: {}, body: body({}) },
});
const connector = (connectorId: number, title: string, operations: unknown[]) =>
	({ connectorId, title, icon: null, invoker: { name: title, operations } }) as unknown as Connector;

const jira = connector(1, 'Jira', [{
	name: 'GetIssues', type: '',
	request: { endpoint: '{url}/rest/api/3/search?jql=project="{PROJECTKEY}"', method: 'GET', header: {}, body: body({}) },
	response: response({ issues: [{ key: '', fields: { summary: '', labels: [{ name: '' }], priority: { name: '' } } }] }),
}]);
const zammad = connector(2, 'Zammad', [
	{
		name: 'TicketCreate', type: '',
		request: { endpoint: '{url}/api/v1/tickets', method: 'POST', header: {}, body: body({ title: '', group: '', article: { body: '' }, tags: [] }) },
		response: response({ id: '' }),
	},
	{
		name: 'TicketUpdate', type: '',
		request: { endpoint: '{url}/api/v1/tickets/{ID}', method: 'PUT', header: {}, body: body({ state: '' }) },
		response: response({ id: '' }),
	},
]);

const dsl: WorkflowDsl = {
	steps: [
		{ id: 's1', kind: 'method', connector: 'from', operation: 'GetIssues', params: [{ name: 'PROJECTKEY', value: { literal: 'OC' } }], fields: [] },
		{
			id: 's2', kind: 'loop', over: { step: 's1', path: 'issues' },
			body: [
				{
					id: 's3', kind: 'if',
					condition: { left: { ref: { step: 's2', path: 'fields.priority.name' } }, op: 'eq', right: { literal: 'High' } },
					then: [
						{
							id: 's4', kind: 'method', connector: 'to', operation: 'TicketCreate', params: [],
							fields: [
								{ name: 'title', value: { ref: { step: 's2', path: 'fields.summary' } } },
								{ name: 'article.body', value: { literal: 'From Jira' } },
								{ name: 'tags[]', value: { literal: '["jira","high"]' } },
							],
						},
						{
							id: 's5', kind: 'method', connector: 'to', operation: 'TicketUpdate',
							params: [{ name: 'ID', value: { ref: { step: 's4', path: 'id' } } }],
							fields: [{ name: 'state', value: { literal: 'open' } }],
						},
					],
				},
				{
					id: 's6', kind: 'loop', over: { step: 's2', path: 'fields.labels[]' },
					body: [{ id: 's7', kind: 'method', connector: 'to', operation: 'TicketCreate', params: [],
						fields: [{ name: 'title', value: { ref: { step: 's6', path: 'name' } } }] }],
				},
			],
		},
	],
};

let counter = 0;
const createId = (prefix: string) => `${prefix}-${++counter}`;
const generated = dslToConnection(dsl, { from: jira, to: zammad }, createId);
const { method: methods, operator: operators } = generated.fromConnector;
const byName = (index: string) => methods.find((method) => method.index === index);

describe('dslToConnection', () => {
	it('places steps at workflow tree paths', () => {
		expect(methods.map((method) => `${method.index}:${method.name}`))
			.toEqual(['0:GetIssues', '1_0_0:TicketCreate', '1_0_1:TicketUpdate', '1_1_0:TicketCreate']);
		expect(operators.map((operator) => `${operator.index}:${operator.type}`)).toEqual(['1:loop', '1_0:if', '1_1:loop']);
	});

	it('gives every method its own colour and binds it to the chosen connector', () => {
		expect(new Set(methods.map((method) => method.color)).size).toBe(methods.length);
		expect(byName('1_0_0')?.connector).toEqual({ connectorId: 2, title: 'Zammad', icon: null, invoker: 'Zammad' });
	});

	it('writes loops the way the condition builder does, with iterators by depth', () => {
		const color = byName('0')?.color;
		expect(operators[0]).toMatchObject({ iterator: 'i', expression: `for {%${color}.(response).body.$.issues[]%}` });
		expect(operators[2]).toMatchObject({ iterator: 'j', expression: `for {%${color}.(response).body.$.issues[i].fields.labels[]%}` });
	});

	it('reads the current loop element through the loop source', () => {
		const color = byName('0')?.color;
		expect(operators[1]?.expression).toBe(`({%${color}.(response).body.$.issues[i].fields.priority.name%} = 'High')`);
		expect(byName('1_0_0')?.request.body.fields).toMatchObject({ title: `${color}.(response).body.$.issues[i].fields.summary` });
		expect(byName('1_1_0')?.request.body.fields).toMatchObject({ title: `${color}.(response).body.$.issues[i].fields.labels[j].name` });
	});

	it('fills body fields inside the operation template and keeps the rest of it', () => {
		expect(byName('1_0_0')?.request.body.fields).toEqual({
			title: expect.any(String), group: '', article: { body: 'From Jira' }, tags: ['jira', 'high'],
		});
	});

	it('replaces endpoint placeholders, wrapping references', () => {
		expect(byName('0')?.request.endpoint).toBe('{url}/rest/api/3/search?jql=project="OC"');
		expect(byName('1_0_1')?.request.endpoint).toBe(`{url}/api/v1/tickets/{%${byName('1_0_0')?.color}.(response).body.$.id%}`);
	});

	it('produces expressions the condition dialog can parse back into rules', () => {
		for (const operator of operators) {
			const tree = generateTreeByExpression(operator.expression, operator.type);
			expect(tree?.items?.length, operator.expression).toBe(1);
		}
	});

	it('rejects operations the selected connectors do not have', () => {
		const unknown: WorkflowDsl = { steps: [{ id: 's1', kind: 'method', connector: 'to', operation: 'Nope', params: [], fields: [] }] };
		expect(() => dslToConnection(unknown, { from: jira, to: zammad })).toThrow(/Nope/);
		expect(() => dslToConnection({ steps: [{ ...unknown.steps[0], operation: 'TicketCreate' } as WorkflowDsl['steps'][number]] },
			{ from: jira, to: null })).toThrow(/to connector/);
	});
});

describe('condition operators', () => {
	const conditionExpression = (condition: Extract<WorkflowDsl['steps'][number], { kind: 'if' }>['condition']) => {
		const generatedIf = dslToConnection({
			steps: [
				{ id: 's1', kind: 'method', connector: 'from', operation: 'GetIssues', params: [], fields: [] },
				{ id: 's2', kind: 'if', condition, then: [] },
			],
		}, { from: jira, to: zammad }, createId);
		return generatedIf.fromConnector.operator[0]?.expression ?? '';
	};
	const list = { ref: { step: 's1', path: 'issues[].key' } };
	const single = { ref: { step: 's1', path: 'issues.0.key' } };
	const literal = { literal: 'OC-1' };

	it.each([
		['contains', list, 'Contains'],
		['contains', single, 'ContainsSubStr'],
		['not_contains', list, 'NotContains'],
		['not_contains', single, 'NotContainsSubStr'],
	] as const)('%s on %j becomes %s', (op, left, operator) => {
		expect(conditionExpression({ left, op, right: literal })).toMatch(new RegExp(`%} ${operator} 'OC-1'\\)$`));
	});

	it.each([
		['exists', 'NotEmpty'],
		['empty', 'IsEmpty'],
	] as const)('%s becomes the unary %s, ignoring the right value', (op, operator) => {
		const expression = conditionExpression({ left: list, op, right: { literal: 'ignored' } });
		expect(expression).toMatch(new RegExp(`%} ${operator}\\)$`));
		expect(expression).not.toContain('ignored');
		expect(generateTreeByExpression(expression, 'if')?.items?.[0]).toMatchObject({ properties: { operator } });
	});
});

describe('loading the generated connection', () => {
	const state = mapConnectionToWorkflowState(generated);

	it('creates one node per step plus the start node', () => {
		const kinds = state.nodes.map((node) => node.type).sort();
		expect(kinds).toEqual(['connector', 'connector', 'connector', 'connector', 'if', 'loop', 'loop', 'start'].sort());
	});

	it('keeps colours, connectors and request bodies on the method nodes', () => {
		const ticket = state.nodes.find((node) => node.data.methodConfig?.name === 'TicketUpdate');
		expect(ticket?.data.color).toBe(byName('1_0_1')?.color);
		expect(ticket?.data.connector?.connectorId).toBe(2);
		expect(ticket?.data.methodConfig?.body).toEqual({ state: 'open' });
	});

	it('links every node into the graph', () => {
		const linked = new Set(state.edges.flatMap((edge) => [edge.source, edge.target]));
		expect(state.nodes.every((node) => linked.has(node.id))).toBe(true);
	});
});
