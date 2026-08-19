import { describe, expect, it } from 'vitest';
import { mapConnectionToWorkflowState } from './connectionMapper';
import { buildFromConnectorPayload, buildWorkflowIndexes } from './connectionPayload';

// Reproduces a saved "test joint" connection: 0 -> loop "1" -> (bottom) if "1_0",
// the IF's true branch holding 1_0_0 -> 1_0_1, its continue edge leading to
// 1_1 -> 1_2, and a joint from 1_0_1 to 1_2.
//
// The 1_1 -> 1_2 edge carries a stale `data.branch: 'false'` inherited from the
// edge it replaced when 1_2 was inserted. It has no sourceHandle of its own, and
// promoting that marker to one used to make the edge unrenderable (a connector
// has no 'false' handle) and cut the index chain, so 1_2 lost its index and the
// joint pointing at it was dropped.
const method = (nodeId: string, index: string, color: string, jump: string | null = null) => ({
	nodeId, index, name: 'GetAllUser', color, label: null, methodType: 'CONNECTOR',
	dataAggregator: null, jump,
	request: { endpoint: '{url}/user/all', method: 'GET', header: {}, body: { type: 'object', format: 'json', data: 'raw', fields: {} } },
	response: { success: { status: '200', header: {}, body: { type: 'array', format: 'json', data: 'raw', fields: { id: '' } } }, fail: { status: '401', header: null, body: null } },
	connector: { connectorId: 1, title: 'fake', invoker: 'fake_api' },
});

const uiNode = (id: string, type: string, index: string, position: { x: number; y: number }) => ({
	id, type, index, position,
	data: {
		title: type === 'connector' ? 'fake' : type, subtitle: 'GetAllUser', kind: type,
		...(type === 'connector' ? { connector: { connectorId: 1, title: 'fake', invokerName: 'fake_api' } } : {}),
	},
});

const payload = {
	connectionId: 9,
	title: 'test joint',
	description: '',
	fromConnector: {
		connectorId: -1,
		title: 'DEFAULT',
		methods: [
			method('m-0', '0', '#FFCFB5'),
			method('m-1', '1_0_0', '#98BEC7'),
			method('m-2', '1_0_1', '#C77E7E', '1_2'),
			method('m-3', '1_1', '#9EC798'),
			method('m-4', '1_2', '#6477AB'),
		],
		operators: [
			{ nodeId: 'o-1', type: 'loop', index: '1', iterator: 'i', condition: null, expression: 'for {%#FFCFB5.(response).body.$.[*]%}' },
			{ nodeId: 'o-2', type: 'if', index: '1_0', iterator: null, condition: null, expression: "({%#FFCFB5.(response).body.$.[i].id%} = '2')" },
		],
	},
	fieldBinding: [],
	ui: {
		viewport: { x: 0, y: 0, zoom: 1 },
		workflowNodes: [
			{ id: 'start-1', type: 'start', position: { x: 120, y: 220 }, data: { title: '', kind: 'start' }, deletable: false },
			uiNode('connector-first', 'connector', '0', { x: 285, y: 220 }),
			uiNode('loop-outer', 'loop', '1', { x: 450, y: 220 }),
			uiNode('if-inner', 'if', '1_0', { x: 450, y: 348 }),
			uiNode('connector-true-1', 'connector', '1_0_0', { x: 450, y: 476 }),
			uiNode('connector-true-2', 'connector', '1_0_1', { x: 715, y: 476 }),
			uiNode('connector-continue', 'connector', '1_1', { x: 731, y: 348 }),
			uiNode('connector-last', 'connector', '1_2', { x: 1045, y: 350 }),
		],
		workflowEdges: [
			{ id: 'e1', source: 'start-1', target: 'connector-first', targetHandle: 'left', type: 'workflow-edge', data: {} },
			{ id: 'e2', source: 'connector-first', target: 'loop-outer', targetHandle: 'left', type: 'workflow-edge', data: {} },
			{ id: 'e3', source: 'loop-outer', target: 'if-inner', sourceHandle: 'bottom', targetHandle: 'top', type: 'workflow-edge', data: {} },
			{ id: 'e4', source: 'if-inner', target: 'connector-true-1', sourceHandle: 'true', targetHandle: 'top', type: 'workflow-edge', data: { branch: 'true' } },
			{ id: 'e5', source: 'connector-true-1', target: 'connector-true-2', targetHandle: 'left', type: 'workflow-edge', data: {} },
			{ id: 'e6', source: 'if-inner', target: 'connector-continue', sourceHandle: 'false', targetHandle: 'left', type: 'workflow-edge', data: { branch: 'false' } },
			{ id: 'e7', source: 'connector-continue', target: 'connector-last', targetHandle: 'left', type: 'workflow-edge', data: { branch: 'false' } },
		],
	},
};

describe('mapConnectionToWorkflowState with a joint', () => {
	const state = mapConnectionToWorkflowState(payload);

	it('keeps the chain edge after the IF continue branch usable', () => {
		const edge = state.edges.find((item) => item.id === 'e7');
		expect(edge).toBeDefined();
		// A connector has no 'false' handle: a promoted branch marker here made the
		// edge unrenderable and cut the chain.
		expect(edge?.sourceHandle).toBeUndefined();
		expect(edge?.data?.branch).toBeUndefined();
	});

	it('still resolves the handles of edges that really do leave the IF', () => {
		expect(state.edges.find((item) => item.id === 'e4')?.sourceHandle).toBe('true');
		expect(state.edges.find((item) => item.id === 'e6')?.sourceHandle).toBe('false');
		expect(state.edges.find((item) => item.id === 'e3')?.sourceHandle).toBe('bottom');
	});

	it('indexes every node, including the one after the continue branch', () => {
		const indexes = buildWorkflowIndexes(state.nodes, state.edges);
		expect(indexes.get('connector-continue')).toBe('1_1');
		expect(indexes.get('connector-last')).toBe('1_2');
	});

	it('restores the joint as a node id pointing at the method saved under 1_2', () => {
		expect(state.nodes.find((node) => node.id === 'connector-true-2')?.data.jump)
			.toBe('connector-last');
	});

	it('leaves methods without a joint alone', () => {
		const withJoints = state.nodes.filter((node) => node.data.jump);
		expect(withJoints.map((node) => node.id)).toEqual(['connector-true-2']);
	});

	// What the backend receives on save and on a test run (both serialize the
	// in-memory graph through buildFromConnectorPayload): the joint travels as the
	// target's workflow index, in the same index space as `methods[i].index`.
	it('serializes the restored joint back as the target index', () => {
		const payloadOut = buildFromConnectorPayload(state.nodes, state.edges);
		const byIndex = new Map(payloadOut.methods.map((item) => [item.index, item]));
		expect(byIndex.get('1_0_1')?.jump).toBe('1_2');
		expect(byIndex.get('1_1')?.jump).toBeUndefined();
		expect([...byIndex.keys()].sort()).toEqual(['0', '1_0_0', '1_0_1', '1_1', '1_2']);
	});
});
