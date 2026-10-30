import { describe, expect, it } from 'vitest';
import type { DetailedMethodLog, LiveLogNode, LiveLogTree } from '@features/logs';
import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import type { WorkflowMethodConfig } from '@features/workflow/types/request-config.types';
import { buildRunFailure, changedHeaders, isSameBody, prettyBody, enclosingOperators, findFailedElement, stepHeaders, toEditorBody, toEditorHeaders } from './runFailure.utils';

const logNode = (indexPath: string, type: LiveLogNode['type'], patch: Partial<LiveLogNode> = {}): LiveLogNode => ({
	key: `${indexPath}@`, id: `id-${indexPath}`, indexPath, loopIndex: '', type, status: 'COMPLETE', connectorName: null,
	properties: {}, segment: {}, error: null, childKeys: [], storedIteration: null, latestIteration: null, iterationCount: 0, ...patch,
});

/** List issues (0), then for each issue (1) create a ticket (1_0), which failed. */
const tree: LiveLogTree = {
	rootKeys: [],
	nodes: {
		'0@': logNode('0', 'OPERATION'),
		'1@': logNode('1', 'LOOP', { properties: { expression: '#FFCFB5.(response).body.$.issues[*]', iterator: 'i' } }),
		'1_0@0': logNode('1_0', 'OPERATION', { loopIndex: '0', status: 'FAIL',
			error: { message: 'HTTP 400: title must not be empty', code: null, originOfErrorPath: '1_0', stackTrace: null } }),
	},
	executionStatus: 'FAIL',
	errorLocations: [{ indexPath: '1_0', loopIndex: '0' }],
};

const methodNode = (id: string, title: string, color: string, name: string, body: unknown, invokerName: string) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title, kind: 'connector', color, connector: { connectorId: 1, title: invokerName, invokerName },
		methodConfig: { name, url: '{url}/x', headers: {}, queryParams: [], endpointArgs: {}, bodyFormat: 'json', bodyData: 'json', body } },
}) as unknown as WorkflowNodeModel;

const nodes = [
	methodNode('n-list', 'List issues', '#FFCFB5', 'ListIssues', {}, 'Tracker'),
	methodNode('n-create', 'Create ticket', '#C77E7E', 'CreateTicket', { title: '#FFCFB5.(response).body.$.issues[i].summary' }, 'Helpdesk'),
];
const indexByNodeId = new Map([['n-list', '0'], ['n-create', '1_0']]);

const details = {
	segment: {
		request: { url: 'https://helpdesk.test/x', http_method: 'POST', header: '', payload: '{"title":""}' },
		response: { status: '400', duration: '12', header: '', payload: '{"error":"title must not be empty"}' },
	},
	properties: { name: 'CreateTicket' },
	error: null,
} as unknown as DetailedMethodLog;

describe('findFailedElement', () => {
	it('takes the first error location with the message attached there', () => {
		expect(findFailedElement(tree)).toEqual({ indexPath: '1_0', loopIndex: '0', type: 'OPERATION', message: 'HTTP 400: title must not be empty' });
	});

	it('finds nothing in a run without errors', () => {
		expect(findFailedElement({ ...tree, errorLocations: [], nodes: { '0@': logNode('0', 'OPERATION') } })).toBeNull();
	});
});

describe('enclosingOperators', () => {
	it('names the loops and ifs around a path, outermost first', () => {
		expect(enclosingOperators(tree, '1_0')).toEqual(['for each i of #FFCFB5.(response).body.$.issues[*]']);
		expect(enclosingOperators(tree, '0')).toEqual([]);
	});
});

