import { describe, expect, it, vi } from 'vitest';
import { validateWorkflowJson } from './workflowJson.validate';
import { buildConnectionPayload } from '../../../api/connectionPayload';
import * as connectionMapper from '../../../api/connectionMapper';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../../types/workflow.types';
import { initialNodes } from '../../../data/initialGraph';

const validPayload = () => ({
	title: 'Workflow',
	name: 'Workflow',
	description: '',
	categoryId: null,
	fieldBinding: [],
	fromConnector: { connectorId: -1, title: 'DEFAULT',
		methods: [] as Array<Record<string, unknown>>,
		operators: [] as Array<Record<string, unknown>> },
	toConnector: null,
	ui: {
		workflowNodes: [{ id: 'start', type: 'start', position: { x: 0, y: 0 },
			data: { title: 'Start', kind: 'start' } }],
		workflowEdges: [] as Array<{ id: string; source: string; target: string }>,
	},
});

const method = (id: string, index: string) => ({
	id, index, name: id, connector: null,
});

const graphMethod = (id: string, color: string, url = ''): WorkflowNodeModel => ({
	id, type: 'system', position: { x: 400, y: 200 },
	data: { title: 'HTTP Request', subtitle: id, kind: 'system', color,
		methodConfig: { name: id, url, method: 'GET', headers: {}, queryParams: [],
			endpointArgs: {}, body: {}, bodyFormat: 'json', bodyData: 'raw' } },
});

const graphEdge = (id: string, source: string, target: string): WorkflowEdgeModel => ({
	id, source, target, type: 'workflow-edge',
});

describe('validateWorkflowJson', () => {
	it('accepts a minimal workflow payload', () => {
		expect(validateWorkflowJson(validPayload()).success).toBe(true);
	});

	it('reports schema paths', () => {
		const payload = validPayload();
		payload.title = '';
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].path).toBe('title');
	});

	it('rejects duplicate node ids', () => {
		const payload = validPayload();
		payload.ui.workflowNodes.push({ ...payload.ui.workflowNodes[0] });
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.duplicateNode');
	});

	it('rejects edges pointing to missing nodes', () => {
		const payload = validPayload();
		payload.ui.workflowEdges.push({ id: 'edge-1', source: 'start', target: 'missing' });
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.edgeTarget');
	});

	it('rejects edges with a missing source', () => {
		const payload = validPayload();
		payload.ui.workflowEdges.push({ id: 'edge-1', source: 'missing', target: 'start' });
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.edgeSource');
	});

	it('requires exactly one start node', () => {
		const payload = validPayload();
		payload.ui.workflowNodes.length = 0;
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.startCount');
	});

	it('rejects malformed and duplicate workflow indexes', () => {
		const malformed = validPayload();
		malformed.fromConnector.methods.push(method('first', '1.bad'));
		let result = validateWorkflowJson(malformed);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.indexShape');

		const duplicate = validPayload();
		duplicate.fromConnector.methods.push(method('first', '0'), method('second', '0'));
		result = validateWorkflowJson(duplicate);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.duplicateIndex');
	});

	it('rejects a nested index without a parent operator', () => {
		const payload = validPayload();
		payload.fromConnector.methods.push(method('nested', '1_0'));
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.errors[0]).toMatchObject({
				key: 'json.errors.missingParent',
				path: 'fromConnector.methods[0].index',
			});
		}
	});

	it('rejects a reference whose provider does not exist', () => {
		const consumer = graphMethod('consumer', '#6477AB',
			'{%#FFFFFF.(response).body.$.missing%}');
		const payload = buildConnectionPayload({ title: 'Workflow', description: '',
			nodes: [...initialNodes, consumer],
			edges: [graphEdge('edge-1', 'start-1', consumer.id)] });
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.brokenReference');
	});

	it('reports a mapper failure without applying the payload', () => {
		vi.spyOn(connectionMapper, 'mapConnectionToWorkflowState')
			.mockImplementationOnce(() => { throw new Error('mapper failed'); });
		const result = validateWorkflowJson(validPayload());
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.mapperFailed', reason: 'mapper failed',
		});
	});

	it('rejects an enhancement script with a removed argument', () => {
		const provider = graphMethod('provider', '#9EC798');
		const target = graphMethod('target', '#6477AB');
		const payload = buildConnectionPayload({ title: 'Workflow', description: '',
			nodes: [...initialNodes, provider, target],
			edges: [graphEdge('edge-1', 'start-1', provider.id),
				graphEdge('edge-2', provider.id, target.id)],
			fieldBindings: [{ enhancement: { enhanceId: 'enhance-1', language: 'js',
				script: 'return VARIABLE_NOT_EXIST;',
				args: { RESULT_VAR: '{%#6477AB.(request).body.result%}',
					VAR_0: '{%#9EC798.(response).body.source%}' } } }],
		});
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.brokenScript', path: 'target',
		});
	});

	it('rejects a backwards joint', () => {
		const first = graphMethod('first', '#6477AB');
		const second = { ...graphMethod('second', '#9EC798'),
			data: { ...graphMethod('second', '#9EC798').data, jump: first.id } };
		const edges = [graphEdge('edge-1', 'start-1', first.id),
			graphEdge('edge-2', first.id, second.id)];
		const payload = buildConnectionPayload({ title: 'Workflow', description: '',
			nodes: [...initialNodes, first, second], edges });
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.illegalJoint.backwards');
	});
});
