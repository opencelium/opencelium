import { describe, expect, it } from 'vitest';
import type { DetailedMethodLog, LiveLogNode, LiveLogTree } from '@features/logs';
import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import { buildRunFailure, enclosingOperators, findFailedElement, toEditorBody } from './runFailure.utils';

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
