import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildConnectionPayload } from './connectionPayload';
import { mapConnectionToWorkflowState } from './connectionMapper';

// Regression test for a bug where saving a workflow after inserting a new method
// inside an existing loop/if branch caused every unrelated method that comes *after*
// that branch to visually swap colors with whatever now occupies its old array slot.
//
// Root cause: on load, a saved UI node was re-attached to its backend method by a
// position-derived id (`method-2`) rather than by the method's own stable tree index
// (`2`). The backend never echoes back whatever `id` the frontend sent, and inserting
// a method earlier in the tree shifts the array position (and therefore the fallback
// id) of every method after it — even though their tree index string never changes.

const rawMethod = (nodeId: string, index: string, name: string, color: string) => ({
	nodeId,
	index,
	name,
	color,
	label: null,
	methodType: 'CONNECTOR',
	dataAggregator: null,
	request: {
		endpoint: '{url}',
		method: 'POST',
		header: {},
		body: { type: 'object', format: 'json', data: 'raw', fields: {} },
	},
	response: {
		name: 'response',
		success: { status: '200', header: {}, body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
		fail: { status: '500', header: {}, body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
	},
	connector: { connectorId: 4, title: 'i-doit', invoker: 'i-doit' },
});

const rawOperator = (nodeId: string, type: 'loop' | 'if', index: string, iterator?: string) => ({
	nodeId,
	type,
	index,
	iterator: iterator ?? null,
	condition: null,
	uiId: null,
	expression: type === 'loop' ? 'for {%#FFCFB5.(response).body.$.result[]%}' : '(true)',
});

// Simulates a GET /connection/{id} response: no frontend-supplied `id` survives a
// real backend round trip, only `nodeId`/`index`/`color` do.
const templatePayload = {
	connectionId: 1,
	title: 'template',
	description: '',
	fromConnector: {
		connectorId: -1,
		title: 'DEFAULT',
		methods: [
			rawMethod('node-a', '0', 'A', '#FFCFB5'),
			rawMethod('node-x', '1_0', 'X', '#C77E7E'),
			rawMethod('node-b', '2', 'B', '#6477AB'),
		],
		operators: [rawOperator('node-loop', 'loop', '1', 'i')],
	},
	toConnector: null,
	fieldBinding: [],
	ui: {},
};

const findByName = (nodes: WorkflowNodeModel[], name: string) =>
	nodes.find((node) => node.type === 'connector' && (node.data.methodConfig as any)?.name === name);

const connectorConfig = (name: string) => ({
	name,
	url: '{url}',
	method: 'POST',
	headers: {},
	queryParams: [],
	endpointArgs: {},
	bodyFormat: 'json' as const,
	bodyData: 'raw' as const,
	body: {},
});

const stripBackendIds = (payload: any) => ({
	...payload,
	fromConnector: {
		...payload.fromConnector,
		methods: payload.fromConnector.methods.map(({ id, ...rest }: any) => rest),
		operators: payload.fromConnector.operators.map(({ id, ...rest }: any) => rest),
	},
});

describe('workflow save/load round trip', () => {
	it('keeps every existing method on its own color after inserting a new method inside an existing branch', () => {
		const initial = mapConnectionToWorkflowState(templatePayload);
		const nodeA = findByName(initial.nodes, 'A')!;
		const nodeX = findByName(initial.nodes, 'X')!;
		const nodeB = findByName(initial.nodes, 'B')!;
		const loopNode = initial.nodes.find((node) => node.type === 'loop')!;

		expect(nodeA.data.color).toBe('#FFCFB5');
		expect(nodeX.data.color).toBe('#C77E7E');
		expect(nodeB.data.color).toBe('#6477AB');

		// User adds a new HTTP-request-style method right after X, inside the loop —
		// B (outside the loop) keeps the exact same tree index either way.
		const newMethod: WorkflowNodeModel = {
			id: 'freshly-created-node',
			type: 'connector',
			position: { x: nodeX.position.x + 100, y: nodeX.position.y },
			data: {
				title: 'DEFAULT',
				subtitle: 'C',
				kind: 'connector',
				color: '#9EC798',
				connector: { connectorId: 4, title: 'i-doit', icon: null, invokerName: 'i-doit' },
				methodConfig: connectorConfig('C'),
			},
		};
		const newEdge: WorkflowEdgeModel = {
			id: `edge-${nodeX.id}-${newMethod.id}`,
			source: nodeX.id,
			target: newMethod.id,
			targetHandle: 'left',
			type: 'workflow-edge',
		};

		const editedNodes = [...initial.nodes, newMethod];
		const editedEdges = [...initial.edges, newEdge];

		const savedPayload = buildConnectionPayload({
			title: 'template',
			description: '',
			nodes: editedNodes,
			edges: editedEdges,
			fieldBindings: [],
		});

		const backendEchoedPayload = stripBackendIds(savedPayload);
		const reloaded = mapConnectionToWorkflowState(backendEchoedPayload);

		expect(findByName(reloaded.nodes, 'A')?.data.color).toBe('#FFCFB5');
		expect(findByName(reloaded.nodes, 'X')?.data.color).toBe('#C77E7E');
		expect(findByName(reloaded.nodes, 'B')?.data.color).toBe('#6477AB');
		expect(findByName(reloaded.nodes, 'C')?.data.color).toBe('#9EC798');
		expect(loopNode).toBeTruthy();
	});
});
