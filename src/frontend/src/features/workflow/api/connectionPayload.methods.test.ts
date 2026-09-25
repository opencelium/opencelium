import { describe, expect, it } from 'vitest';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { buildMethodPayload } from './connectionPayload.methods';

const connectorNode = {
	id: 'm1',
	type: 'connector',
	position: { x: 0, y: 0 },
	data: {
		title: 'i-doit', subtitle: 'GetUser', kind: 'connector', color: '#aaaaaa',
		connector: {
			connectorId: 7, title: 'i-doit', icon: 'i-doit.png', invokerName: 'i-doit',
			// Client-only health fields, hydrated from the connector list.
			status: 'ok', lastTestError: null, lastCheckedAt: 1700000000000,
		},
		methodConfig: { name: 'GetUser', method: 'GET', url: 'https://example.test', headers: {}, body: {} },
	},
} as unknown as WorkflowNodeModel;

const httpNode = {
	id: 'm2',
	type: 'system',
	position: { x: 0, y: 0 },
	data: { title: 'HTTP', subtitle: 'Call', kind: 'system', methodConfig: { method: 'GET', url: 'https://example.test' } },
} as unknown as WorkflowNodeModel;

describe('buildMethodPayload connector block', () => {
	it('sends the invoker under the property the backend reads, and nothing client-only', () => {
		const payload = buildMethodPayload(connectorNode, '0', 0, '#aaaaaa');
		expect(payload.connector).toEqual({
			connectorId: 7,
			title: 'i-doit',
			icon: 'i-doit.png',
			invoker: 'i-doit',
		});
	});

	it('sends a null invoker when the connector has no invoker name', () => {
		const node = {
			...connectorNode,
			data: {
				...connectorNode.data,
				connector: { connectorId: 7, title: 'i-doit', icon: null },
			},
		} as unknown as WorkflowNodeModel;
		const payload = buildMethodPayload(node, '0', 0, '#aaaaaa');
		expect(payload.connector).toEqual({
			connectorId: 7, title: 'i-doit', icon: null, invoker: null,
		});
	});

	it('keeps connector null for an http-request method', () => {
		const payload = buildMethodPayload(httpNode, '1', 1);
		expect(payload.connector).toBeNull();
	});
});

describe('buildMethodPayload joint', () => {
	it('serializes a joint as the target workflow index under jump', () => {
		const payload = buildMethodPayload(connectorNode, '0', 0, '#aaaaaa', '1_2');
		expect(payload.jump).toBe('1_2');
	});

	it('omits jump when the method has no joint', () => {
		const payload = buildMethodPayload(connectorNode, '0', 0, '#aaaaaa');
		expect('jump' in payload).toBe(false);
	});
});
