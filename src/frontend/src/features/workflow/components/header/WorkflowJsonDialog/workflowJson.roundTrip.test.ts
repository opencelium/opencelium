import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../../types/workflow.types';
import { buildConnectionPayload, buildWorkflowIndexes } from '../../../api/connectionPayload';
import { mapConnectionToWorkflowState } from '../../../api/connectionMapper';
import { initialNodes } from '../../../data/initialGraph';
import { mapWorkflowJsonToWorkflowState, validateWorkflowJson } from './workflowJson.validate';

describe('workflow JSON round trip', () => {
	it('preserves node ids, edges, indexes, and field bindings', () => {
		const webhook: WorkflowNodeModel = {
			id: 'webhook-1', type: 'trigger-connection', position: { x: 300, y: 220 },
			data: { title: 'Webhook', kind: 'trigger-connection', color: '#FFCFB5',
				triggerConnection: { connectionId: 12, connectionTitle: 'Producer',
					schedulerId: 4, scheduleTitle: 'Webhook schedule', webhookUrl: '/hook/12' } },
		};
		const loop: WorkflowNodeModel = {
			id: 'loop-1', type: 'loop', position: { x: 480, y: 220 },
			data: { title: 'Loop', kind: 'loop', conditionConfig: { operatorType: 'loop',
				expression: 'for {%#FFCFB5.(response).body.items%}', iterator: 'i',
				tree: { id: 'loop-group', type: 'group', properties: {}, items: [] } } },
		};
		const condition: WorkflowNodeModel = {
			id: 'if-1', type: 'if', position: { x: 480, y: 380 },
			data: { title: 'If', kind: 'if', conditionConfig: { operatorType: 'if',
				expression: "{%#FFCFB5.(response).body.items.[i].active%} = 'true'",
				tree: { id: 'if-group', type: 'group', properties: { conjunction: '&&' },
					items: [{ id: 'if-rule', type: 'rule', properties: {
						leftField: '{%#FFCFB5.(response).body.items.[i].active%}',
						operator: '=', rightField: "'true'" } }] } } },
		};
		const method: WorkflowNodeModel = {
			id: 'method-1', type: 'system', position: { x: 420, y: 220 },
			data: { title: 'HTTP Request', subtitle: 'Fetch', kind: 'system', color: '#6477AB',
				methodConfig: { name: 'Fetch', url: 'https://example.test', method: 'GET',
					headers: {}, queryParams: [], endpointArgs: {}, body: {},
					bodyFormat: 'json', bodyData: 'raw' }, jump: 'method-2' },
		};
		const finalMethod: WorkflowNodeModel = { ...method, id: 'method-2',
			position: { x: 760, y: 380 }, data: { ...method.data, subtitle: 'Store',
				color: '#9EC798', jump: undefined } };
		const nodes = [...initialNodes, webhook, loop, condition, method, finalMethod];
		const edges: WorkflowEdgeModel[] = [
			{ id: 'edge-start-webhook', source: 'start-1', target: webhook.id, type: 'workflow-edge' },
			{ id: 'edge-webhook-loop', source: webhook.id, target: loop.id, type: 'workflow-edge' },
			{ id: 'edge-loop-if', source: loop.id, sourceHandle: 'bottom', target: condition.id,
				targetHandle: 'top', type: 'workflow-edge' },
			{ id: 'edge-if-method', source: condition.id, sourceHandle: 'true', target: method.id,
				targetHandle: 'top', type: 'workflow-edge', data: { branch: 'true' } },
			{ id: 'edge-if-final', source: condition.id, sourceHandle: 'false', target: finalMethod.id,
				type: 'workflow-edge', data: { branch: 'false' } },
		];
		const fieldBindings = [{ enhancement: { enhanceId: 'enhance-1', language: 'js',
			script: 'return VAR_0;', args: {
				RESULT_VAR: '{%#9EC798.(request).body.saved%}',
				VAR_0: '{%#FFCFB5.(response).body.items%}',
			} } }];
		const payload = buildConnectionPayload({ title: 'Workflow', description: 'Description',
			nodes, edges, fieldBindings });
		const restored = mapConnectionToWorkflowState(payload);

		expect(restored.nodes.map((node) => node.id).sort()).toEqual(nodes.map((node) => node.id).sort());
		expect(restored.edges.map(({ id, source, target }) => ({ id, source, target })))
			.toEqual(edges.map(({ id, source, target }) => ({ id, source, target })));
		expect([...buildWorkflowIndexes(restored.nodes, restored.edges).values()])
			.toEqual([...buildWorkflowIndexes(nodes, edges).values()]);
		expect(restored.fieldBindings).toHaveLength(1);
		expect(restored.fieldBindings[0]?.enhancement).toMatchObject({
			script: 'return VAR_0;',
			args: {
				RESULT_VAR: '#9EC798.(request).body.saved',
				VAR_0: '#FFCFB5.(response).body.items',
			},
		});
		expect(restored.nodes.find((node) => node.id === method.id)?.data.jump).toBe(finalMethod.id);
		expect(restored.nodes.find((node) => node.id === webhook.id)?.type).toBe('trigger-connection');
		expect(restored.nodes.filter((node) => node.type === 'if' || node.type === 'loop')
			.map((node) => node.id).sort()).toEqual([condition.id, loop.id].sort());
		expect(restored.nodes.find((node) => node.id === loop.id)?.data.conditionConfig)
			.toMatchObject({ operatorType: 'loop', iterator: 'i',
				expression: 'for {%#FFCFB5.(response).body.items%}' });
	});

	it('applies edited method and operator data instead of stale UI copies', () => {
		const method: WorkflowNodeModel = {
			id: 'method-1', type: 'connector', position: { x: 420, y: 220 },
			data: { title: 'Old connector', subtitle: 'Fetch', kind: 'connector', color: '#6477AB',
				connector: { connectorId: 1, title: 'Old connector', invokerName: 'old_api' },
				methodConfig: { name: 'Fetch', url: '{url}/unit', method: 'GET', headers: {},
					queryParams: [], endpointArgs: {}, body: {}, bodyFormat: 'json', bodyData: 'raw' } },
		};
		const condition: WorkflowNodeModel = {
			id: 'if-1', type: 'if', position: { x: 680, y: 220 },
			data: { title: 'If', kind: 'if', conditionConfig: { operatorType: 'if',
				expression: "'old' = 'old'",
				tree: { id: 'group', type: 'group', properties: {}, items: [] } } },
		};
		const edges: WorkflowEdgeModel[] = [
			{ id: 'e1', source: 'start-1', target: method.id, type: 'workflow-edge' },
			{ id: 'e2', source: method.id, target: condition.id, type: 'workflow-edge' },
		];
		const payload = buildConnectionPayload({ title: 'Workflow', description: '',
			nodes: [...initialNodes, method, condition], edges });
		payload.title = 'Edited workflow';
		payload.name = 'Edited workflow';
		payload.description = 'Edited description';
		payload.categoryId = 7;
		payload.ui.viewport = { x: 20, y: 30, zoom: 1.2 };
		const savedMethodNode = payload.ui.workflowNodes.find((node) => node.id === method.id);
		if (savedMethodNode) savedMethodNode.position = { x: 555, y: 333 };
		const editedMethod = payload.fromConnector.methods[0];
		editedMethod.name = 'Edited method';
		editedMethod.label = 'Edited label';
		editedMethod.color = '#ABCDEF';
		editedMethod.dataAggregator = 3;
		editedMethod.connector = { connectorId: 2, title: 'Edited connector',
			icon: null, invoker: 'edited_api' };
		editedMethod.request.endpoint = '{url}/unit/test?key="value"';
		editedMethod.request.method = 'POST';
		editedMethod.request.header = { Authorization: 'edited' };
		editedMethod.request.body = { type: 'object', format: 'json', data: 'raw',
			fields: { changed: true } };
		editedMethod.response = {
			success: { status: '201', header: {}, body: { type: 'object', format: 'json',
				data: 'raw', fields: { saved: true } } },
			fail: { status: '400', header: null, body: null },
		};
		payload.fromConnector.operators[0].expression = "('new' = 'new')";
		payload.fromConnector.operators[0].dataAggregator = 4;

		const validation = validateWorkflowJson(payload);
		expect(validation.success).toBe(true);
		if (!validation.success) throw new Error('Expected edited workflow JSON to be valid');
		const edited = mapWorkflowJsonToWorkflowState(validation.data);
		expect(edited).toMatchObject({ title: 'Edited workflow',
			description: 'Edited description', categoryId: 7,
			viewport: { x: 20, y: 30, zoom: 1.2 } });
		expect(edited.nodes.find((node) => node.id === method.id)?.position)
			.toEqual({ x: 555, y: 333 });
		expect(edited.nodes.find((node) => node.id === method.id)?.data.methodConfig?.url)
			.toBe('{url}/unit/test?key="value"');
		expect(edited.nodes.find((node) => node.id === method.id)?.data).toMatchObject({
			title: 'Edited connector', subtitle: 'Edited label', color: '#ABCDEF', dataAggregator: 3,
			connector: { connectorId: 2, title: 'Edited connector', invokerName: 'edited_api' },
			methodConfig: { name: 'Edited method', method: 'POST',
				headers: { Authorization: 'edited' }, body: { changed: true },
				response: { success: { status: '201' } } },
		});
		expect(edited.nodes.find((node) => node.id === method.id)?.data.methodConfig?.queryParams)
			.toEqual(expect.arrayContaining([expect.objectContaining({
				key: 'key', value: '"value"', enabled: true,
			})]));
		expect(edited.nodes.find((node) => node.id === condition.id)?.data).toMatchObject({
			dataAggregator: 4,
			conditionConfig: { expression: "('new' = 'new')" },
		});
	});

	it('applies method and operator type changes despite stale UI node types', () => {
		const method: WorkflowNodeModel = {
			id: 'method-1', type: 'connector', position: { x: 420, y: 220 },
			data: { title: 'Connector', subtitle: 'Fetch', kind: 'connector', color: '#6477AB',
				connector: { connectorId: 1, title: 'Connector', invokerName: 'connector_api' },
				methodConfig: { name: 'Fetch', url: '{url}/unit', method: 'GET', headers: {},
					queryParams: [], endpointArgs: {}, body: {}, bodyFormat: 'json', bodyData: 'raw' } },
		};
		const condition: WorkflowNodeModel = {
			id: 'operator-1', type: 'if', position: { x: 680, y: 220 },
			data: { title: 'If', kind: 'if', conditionConfig: { operatorType: 'if',
				expression: "'a' = 'a'",
				tree: { id: 'group', type: 'group', properties: {}, items: [] } } },
		};
		const edges: WorkflowEdgeModel[] = [
			{ id: 'e1', source: 'start-1', target: method.id, type: 'workflow-edge' },
			{ id: 'e2', source: method.id, target: condition.id, type: 'workflow-edge' },
		];
		const payload = buildConnectionPayload({ title: 'Workflow', description: '',
			nodes: [...initialNodes, method, condition], edges });
		payload.fromConnector.methods[0].methodType = 'HTTP_REQUEST';
		payload.fromConnector.methods[0].connector = null;
		payload.fromConnector.operators[0].type = 'loop';
		payload.fromConnector.operators[0].expression = 'for items';
		payload.fromConnector.operators[0].iterator = 'j';

		const validation = validateWorkflowJson(payload);
		expect(validation.success).toBe(true);
		if (!validation.success) throw new Error('Expected type-edited workflow JSON to be valid');
		const edited = mapWorkflowJsonToWorkflowState(validation.data);
		expect(edited.nodes.find((node) => node.id === method.id)).toMatchObject({
			type: 'system', data: { kind: 'system', connector: undefined },
		});
		expect(edited.nodes.find((node) => node.id === condition.id)).toMatchObject({
			type: 'loop', data: { kind: 'loop',
				conditionConfig: { operatorType: 'loop', expression: 'for items', iterator: 'j' } },
		});
	});
});
