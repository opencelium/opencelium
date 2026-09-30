import { describe, expect, it } from 'vitest';
import { buildConnectionPayload } from '../../../api/connectionPayload';
import { initialEdges, initialNodes } from '../../../data/initialGraph';
import { workflowJsonSchema } from './workflowJson.schema';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../../types/workflow.types';
import { validateWorkflowJson } from './workflowJson.validate';

const payloadWithMethod = () => {
	const method: WorkflowNodeModel = {
		id: 'method-1', type: 'system', position: { x: 420, y: 220 },
		data: { title: 'HTTP Request', subtitle: 'Fetch', kind: 'system', color: '#6477AB',
			methodConfig: { name: 'Fetch', url: 'https://example.test', method: 'POST',
				headers: { Authorization: 'token' }, queryParams: [], endpointArgs: {},
				body: { value: 1 }, bodyFormat: 'json', bodyData: 'raw' } },
	};
	const edges: WorkflowEdgeModel[] = [{ id: 'edge-1', source: 'start-1',
		target: method.id, type: 'workflow-edge' }];
	return buildConnectionPayload({ title: 'Workflow', description: '',
		nodes: [...structuredClone(initialNodes), method], edges });
};

describe('workflowJsonSchema', () => {
	it('accepts the exact payload produced by buildConnectionPayload', () => {
		const payload = buildConnectionPayload({
			title: 'Workflow',
			description: '',
			nodes: initialNodes,
			edges: initialEdges,
			fieldBindings: [],
			categoryId: null,
		});

		expect(workflowJsonSchema.safeParse(payload).success).toBe(true);
	});

	it('accepts backend response result ids without allowing unrelated fields', () => {
		const payload = payloadWithMethod();
		payload.fromConnector.methods[0].response.success = {
			...payload.fromConnector.methods[0].response.success, id: null,
		};
		payload.fromConnector.methods[0].response.fail = {
			...payload.fromConnector.methods[0].response.fail, id: 'failure-101',
		};

		expect(workflowJsonSchema.safeParse(payload).success).toBe(true);
	});

	it('accepts persisted React Flow edge markers', () => {
		const payload = payloadWithMethod();
		(payload.ui.workflowEdges[0] as unknown as Record<string, unknown>).markerEnd = {
			type: 'arrowclosed', color: '#6477AB', width: 20, height: 20,
		};

		expect(workflowJsonSchema.safeParse(payload).success).toBe(true);
	});

	it('rejects unknown fields inside an edge marker', () => {
		const payload = payloadWithMethod();
		(payload.ui.workflowEdges[0] as unknown as Record<string, unknown>).markerEnd = {
			type: 'arrowclosed', extraField: true,
		};

		expect(workflowJsonSchema.safeParse(payload).success).toBe(false);
	});

	it.each([
		['title', (payload: Record<string, unknown>) => { payload.title = ''; }],
		['name', (payload: Record<string, unknown>) => { payload.name = ''; }],
		['description', (payload: Record<string, unknown>) => { payload.description = null; }],
		['categoryId', (payload: Record<string, unknown>) => { payload.categoryId = 'invalid'; }],
		['fieldBinding', (payload: Record<string, unknown>) => { payload.fieldBinding = {}; }],
		['fromConnector.methods', (payload: Record<string, unknown>) => {
			(payload.fromConnector as Record<string, unknown>).methods = null;
		}],
		['fromConnector.operators', (payload: Record<string, unknown>) => {
			(payload.fromConnector as Record<string, unknown>).operators = null;
		}],
		['ui.workflowNodes', (payload: Record<string, unknown>) => {
			(payload.ui as Record<string, unknown>).workflowNodes = null;
		}],
		['ui.workflowEdges', (payload: Record<string, unknown>) => {
			(payload.ui as Record<string, unknown>).workflowEdges = null;
		}],
		['toConnector', (payload: Record<string, unknown>) => { payload.toConnector = {}; }],
	])('rejects malformed %s', (path, mutate) => {
		const payload = buildConnectionPayload({
			title: 'Workflow', description: '', nodes: initialNodes, edges: initialEdges,
		});
		mutate(payload);
		const result = workflowJsonSchema.safeParse(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0].path.join('.')).toBe(path);
	});

	it.each([
		['root', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload as Record<string, unknown>).extraField = true;
		}],
		['method', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.fromConnector.methods[0] as unknown as Record<string, unknown>).extraField = true;
		}],
		['request', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.fromConnector.methods[0].request as unknown as Record<string, unknown>).extraField = true;
		}],
		['response', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.fromConnector.methods[0].response as unknown as Record<string, unknown>).extraField = true;
		}],
		['request body', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.fromConnector.methods[0].request.body as Record<string, unknown>).extraField = true;
		}],
		['UI node', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.ui.workflowNodes[0] as unknown as Record<string, unknown>).extraField = true;
		}],
		['UI node data', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.ui.workflowNodes[0].data as unknown as Record<string, unknown>).extraField = true;
		}],
		['UI edge', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.ui.workflowEdges[0] as unknown as Record<string, unknown>).extraField = true;
		}],
	])('rejects an unknown field in %s', (_scope, mutate) => {
		const payload = payloadWithMethod();
		mutate(payload);
		expect(workflowJsonSchema.safeParse(payload).success).toBe(false);
	});

	it.each([
		['color', 'fromConnector.methods.0.color'],
		['request', 'fromConnector.methods.0.request'],
		['response', 'fromConnector.methods.0.response'],
	])('requires method.%s', (field, expectedPath) => {
		const payload = payloadWithMethod();
		delete (payload.fromConnector.methods[0] as unknown as Record<string, unknown>)[field];
		const result = workflowJsonSchema.safeParse(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0].path.join('.')).toBe(expectedPath);
	});

	it.each([
		['endpoint', 'fromConnector.methods.0.request.endpoint'],
		['method', 'fromConnector.methods.0.request.method'],
		['header', 'fromConnector.methods.0.request.header'],
		['body', 'fromConnector.methods.0.request.body'],
	])('requires request.%s', (field, expectedPath) => {
		const payload = payloadWithMethod();
		delete (payload.fromConnector.methods[0].request as unknown as Record<string, unknown>)[field];
		const result = workflowJsonSchema.safeParse(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0].path.join('.')).toBe(expectedPath);
	});

	it('reports the exact path of an unknown field', () => {
		const payload = payloadWithMethod();
		(payload.fromConnector.methods[0].request as unknown as Record<string, unknown>)
			.extraField = true;
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].path)
			.toBe('fromConnector.methods.0.request.extraField');
	});

	it.each([
		['color', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.fromConnector.methods[0] as unknown as Record<string, unknown>).color = 7;
		}],
		['endpoint', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.fromConnector.methods[0].request as unknown as Record<string, unknown>).endpoint = 7;
		}],
		['HTTP method', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.fromConnector.methods[0].request as unknown as Record<string, unknown>).method = null;
		}],
		['header', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.fromConnector.methods[0].request as unknown as Record<string, unknown>).header = [];
		}],
		['body', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.fromConnector.methods[0].request as unknown as Record<string, unknown>).body = 'body';
		}],
		['response', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.fromConnector.methods[0] as unknown as Record<string, unknown>).response = [];
		}],
	])('rejects an incorrect %s type', (_field, mutate) => {
		const payload = payloadWithMethod();
		mutate(payload);
		expect(workflowJsonSchema.safeParse(payload).success).toBe(false);
	});

	it.each(['#C77E7Essdsdsdsd', '#12345', '#GGGGGG', 'red', '', '#12345678'])(
		'rejects invalid method color %s', (color) => {
			const payload = payloadWithMethod();
			payload.fromConnector.methods[0].color = color;
			const result = validateWorkflowJson(payload);
			expect(result.success).toBe(false);
			if (!result.success) expect(result.errors[0].path)
				.toBe('fromConnector.methods.0.color');
		},
	);

	it.each(['#C77E7E', '#abcdef', '#123456'])('accepts valid method color %s', (color) => {
		const payload = payloadWithMethod();
		payload.fromConnector.methods[0].color = color;
		expect(workflowJsonSchema.safeParse(payload).success).toBe(true);
	});

	it.each(['GETs', 'get', 'TRACE', '', ' GET'])('rejects invalid HTTP method %s', (method) => {
		const payload = payloadWithMethod();
		payload.fromConnector.methods[0].request.method = method;
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].path)
			.toBe('fromConnector.methods.0.request.method');
	});

	it.each(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])(
		'accepts supported HTTP method %s', (method) => {
			const payload = payloadWithMethod();
			payload.fromConnector.methods[0].request.method = method;
			expect(workflowJsonSchema.safeParse(payload).success).toBe(true);
		},
	);

	it.each([
		['blank endpoint', (payload: ReturnType<typeof payloadWithMethod>) => {
			payload.fromConnector.methods[0].request.endpoint = '   ';
		}],
		['invalid success status', (payload: ReturnType<typeof payloadWithMethod>) => {
			payload.fromConnector.methods[0].response.success.status = '999';
		}],
		['header line break', (payload: ReturnType<typeof payloadWithMethod>) => {
			payload.fromConnector.methods[0].request.header = { Authorization: 'token\r\nInjected: x' };
		}],
		['non-positive connector id', (payload: ReturnType<typeof payloadWithMethod>) => {
			payload.fromConnector.methods[0].methodType = 'CONNECTOR';
			payload.fromConnector.methods[0].connector = {
				connectorId: 0, title: 'Connector', icon: null, invoker: 'api',
			};
		}],
		['negative viewport zoom', (payload: ReturnType<typeof payloadWithMethod>) => {
			payload.ui.viewport = { x: 0, y: 0, zoom: -1 };
		}],
	])('rejects %s', (_case, mutate) => {
		const payload = payloadWithMethod();
		mutate(payload);
		expect(workflowJsonSchema.safeParse(payload).success).toBe(false);
	});

	it('rejects unknown connector and operator fields', () => {
		const connectorPayload = payloadWithMethod();
		const method = connectorPayload.fromConnector.methods[0] as unknown as Record<string, unknown>;
		method.methodType = 'CONNECTOR';
		method.connector = { connectorId: 1, title: 'Connector', icon: null,
			invoker: 'api', extraField: true };
		expect(workflowJsonSchema.safeParse(connectorPayload).success).toBe(false);

		const operatorPayload = payloadWithMethod();
		(operatorPayload.fromConnector.operators as unknown as Array<Record<string, unknown>>).push({
			id: 'if-1', index: '1', type: 'if', dataAggregator: null,
			expression: "'a' = 'a'", extraField: true,
		});
		expect(workflowJsonSchema.safeParse(operatorPayload).success).toBe(false);
	});

	it('normalizes legacy uppercase operator types', () => {
		const payload = payloadWithMethod();
		(payload.fromConnector.operators as unknown as Array<Record<string, unknown>>).push({
			id: 'if-1', index: '1', type: 'IF', dataAggregator: null,
			expression: "'a' = 'a'",
		});
		const result = workflowJsonSchema.safeParse(payload);
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.fromConnector.operators[0].type).toBe('if');
	});

	it.each([
		['response result', 'fromConnector.methods.0.response.success.extraField',
			(payload: ReturnType<typeof payloadWithMethod>) => {
				(payload.fromConnector.methods[0].response.success as unknown as Record<string, unknown>)
					.extraField = true;
			}],
		['response body', 'fromConnector.methods.0.response.success.body.extraField',
			(payload: ReturnType<typeof payloadWithMethod>) => {
				(payload.fromConnector.methods[0].response.success.body as unknown as Record<string, unknown>)
					.extraField = true;
			}],
		['node position', 'ui.workflowNodes.0.position.extraField',
			(payload: ReturnType<typeof payloadWithMethod>) => {
				(payload.ui.workflowNodes[0].position as unknown as Record<string, unknown>)
					.extraField = true;
			}],
		['viewport', 'ui.viewport.extraField', (payload: ReturnType<typeof payloadWithMethod>) => {
			payload.ui.viewport = { x: 0, y: 0, zoom: 1 };
			(payload.ui.viewport as unknown as Record<string, unknown>).extraField = true;
		}],
		['edge data', 'ui.workflowEdges.0.data.extraField',
			(payload: ReturnType<typeof payloadWithMethod>) => {
				(payload.ui.workflowEdges[0] as unknown as Record<string, unknown>).data = {
					extraField: true,
				};
			}],
	])('rejects and reports an unknown nested field in %s', (_scope, expectedPath, mutate) => {
		const payload = payloadWithMethod();
		mutate(payload);
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].path).toBe(expectedPath);
	});

	it.each([
		['field binding', 'fieldBinding.0.extraField', (payload: ReturnType<typeof payloadWithMethod>) => {
			(payload.fieldBinding as unknown as Array<Record<string, unknown>>).push({
				from: [], to: [], extraField: true,
			});
		}],
		['binding reference', 'fieldBinding.0.from.0.extraField',
			(payload: ReturnType<typeof payloadWithMethod>) => {
				(payload.fieldBinding as unknown as Array<Record<string, unknown>>).push({
					from: [{ color: '#ffffff', type: 'response', field: 'body.id', extraField: true }],
					to: [],
				});
			}],
		['binding enhancement', 'fieldBinding.0.enhancement',
			(payload: ReturnType<typeof payloadWithMethod>) => {
				(payload.fieldBinding as unknown as Array<Record<string, unknown>>).push({
					from: [], to: [], enhancement: {
						enhancementId: 1, name: 'Map', description: '', language: 'js',
						simpleCode: null, expertVar: '', expertCode: '', extraField: true,
					},
				});
			}],
	])('rejects and reports an unknown field in %s', (_scope, expectedPath, mutate) => {
		const payload = payloadWithMethod();
		mutate(payload);
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].path).toBe(expectedPath);
	});

	it.each([
		['success', 'fromConnector.methods.0.response.success'],
		['fail', 'fromConnector.methods.0.response.fail'],
	])('requires response.%s', (field, expectedPath) => {
		const payload = payloadWithMethod();
		delete (payload.fromConnector.methods[0].response as unknown as Record<string, unknown>)[field];
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].path).toBe(expectedPath);
	});

	it.each([
		['type', 'fromConnector.methods.0.request.body.type'],
		['format', 'fromConnector.methods.0.request.body.format'],
		['data', 'fromConnector.methods.0.request.body.data'],
		['fields', 'fromConnector.methods.0.request.body.fields'],
	])('requires request.body.%s', (field, expectedPath) => {
		const payload = payloadWithMethod();
		delete (payload.fromConnector.methods[0].request.body as unknown as Record<string, unknown>)[field];
		const result = validateWorkflowJson(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.errors[0].path).toBe(expectedPath);
	});
});
