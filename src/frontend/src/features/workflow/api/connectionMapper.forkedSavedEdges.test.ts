import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel } from '../types/workflow.types';
import { mapConnectionToWorkflowState } from './connectionMapper';
import { buildFromConnectorPayload } from './connectionPayload.fromConnector';

/**
 * The shape an automation generator writes when it wires the saved graph from each
 * step's predecessor instead of from the indexes: two IF operators that both name
 * the method before them end up as two edges leaving that method's single handle,
 * while the executable indexes (1_1, 1_2) say they run one after the other.
 */
const methods = [
	{ id: 'method-0', index: '0', name: 'Get Objects', methodType: 'connector', request: {} },
	{ id: 'method-read', index: '1_0', name: 'cmdb.objects.read', methodType: 'connector', request: {} },
	{ id: 'method-create', index: '1_1_0', name: 'cmdb.object.create', methodType: 'connector', request: {} },
	{ id: 'method-update', index: '1_2_0', name: 'cmdb.object.update', methodType: 'connector', request: {} },
];
const operators = [
	{ id: 'loop-0', index: '1', type: 'loop', iterator: 'i', expression: 'for {%#FFCFB5.(response).body.$.results[*]%}' },
	{ id: 'if-empty', index: '1_1', type: 'if', expression: '({%#C77E7E.(response).body.$.result[*]%} IsEmpty)' },
	{ id: 'if-not-empty', index: '1_2', type: 'if', expression: '({%#C77E7E.(response).body.$.result[*]%} NotEmpty)' },
];
const position = (x: number, y: number) => ({ x, y });
const savedUi = {
	viewport: { x: 0, y: 0, zoom: 1 },
	workflowNodes: [
		{ id: 'start-1', type: 'start', position: position(120, 220), data: { title: '', kind: 'start' } },
		{ id: 'method-0', type: 'connector', index: '0', position: position(285, 220), data: {} },
		{ id: 'loop-0', type: 'loop', index: '1', position: position(450, 220), data: {} },
		{ id: 'method-read', type: 'connector', index: '1_0', position: position(450, 348), data: {} },
		{ id: 'if-empty', type: 'if', index: '1_1', position: position(615, 348), data: {} },
		{ id: 'method-create', type: 'connector', index: '1_1_0', position: position(615, 476), data: {} },
		{ id: 'if-not-empty', type: 'if', index: '1_2', position: position(780, 348), data: {} },
		{ id: 'method-update', type: 'connector', index: '1_2_0', position: position(780, 476), data: {} },
	],
	workflowEdges: [
		{ id: 'e1', source: 'start-1', target: 'method-0', targetHandle: 'left' },
		{ id: 'e2', source: 'method-0', target: 'loop-0', targetHandle: 'left' },
		{ id: 'e3', source: 'loop-0', target: 'method-read', sourceHandle: 'bottom', targetHandle: 'top' },
		{ id: 'e4', source: 'method-read', target: 'if-empty', targetHandle: 'left' },
		{ id: 'e5', source: 'if-empty', target: 'method-create', sourceHandle: 'true', targetHandle: 'top' },
		// The second IF hangs off the same method and the same (default) handle.
		{ id: 'e6', source: 'method-read', target: 'if-not-empty', targetHandle: 'left' },
		{ id: 'e7', source: 'if-not-empty', target: 'method-update', sourceHandle: 'true', targetHandle: 'top' },
	],
};
const payload = {
	connectionId: 103,
	title: 'automation',
	description: '',
	fromConnector: { connectorId: -1, title: 'DEFAULT', methods, operators },
	toConnector: null,
	fieldBinding: [],
	ui: savedUi,
};
const edgesFrom = (state: { edges: WorkflowEdgeModel[] }, source: string) =>
	state.edges.filter((edge) => edge.source === source);

describe('a saved graph that forks where the indexes chain', () => {
	it('chains the two IF operators instead of drawing both on the method before them', () => {
		const state = mapConnectionToWorkflowState(payload);
		expect(edgesFrom(state, 'method-read').map((edge) => edge.target)).toEqual(['if-empty']);
		expect(edgesFrom(state, 'if-empty').map((edge) => `${edge.sourceHandle}:${edge.target}`).sort())
			.toEqual(['false:if-not-empty', 'true:method-create']);
		expect(edgesFrom(state, 'if-not-empty').map((edge) => `${edge.sourceHandle}:${edge.target}`))
			.toEqual(['true:method-update']);
	});

	it('keeps the nodes the saved ui restored, with their ids and positions', () => {
		const state = mapConnectionToWorkflowState(payload);
		expect(state.nodes.map((node) => node.id)).toEqual(savedUi.workflowNodes.map((node) => node.id));
		expect(state.nodes.find((node) => node.id === 'if-not-empty')?.position).toEqual(position(780, 348));
	});

	it('saves the workflow back with the indexes it was loaded with', () => {
		const state = mapConnectionToWorkflowState(payload);
		const rebuilt = buildFromConnectorPayload(state.nodes, state.edges);
		expect(rebuilt.methods.map((method) => `${method.index}:${method.name}`)).toEqual([
			'0:Get Objects', '1_0:cmdb.objects.read', '1_1_0:cmdb.object.create', '1_2_0:cmdb.object.update',
		]);
		expect(rebuilt.operators.map((operator) => `${operator.index}:${operator.type}`)).toEqual([
			'1:loop', '1_1:if', '1_2:if',
		]);
	});

	it('still draws a saved graph that agrees with the indexes exactly as saved', () => {
		const chained = {
			...savedUi,
			workflowEdges: savedUi.workflowEdges.map((edge) => edge.id === 'e6'
				? { ...edge, source: 'if-empty', sourceHandle: 'false' } : edge),
		};
		const state = mapConnectionToWorkflowState({ ...payload, ui: chained });
		expect(state.edges.map((edge) => edge.id)).toEqual(chained.workflowEdges.map((edge) => edge.id));
	});
});
