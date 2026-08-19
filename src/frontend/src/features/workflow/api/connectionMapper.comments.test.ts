import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildConnectionPayload } from './connectionPayload';
import { mapConnectionToWorkflowState } from './connectionMapper';

// A comment node carries no method/operator of its own, so it only exists in the
// connection's schema-less `ui` blob. These cover both halves of that contract:
// it must never leak into the executed `fromConnector` payload, and it must come
// back on reload — including for a workflow that holds nothing but comments,
// where the UI-restore path used to bail out entirely.

const rawMethod = (nodeId: string, index: string, name: string) => ({
	nodeId,
	index,
	name,
	color: '#FFCFB5',
	label: null,
	methodType: 'CONNECTOR',
	dataAggregator: null,
	request: {
		endpoint: '{url}',
		method: 'POST',
		header: {},
		body: { type: 'object', format: 'json', data: 'raw', fields: {} },
	},
	connector: { connectorId: 4, title: 'i-doit', invoker: 'i-doit' },
});

const basePayload = {
	connectionId: 1,
	title: 'commented',
	description: '',
	fromConnector: {
		connectorId: -1,
		title: 'DEFAULT',
		methods: [rawMethod('node-a', '0', 'A')],
		operators: [],
	},
	toConnector: null,
	fieldBinding: [],
	ui: {},
};

const commentNode = (id: string, text: string): WorkflowNodeModel => ({
	id,
	type: 'comment',
	position: { x: 480, y: 60 },
	width: 260,
	height: 140,
	data: { title: '', kind: 'comment', comment: { text } },
});

const saveAndReload = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]) => {
	const payload = buildConnectionPayload({
		title: 'commented',
		description: '',
		nodes,
		edges,
		fieldBindings: [],
	});
	return { payload, reloaded: mapConnectionToWorkflowState(payload) };
};

describe('comment nodes round trip', () => {
	it('keeps a comment out of the executed payload and restores it next to the graph', () => {
		const initial = mapConnectionToWorkflowState(basePayload);
		const nodes = [...initial.nodes, commentNode('comment-1', 'disabled: partner-side issue')];

		const { payload, reloaded } = saveAndReload(nodes, initial.edges);

		expect(payload.fromConnector.methods).toHaveLength(1);
		expect(payload.fromConnector.operators).toHaveLength(0);

		const restored = reloaded.nodes.find((node) => node.type === 'comment');
		expect(restored?.data.comment?.text).toBe('disabled: partner-side issue');
		expect(restored?.position).toEqual({ x: 480, y: 60 });
		expect(restored?.width).toBe(260);
		expect(restored?.height).toBe(140);
		expect(reloaded.nodes.some((node) => node.type === 'connector')).toBe(true);
	});

	it('restores a comment in a workflow that has no method or operator yet', () => {
		const startOnly = mapConnectionToWorkflowState({
			...basePayload,
			fromConnector: { ...basePayload.fromConnector, methods: [], operators: [] },
		});
		const nodes = [...startOnly.nodes, commentNode('comment-1', 'todo: pick a connector')];

		const { reloaded } = saveAndReload(nodes, startOnly.edges);

		expect(reloaded.nodes.filter((node) => node.type === 'comment')).toHaveLength(1);
		expect(reloaded.nodes.find((node) => node.type === 'comment')?.data.comment?.text)
			.toBe('todo: pick a connector');
	});
});
