import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { deleteNodeGraph } from '../utils/deleteNodeGraph';
import { prepareWorkflowElements } from '../components/WorkflowCanvas/prepareWorkflowElements';
import { buildConnectionPayload } from './connectionPayload';
import { mapConnectionToWorkflowState } from './connectionMapper';

// A comment node carries no method/operator of its own, so it only exists in the
// connection's schema-less `ui` blob, anchored to the node it belongs to. These
// cover the whole contract: it never leaks into the executed `fromConnector`
// payload, it comes back on reload (including for a workflow that holds nothing
// but comments), it follows and dies with its anchor, and minimizing it keeps the
// note out of the rendered graph without losing its text.

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

const OFFSET = { x: -60, y: -170 };

const commentNode = (
	id: string,
	text: string,
	anchorNodeId: string,
	collapsed?: boolean,
): WorkflowNodeModel => ({
	id,
	type: 'comment',
	position: { x: 0, y: 0 },
	width: 260,
	height: 140,
	data: {
		title: '',
		kind: 'comment',
		comment: { text, anchorNodeId, offset: OFFSET, ...(collapsed ? { collapsed } : {}) },
	},
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

const prepare = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]) =>
	prepareWorkflowElements({
		nodes,
		edges,
		activeAction: null,
		onOpenAddStep: () => {},
		onOpenContextMenu: () => {},
		onDeleteNode: () => {},
		onOpenAggregatorEditor: () => {},
		onChangeCommentText: () => {},
		onToggleComment: () => {},
		onAddComment: () => {},
	}).preparedNodes;

describe('comment nodes round trip', () => {
	it('keeps a comment out of the executed payload and restores it on its anchor', () => {
		const initial = mapConnectionToWorkflowState(basePayload);
		const anchor = initial.nodes.find((node) => node.type === 'connector')!;
		const nodes = [...initial.nodes, commentNode('comment-1', 'disabled: partner-side issue', anchor.id)];

		const { payload, reloaded } = saveAndReload(nodes, initial.edges);

		expect(payload.fromConnector.methods).toHaveLength(1);
		expect(payload.fromConnector.operators).toHaveLength(0);

		const restored = reloaded.nodes.find((node) => node.type === 'comment');
		const restoredAnchor = reloaded.nodes.find((node) => node.type === 'connector')!;
		expect(restored?.data.comment?.text).toBe('disabled: partner-side issue');
		expect(restored?.data.comment?.anchorNodeId).toBe(restoredAnchor.id);
		expect(restored?.data.comment?.offset).toEqual(OFFSET);
		expect(restored?.width).toBe(260);
		expect(restored?.height).toBe(140);
		expect(restored?.position).toEqual({
			x: restoredAnchor.position.x + OFFSET.x,
			y: restoredAnchor.position.y + OFFSET.y,
		});
	});

	it('restores a comment in a workflow that has no method or operator yet', () => {
		const startOnly = mapConnectionToWorkflowState({
			...basePayload,
			fromConnector: { ...basePayload.fromConnector, methods: [], operators: [] },
		});
		const start = startOnly.nodes.find((node) => node.type === 'start')!;
		const nodes = [...startOnly.nodes, commentNode('comment-1', 'todo: pick a connector', start.id)];

		const { reloaded } = saveAndReload(nodes, startOnly.edges);

		expect(reloaded.nodes.filter((node) => node.type === 'comment')).toHaveLength(1);
		expect(reloaded.nodes.find((node) => node.type === 'comment')?.data.comment?.text)
			.toBe('todo: pick a connector');
	});

	it('keeps a minimized comment in the graph but off the canvas', () => {
		const initial = mapConnectionToWorkflowState(basePayload);
		const anchor = initial.nodes.find((node) => node.type === 'connector')!;
		const nodes = [...initial.nodes, commentNode('comment-1', 'hidden but kept', anchor.id, true)];

		const { reloaded } = saveAndReload(nodes, initial.edges);
		const restored = reloaded.nodes.find((node) => node.type === 'comment');
		expect(restored?.data.comment).toMatchObject({ text: 'hidden but kept', collapsed: true });

		const prepared = prepare(reloaded.nodes, reloaded.edges);
		expect(prepared.some((node) => node.type === 'comment')).toBe(false);
		expect(prepared.find((node) => node.type === 'connector')?.data.anchoredComment)
			.toEqual({ nodeId: 'comment-1', collapsed: true });
	});

	it('follows its anchor when the anchor moves, and is deleted with it', () => {
		const initial = mapConnectionToWorkflowState(basePayload);
		const anchor = initial.nodes.find((node) => node.type === 'connector')!;
		const nodes = [...initial.nodes, commentNode('comment-1', 'note', anchor.id)];

		const movedNodes = nodes.map((node) => node.id === anchor.id
			? { ...node, position: { x: node.position.x + 400, y: node.position.y + 120 } }
			: node);
		const preparedComment = prepare(movedNodes, initial.edges)
			.find((node) => node.type === 'comment');
		expect(preparedComment?.position).toEqual({
			x: anchor.position.x + 400 + OFFSET.x,
			y: anchor.position.y + 120 + OFFSET.y,
		});

		const afterDelete = deleteNodeGraph(anchor.id, nodes, initial.edges);
		expect(afterDelete.nodes.some((node) => node.type === 'comment')).toBe(false);
	});
});
