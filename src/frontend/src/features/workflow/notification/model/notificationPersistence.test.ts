import { describe, expect, it } from 'vitest';
import { initialNodes } from '../../data/initialGraph';
import { createNodeFromAction } from '../../utils/createNodeFromAction';
import { buildConnectionPayload } from '../../api/connectionPayload';
import { mapConnectionToWorkflowState } from '../../api/connectionMapper';
import { buildLegacyConnection } from '../../components/request-editor/legacyAdapter';
import { selectTool, updateActiveDraft } from './notificationConfig';
import { buildNotificationMethodConfig } from './notificationMethodConfig';
import type { WorkflowNodeModel } from '../../types/workflow.types';

const createGraph = () => {
	const created = createNodeFromAction({
		action: { sourceNodeId: initialNodes[0].id, direction: 'right', kind: 'notification' },
		nodes: initialNodes, edges: [],
	});
	const node = created.nodes.find((item) => item.type === 'notification')!;
	let config = selectTool(node.data.notification!, 'slack');
	config = updateActiveDraft(config, (draft) => ({ ...draft, webhookUrl: 'https://hooks.slack.com/services/T/B/x',
		message: { ...draft.message, text: 'Hello {%#3fa9f5.(response).body.$.name%}' } }));
	const configured: WorkflowNodeModel = { ...node, data: { ...node.data, subtitle: 'Notify ops', labelEdited: true,
		notification: config, methodConfig: buildNotificationMethodConfig(node.id, config) } };
	return { nodes: created.nodes.map((item) => item.id === node.id ? configured : item), edges: created.edges, node: configured };
};

describe('notification step persistence', () => {
	it('creates an empty notification node with its own reference colour', () => {
		const { nodes } = createNodeFromAction({
			action: { sourceNodeId: initialNodes[0].id, direction: 'right', kind: 'notification' },
			nodes: initialNodes, edges: [],
		});
		const node = nodes.find((item) => item.type === 'notification')!;
		expect(node.data.color).toMatch(/^#[0-9a-f]{6}$/i);
		expect(node.data.notification?.tool).toBeNull();
	});

	it('is saved as an HTTP POST and restored as a notification node with its config', () => {
		const { nodes, edges, node } = createGraph();
		const payload = buildConnectionPayload({ title: 't', description: '', nodes, edges, fieldBindings: [] });
		const method = payload.fromConnector.methods.find((item) => item.id === node.id)!;
		expect(method.methodType).toBe('HTTP_REQUEST');
		expect(method.request.method).toBe('POST');
		expect(method.request.endpoint).toBe('https://hooks.slack.com/services/T/B/x');

		const reloaded = mapConnectionToWorkflowState(payload);
		const restored = reloaded.nodes.find((item) => item.id === node.id)!;
		expect(restored.type).toBe('notification');
		expect(restored.data.kind).toBe('notification');
		expect(restored.data.subtitle).toBe('Notify ops');
		expect(restored.data.notification?.tool).toBe('slack');
		expect(restored.data.notification?.tools.slack?.webhookUrl).toBe('https://hooks.slack.com/services/T/B/x');
	});

	it('is a reference source for later steps', () => {
		const { nodes, node } = createGraph();
		const method = buildLegacyConnection(nodes).fromConnector.method.find((item) => item.id === node.id);
		expect(method?.color).toBe(node.data.color);
		expect(method?.methodType).toBe('HTTP_REQUEST');
	});
});
