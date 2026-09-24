import { describe, expect, it, vi } from 'vitest';
import { validateWorkflowJson } from './workflowJson.validate';
import { buildConnectionPayload } from '../../../api/connectionPayload';
import * as connectionMapper from '../../../api/connectionMapper';
import * as jumpValidator from '../../../utils/jumpValidator';
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
	id, index, name: id, methodType: 'HTTP_REQUEST', dataAggregator: null,
	color: '#6477AB', connector: null,
	request: { endpoint: 'https://example.test', method: 'GET', header: {},
		body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
	response: {
		success: { status: '200', header: {},
			body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
		fail: { status: '500', header: {},
			body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
	},
});

const graphMethod = (id: string, color: string, url = 'https://example.test'): WorkflowNodeModel => ({
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

	it('accepts a connector method only when its invoker matches the current connector', () => {
		const payload = validPayload();
		const connectorMethod = method('method-1', '0');
		connectorMethod.methodType = 'CONNECTOR';
		(connectorMethod as unknown as Record<string, unknown>).connector = {
			connectorId: 7, title: 'CRM', icon: null,
			invoker: 'crm_api' };
		payload.fromConnector.methods.push(connectorMethod);
		payload.ui.workflowNodes.push({ id: 'method-1', type: 'connector',
			position: { x: 300, y: 200 }, data: { title: 'CRM', kind: 'connector' },
		} as typeof payload.ui.workflowNodes[number]);

		const result = validateWorkflowJson(payload, { connectors: [
			{ connectorId: 7, invoker: { name: 'crm_api' } },
		] });
		expect(result.success).toBe(true);
	});

	it('rejects an invoker that does not belong to the selected connector', () => {
		const payload = validPayload();
		const connectorMethod = method('method-1', '0');
		connectorMethod.methodType = 'CONNECTOR';
		(connectorMethod as unknown as Record<string, unknown>).connector = {
			connectorId: 7, title: 'CRM', icon: null,
			invoker: 'made_up_api' };
		payload.fromConnector.methods.push(connectorMethod);

		const result = validateWorkflowJson(payload, { connectors: [
			{ connectorId: 7, invoker: { name: 'crm_api' } },
		] });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.invalidInvoker',
			path: 'fromConnector.methods.0.connector.invoker', reason: 'crm_api',
		});
	});

	it('rejects a connector method that references a missing connector', () => {
		const payload = validPayload();
		const connectorMethod = method('method-1', '0');
		connectorMethod.methodType = 'CONNECTOR';
		(connectorMethod as unknown as Record<string, unknown>).connector = {
			connectorId: 999, title: 'Missing', icon: null,
			invoker: 'crm_api' };
		payload.fromConnector.methods.push(connectorMethod);

		const result = validateWorkflowJson(payload, { connectors: [] });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.unknownConnector',
			path: 'fromConnector.methods.0.connector',
		});
	});

	it('reports schema paths', () => {
		const payload = validPayload();
		payload.title = '';
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.schema', path: 'title',
		});
	});

	it('requires name to match title', () => {
		const payload = validPayload();
		payload.name = 'Different';
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key)
			.toBe('json.errors.titleNameMismatch');
	});

	it('rejects the title of another existing workflow', () => {
		const payload = validPayload();
		payload.connectionId = 1;
		payload.title = ' Existing workflow ';
		payload.name = payload.title;
		const result = validateWorkflowJson(payload, { connections: [
			{ id: 1, title: 'Original workflow' },
			{ id: 2, title: 'existing WORKFLOW' },
		] });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.titleTaken', path: 'title',
		});
	});

	it('allows the current workflow to keep its title', () => {
		const payload = validPayload();
		payload.connectionId = 1;
		const result = validateWorkflowJson(payload, { connections: [
			{ id: 1, title: payload.title },
		] });
		expect(result.success).toBe(true);
	});

	it('blocks validation until workflow names are loaded', () => {
		const result = validateWorkflowJson(validPayload(), { connectionsLoaded: false });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.connectionNamesUnavailable', path: 'title',
		});
	});

	it('rejects category and data aggregator ids missing from backend lists', () => {
		const categoryPayload = validPayload();
		(categoryPayload as unknown as Record<string, unknown>).categoryId = 99;
		let result = validateWorkflowJson(categoryPayload, { categoryIds: [1, 2] });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.unknownCategory');

		const aggregatorPayload = validPayload();
		const aggregatedMethod = method('method-1', '0');
		(aggregatedMethod as unknown as Record<string, unknown>).dataAggregator = 99;
		aggregatorPayload.fromConnector.methods.push(aggregatedMethod);
		result = validateWorkflowJson(aggregatorPayload, { aggregatorIds: [1, 2] });
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.unknownAggregator');
	});

	it('rejects duplicate entry ids and method colors', () => {
		const duplicateId = validPayload();
		const sameId = method('same', '1');
		sameId.color = '#9EC798';
		duplicateId.fromConnector.methods.push(method('same', '0'), sameId);
		let result = validateWorkflowJson(duplicateId);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.duplicateEntryId');

		const duplicateColor = validPayload();
		duplicateColor.fromConnector.methods.push(method('first', '0'), method('second', '1'));
		result = validateWorkflowJson(duplicateColor);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.duplicateColor');
	});

	it('enforces connector presence according to method type', () => {
		const missing = validPayload();
		const connectorMethod = method('connector', '0');
		connectorMethod.methodType = 'CONNECTOR';
		missing.fromConnector.methods.push(connectorMethod);
		let result = validateWorkflowJson(missing);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.connectorRequired');

		const forbidden = validPayload();
		const httpMethod = method('http', '0');
		(httpMethod as unknown as Record<string, unknown>).connector = {
			connectorId: 7, title: 'CRM', icon: null, invoker: 'crm_api',
		};
		forbidden.fromConnector.methods.push(httpMethod);
		result = validateWorkflowJson(forbidden);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.connectorForbidden');
	});

	it('requires an iterator for LOOP operators', () => {
		const payload = validPayload();
		payload.fromConnector.operators.push({ id: 'loop-1', index: '0', type: 'loop',
			dataAggregator: null, expression: 'for items' });
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.iteratorRequired');
	});

	it('forbids an iterator for IF operators', () => {
		const payload = validPayload();
		payload.fromConnector.operators.push({ id: 'if-1', index: '0', type: 'if',
			dataAggregator: null, expression: "'a' = 'a'", iterator: 'i' });
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.iteratorForbidden',
			path: 'fromConnector.operators.0.iterator',
		});
	});

	it('validates comment data and its anchor node', () => {
		const missingData = validPayload();
		missingData.ui.workflowNodes.push({ id: 'comment-1', type: 'comment',
			position: { x: 0, y: 0 }, data: { title: 'Comment', kind: 'comment' } });
		let result = validateWorkflowJson(missingData);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.commentRequired');

		const missingAnchor = validPayload();
		missingAnchor.ui.workflowNodes.push({ id: 'comment-1', type: 'comment',
			position: { x: 0, y: 0 }, data: { title: 'Comment', kind: 'comment',
				comment: { text: 'Note', anchorNodeId: 'missing', offset: { x: 0, y: 0 } } } });
		result = validateWorkflowJson(missingAnchor);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.commentAnchor');

		const forbidden = validPayload();
		forbidden.ui.workflowNodes[0].data.comment = {
			text: 'Note', anchorNodeId: 'start-1', offset: { x: 0, y: 0 },
		};
		result = validateWorkflowJson(forbidden);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.commentForbidden');
	});

	it('accepts nested conditions and rejects malformed operator expressions', () => {
		const condition: WorkflowNodeModel = { id: 'if-1', type: 'if',
			position: { x: 300, y: 200 }, data: { title: 'If', kind: 'if',
				conditionConfig: { operatorType: 'if',
					expression: "('a' = 'a' && !('b' = 'c' || 'd' NotEmpty))",
					tree: { id: 'group', type: 'group', properties: {}, items: [] } } } };
		const payload = buildConnectionPayload({ title: 'Workflow', description: '',
			nodes: [...initialNodes, condition],
			edges: [graphEdge('edge-1', 'start-1', condition.id)] });
		expect(validateWorkflowJson(payload).success).toBe(true);

		payload.fromConnector.operators[0].expression = "('a' = 'a' &&)";
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.invalidExpression',
			path: 'fromConnector.operators.0.expression',
		});
	});

	it('requires a UI node for each method or operator', () => {
		const payload = validPayload();
		payload.fromConnector.methods.push(method('missing-node', '0'));
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.entryNodeMissing');
	});

	it('rejects duplicate edge ids and broken legacy graph references', () => {
		const duplicateEdge = validPayload();
		duplicateEdge.ui.workflowEdges.push(
			{ id: 'edge', source: 'start', target: 'start' },
			{ id: 'edge', source: 'start', target: 'start' },
		);
		let result = validateWorkflowJson(duplicateEdge);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.duplicateEdge');

		const brokenFlowchart = validPayload();
		(brokenFlowchart.ui as unknown as Record<string, unknown>).flowcharts = [
			{ flowId: 'missing', x: 0, y: 0 },
		];
		result = validateWorkflowJson(brokenFlowchart);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.flowchartNode');
	});

	it('rejects duplicate legacy flowcharts and edges', () => {
		const duplicateFlowchart = validPayload();
		(duplicateFlowchart.ui as unknown as Record<string, unknown>).flowcharts = [
			{ flowId: 'start', x: 0, y: 0 }, { flowId: 'start', x: 1, y: 1 },
		];
		let result = validateWorkflowJson(duplicateFlowchart);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.duplicateFlowchart');

		const duplicateEdge = validPayload();
		duplicateEdge.ui.workflowEdges.push({ id: 'edge-1', source: 'start', target: 'start' });
		(duplicateEdge.ui as unknown as Record<string, unknown>).flowchartEdges = [
			{ id: 'edge-1', source: 'start', target: 'start' },
			{ id: 'edge-1', source: 'start', target: 'start' },
		];
		result = validateWorkflowJson(duplicateEdge);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key)
			.toBe('json.errors.duplicateFlowchartEdge');
	});

	it('requires the same number of workflow and legacy edges', () => {
		const payload = validPayload();
		payload.ui.workflowEdges.push({ id: 'edge-1', source: 'start', target: 'start' });
		(payload.ui as unknown as Record<string, unknown>).flowchartEdges = [];
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.flowchartEdgeCount', path: 'ui.flowchartEdges',
		});
	});

	it('rejects empty, duplicated, and incomplete field bindings', () => {
		const empty = validPayload();
		(empty.fieldBinding as Array<Record<string, unknown>>).push({ id: 'binding-1' });
		let result = validateWorkflowJson(empty);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.emptyBinding');

		const duplicated = validPayload();
		(duplicated.fieldBinding as Array<Record<string, unknown>>).push(
			{ id: 'binding-1', from: [{ color: '#6477AB', type: 'response', field: 'body.id' }] },
			{ id: 'binding-1', to: [{ color: '#9EC798', type: 'request', field: 'body.id' }] },
		);
		result = validateWorkflowJson(duplicated);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.duplicateBinding');

		const enhancement = validPayload();
		(enhancement.fieldBinding as Array<Record<string, unknown>>).push({
			enhancement: { enhanceId: 'enhance-1', language: 'js', script: 'return 1;', args: {} },
		});
		result = validateWorkflowJson(enhancement);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key)
			.toBe('json.errors.missingEnhancementResult');

		const emptyScript = validPayload();
		(emptyScript.fieldBinding as Array<Record<string, unknown>>).push({
			enhancement: { enhanceId: 'enhance-1', language: 'js', script: '   ',
				args: { RESULT_VAR: 'result' } },
		});
		result = validateWorkflowJson(emptyScript);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key)
			.toBe('json.errors.emptyEnhancementScript');
	});

	it('rejects executable UI nodes without a method or operator', () => {
		const payload = validPayload();
		payload.ui.workflowNodes.push({ id: 'orphan', type: 'system',
			position: { x: 300, y: 200 }, data: { title: 'Orphan', kind: 'system' },
		} as typeof payload.ui.workflowNodes[number]);
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.orphanEntryNode');
	});

	it('requires legacy edges to match workflow edges', () => {
		const payload = validPayload();
		payload.ui.workflowEdges.push({ id: 'edge-1', source: 'start', target: 'start' });
		(payload.ui as unknown as Record<string, unknown>).flowchartEdges = [{
			id: 'edge-1', source: 'start', target: 'missing',
		}];
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key)
			.toBe('json.errors.flowchartEdgeMismatch');
	});

	it('rejects duplicate node ids', () => {
		const payload = validPayload();
		payload.ui.workflowNodes.push({ ...payload.ui.workflowNodes[0] });
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.duplicateNode', path: 'ui.workflowNodes.1.id',
		});
	});

	it('rejects edges pointing to missing nodes', () => {
		const payload = validPayload();
		payload.ui.workflowEdges.push({ id: 'edge-1', source: 'start', target: 'missing' });
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.edgeTarget', path: 'ui.workflowEdges.0.target',
		});
	});

	it('rejects edges with a missing source', () => {
		const payload = validPayload();
		payload.ui.workflowEdges.push({ id: 'edge-1', source: 'missing', target: 'start' });
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.edgeSource', path: 'ui.workflowEdges.0.source',
		});
	});

	it('requires exactly one start node', () => {
		const payload = validPayload();
		payload.ui.workflowNodes.length = 0;
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.startCount', path: 'ui.workflowNodes',
		});
	});

	it('rejects malformed and duplicate workflow indexes', () => {
		const malformed = validPayload();
		malformed.fromConnector.methods.push(method('first', '1.bad'));
		let result = validateWorkflowJson(malformed);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe('json.errors.indexShape');

		const duplicate = validPayload();
		const second = method('second', '0');
		second.color = '#9EC798';
		duplicate.fromConnector.methods.push(method('first', '0'), second);
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
				path: 'fromConnector.methods.0.index',
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

	it('rejects a payload when the mapper drops its methods', () => {
		const node = graphMethod('method-1', '#6477AB');
		const payload = buildConnectionPayload({ title: 'Workflow', description: '',
			nodes: [...initialNodes, node],
			edges: [graphEdge('edge-1', 'start-1', node.id)] });
		vi.spyOn(connectionMapper, 'mapConnectionToWorkflowState').mockReturnValueOnce({
			title: 'Workflow', description: '', nodes: initialNodes, edges: [],
			fieldBindings: [], versions: [], categoryId: null,
		});
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.mapperDroppedMethods', path: 'fromConnector.methods',
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
			key: 'json.errors.brokenScript', path: 'ui.workflowNodes.2',
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
		if (!result.success) expect(result.errors[0]).toMatchObject({
			key: 'json.errors.illegalJoint.backwards', path: 'ui.workflowNodes.2',
		});
	});

	it.each([
		'self', 'not-a-method', 'different-loop-scope', 'enters-if-scope',
		'backwards', 'skips-referenced-method',
	] as const)('reports the %s joint validation reason', (reason) => {
		const source = { ...graphMethod('source', '#6477AB'),
			data: { ...graphMethod('source', '#6477AB').data, jump: 'target' } };
		const target = graphMethod('target', '#9EC798');
		const payload = buildConnectionPayload({ title: 'Workflow', description: '',
			nodes: [...initialNodes, source, target], edges: [
				graphEdge('edge-1', 'start-1', source.id),
				graphEdge('edge-2', source.id, target.id),
			] });
		vi.spyOn(jumpValidator, 'evaluateJointTargets').mockReturnValueOnce(new Map([
			[target.id, { valid: false, reason }],
		]));
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key).toBe(`json.errors.illegalJoint.${reason}`);
	});

	it('reports a joint with a missing target', () => {
		const source = { ...graphMethod('source', '#6477AB'),
			data: { ...graphMethod('source', '#6477AB').data, jump: 'target' } };
		const target = graphMethod('target', '#9EC798');
		const payload = buildConnectionPayload({ title: 'Workflow', description: '',
			nodes: [...initialNodes, source, target], edges: [
				graphEdge('edge-1', 'start-1', source.id),
				graphEdge('edge-2', source.id, target.id),
			] });
		vi.spyOn(jumpValidator, 'evaluateJointTargets').mockReturnValueOnce(new Map());
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].key)
			.toBe('json.errors.illegalJoint.missingTarget');
	});
});