describe('buildRunFailure', () => {
	const failed = findFailedElement(tree)!;
	const { request, target } = buildRunFailure({ failed, details, tree, nodes, indexByNodeId, workflowTitle: 'Issues', language: 'de' });

	it('describes the failed call, its config and the steps it can reference', () => {
		expect(request.failure).toMatchObject({
			kind: 'method', stepName: 'Create ticket', system: 'Helpdesk', operation: 'CreateTicket',
			request: { method: 'POST', body: '{"title":""}' }, response: { status: '400' },
		});
		expect(request.step?.body).toContain('#FFCFB5.(response).body.$.issues[i].summary');
		expect(request.earlierSteps).toEqual([{ color: '#FFCFB5', name: 'List issues', operation: 'ListIssues', system: 'Tracker' }]);
		expect(request.language).toBe('de');
	});

	it('targets the failing method node for a fix', () => {
		expect(target?.nodeId).toBe('n-create');
	});

	it('describes a call that failed before it was sent, logged with an empty segment', () => {
		const unsent = { segment: {}, properties: { name: 'CreateTicket' }, error: { message: 'cannot build URL', stack_trace: [] } } as unknown as DetailedMethodLog;
		const built = buildRunFailure({ failed: { ...failed, message: '' }, details: unsent, tree, nodes, indexByNodeId, workflowTitle: '', language: 'en' });
		expect(built.request.failure.message).toBe('cannot build URL');
		expect(built.request.failure.request).toBeUndefined();
		expect(built.target?.nodeId).toBe('n-create');
	});

	it('offers no fix target when a loop failed', () => {
		const loopFailure = { ...failed, indexPath: '1', type: 'LOOP' as const };
		const built = buildRunFailure({ failed: loopFailure, details: null, tree, nodes, indexByNodeId, workflowTitle: '', language: 'en' });
		expect(built.target).toBeNull();
		expect(built.request.step).toBeUndefined();
	});
});

describe('toEditorBody', () => {
	it('parses a fixed JSON body for an object body and keeps text bodies as text', () => {
		expect(toEditorBody({ title: 'a' }, '{"title":"b"}')).toEqual({ title: 'b' });
		expect(toEditorBody('<xml/>', '<xml>b</xml>')).toBe('<xml>b</xml>');
		expect(toEditorBody({}, '{broken')).toBeUndefined();
	});
});

describe('headers', () => {
	// The editor keeps a reference in a header as a token whose source lives in endpointArgs.
	const config = {
		url: '', queryParams: [], bodyFormat: 'json', bodyData: 'json', body: {},
		headers: { 'Content-Type': 'manager', 'X-Tenant': '#{%arg1%}' },
		endpointArgs: { arg1: { source: '{%#FFCFB5.(response).body.$.tenant%}' } },
	} as unknown as WorkflowMethodConfig;

	it('writes the tokens out for the AI', () => {
		expect(stepHeaders(config)).toEqual([
			{ name: 'Content-Type', value: 'manager' }, { name: 'X-Tenant', value: '#FFCFB5.(response).body.$.tenant' }]);
	});

	it('applies only the changed headers, keeping the tokens of the others', () => {
		const fixed = [{ name: 'content-type', value: 'application/json' }, { name: 'X-Tenant', value: '#FFCFB5.(response).body.$.tenant' },
			{ name: 'Accept', value: 'application/json' }];
		expect(changedHeaders(config, fixed)).toEqual([
			{ name: 'content-type', before: 'manager', after: 'application/json' }, { name: 'Accept', before: null, after: 'application/json' }]);
		expect(toEditorHeaders(config, fixed)).toEqual({ 'Content-Type': 'application/json', 'X-Tenant': '#{%arg1%}', Accept: 'application/json' });
	});
});

describe('isSameBody', () => {
	it('reads a reformatted JSON body as the same, and a changed one as changed', () => {
		const body = { name: '#C77E7E.(response).body.$.[0].department', units: [] };
		expect(isSameBody(body, '{"name":"#C77E7E.(response).body.$.[0].department","units":[]}')).toBe(true);
		expect(isSameBody(body, '{"name":"x","units":[]}')).toBe(false);
		expect(isSameBody('<a/>', ' <a/> ')).toBe(true);
	});
});

describe('prettyBody', () => {
	it('lays out JSON and leaves other text as it is', () => {
		expect(prettyBody('{"a":"x","b":[]}')).toBe('{\n  "a": "x",\n  "b": []\n}');
		expect(prettyBody('<a/>')).toBe('<a/>');
	});
});
