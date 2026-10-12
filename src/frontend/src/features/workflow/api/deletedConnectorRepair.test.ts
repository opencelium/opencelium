import { describe, expect, it } from 'vitest';
import type { Connector } from '@entities/connector/model/types';
import { findDeletedConnectorGroups, repairDeletedConnectors } from './deletedConnectorRepair';
import { mapConnectionToWorkflowState } from './connectionMapper';
import { buildConnectionPayload } from './connectionPayload';

const connector = (connectorId: number) =>
	({ connectorId, title: `Connector ${connectorId}`, invoker: { name: 'Invoker' } }) as Connector;
const replacements = [connector(20), connector(30)];
const reference = '#AABBCC.(response).success.$.value';
const payload = {
	title: 'Broken',
	fromConnector: {
		connectorId: -1,
		methods: [
			{
				id: 'a',
				index: '0_0_0',
				name: 'read',
				color: '#AABBCC',
				connector: { connectorId: 2, title: 'Deleted A', invoker: 'Invoker' },
				request: { body: { fields: { value: reference, connectorId: 2 } } },
			},
			{
				id: 'b',
				index: '0_0_1',
				name: 'write',
				color: '#DDEEFF',
				connector: { connectorId: 3, title: 'Deleted B', invoker: 'Invoker' },
			},
		],
		operators: [
			{ id: 'loop', index: '0', type: 'loop', iterator: reference },
			{ id: 'if', index: '0_0', type: 'if', expression: reference },
		],
	},
	fieldBinding: [
		{
			enhancement: {
				enhanceId: 'binding',
				language: 'js',
				script: 'return value',
				args: { value: reference },
			},
		},
	],
	ui: {
		workflowNodes: [
			{ id: 'start', type: 'start', position: { x: 50, y: 50 } },
			{ id: 'loop', index: '0', type: 'loop', position: { x: 320, y: 110 } },
			{ id: 'if', index: '0_0', type: 'if', position: { x: 570, y: 410 } },
			{
				id: 'a',
				index: '0_0_0',
				type: 'connector',
				position: { x: 800, y: 410 },
				data: { connector: { connectorId: 2, title: 'Deleted A', invokerName: 'Invoker' } },
			},
			{
				id: 'b',
				index: '0_0_1',
				type: 'connector',
				position: { x: 800, y: 410 },
				data: { connector: { connectorId: 3, title: 'Deleted B', invokerName: 'Invoker' } },
			},
		],
		workflowEdges: [
			{ source: 'start', target: 'loop', sourceHandle: 'bottom' },
			{ source: 'loop', target: 'if', sourceHandle: 'bottom' },
			{ source: 'if', target: 'a', sourceHandle: 'true' },
			{ source: 'a', target: 'b', sourceHandle: 'bottom' },
		],
	},
};

describe('deleted connector repair', () => {
	it('ignores HTTP requests and workflow triggers', () => {
		const standalone = {
			fromConnector: {
				methods: [
					{
						index: '0',
						name: 'HTTP',
						methodType: 'HTTP_REQUEST',
						request: { endpoint: 'https://example.test', method: 'GET' },
					},
					{ index: '1', name: 'Trigger', methodType: 'WEBHOOK' },
				],
			},
		};
		expect(findDeletedConnectorGroups(standalone, [])).toEqual([]);
	});
	it('lists deleted connectors with their saved titles and invokers', () => {
		expect(
			findDeletedConnectorGroups(payload, replacements).map((group) => [
				group.oldConnectorId,
				group.templateTitle,
				group.invokerName,
			]),
		).toEqual([
			[2, 'Deleted A', 'Invoker'],
			[3, 'Deleted B', 'Invoker'],
		]);
		expect(findDeletedConnectorGroups(payload, [connector(2), connector(3)])).toEqual([]);
	});
	it('replaces connector IDs without changing method data or references', () => {
		const repaired = repairDeletedConnectors(payload, { 2: 20, 3: 30 }, replacements);
		expect(
			repaired.fromConnector.method.map(
				(method: { connector: { connectorId: number } }) => method.connector.connectorId,
			),
		).toEqual([20, 30]);
		expect(repaired.fromConnector.method[0].request.body.fields).toEqual({
			value: reference,
			connectorId: 2,
		});
		expect(repaired.fromConnector.operator[1].expression).toBe(reference);
		expect(repaired.fieldBinding).toEqual(payload.fieldBinding);
		expect(payload.fromConnector.methods[0].connector.connectorId).toBe(2);
	});
	it('keeps nested positions and intentional overlaps after save and reopen', () => {
		const state = mapConnectionToWorkflowState(repairDeletedConnectors(payload, { 2: 20, 3: 30 }, replacements));
		const positions = state.nodes.map((node) => [node.id, node.position]);
		expect(positions).toEqual(payload.ui.workflowNodes.map((node) => [node.id, node.position]));
		expect(
			state.nodes.filter((node) => node.type === 'connector').map((node) => node.data.connector?.connectorId),
		).toEqual([20, 30]);
		const saved = buildConnectionPayload(state);
		expect(findDeletedConnectorGroups(saved, replacements)).toEqual([]);
		expect(mapConnectionToWorkflowState(saved).nodes.map((node) => [node.id, node.position])).toEqual(positions);
	});
	it('recovers metadata removed by the backend from saved UI', () => {
		const missing = structuredClone(payload);
		const withoutConnector = {
			...missing,
			fromConnector: {
				...missing.fromConnector,
				methods: missing.fromConnector.methods.map((method, i) => (i === 0 ? { ...method, connector: null } : method)),
			},
		};
		expect(findDeletedConnectorGroups(withoutConnector, replacements)[0].oldConnectorId).toBe(2);
	});
	it('restores positions by replacement connector when node IDs differ', () => {
		const changed = structuredClone(payload);
		const workflowNodes = changed.ui.workflowNodes.map((node, i) =>
			i === 3 ? { ...node, id: 'old-a', index: undefined, name: 'read' } : node,
		);
		changed.ui.workflowEdges[2].target = 'old-a';
		changed.ui.workflowEdges[3].source = 'old-a';
		const state = mapConnectionToWorkflowState(
			repairDeletedConnectors({ ...changed, ui: { ...changed.ui, workflowNodes } }, { 2: 20, 3: 30 }, replacements),
		);
		expect(state.nodes.find((node) => node.id === 'old-a')?.data.connector?.connectorId).toBe(20);
		expect(state.nodes.find((node) => node.id === 'old-a')?.position).toEqual({
			x: 800,
			y: 410,
		});
	});

	it('groups repeated methods under one deleted connector', () => {
		const repeated = {
			fromConnector: {
				methods: [
					{ name: 'read', index: '0', connector: { connectorId: 2, title: 'Deleted', invoker: 'Invoker' } },
					{ name: 'write', index: '1_0', connector: { connectorId: 2, title: 'Deleted', invoker: 'Invoker' } },
				],
			},
		};
		expect(findDeletedConnectorGroups(repeated, [])).toMatchObject([
			{ oldConnectorId: 2, methodNames: ['read', 'write'] },
		]);
	});
	it('leaves existing connectors unchanged in a mixed workflow', () => {
		const available = [connector(2), connector(30)];
		expect(findDeletedConnectorGroups(payload, available).map((g) => g.oldConnectorId)).toEqual([3]);
		const repaired = repairDeletedConnectors(payload, { 3: 30 }, available);
		expect(
			repaired.fromConnector.method.map((m: { connector: { connectorId: number } }) => m.connector.connectorId),
		).toEqual([2, 30]);
	});
	it('rejects an unavailable replacement without mutating the original', () => {
		const before = structuredClone(payload);
		expect(() => repairDeletedConnectors(payload, { 2: 999 }, replacements)).toThrow(
			'Replacement connector is unavailable',
		);
		expect(payload).toEqual(before);
	});
	it('repairs a workflow without saved canvas data', () => {
		const { ui, ...withoutCanvas } = payload;
		expect(ui.workflowNodes).toHaveLength(5);
		const repaired = repairDeletedConnectors(withoutCanvas, { 2: 20, 3: 30 }, replacements);
		expect(findDeletedConnectorGroups(repaired, replacements)).toEqual([]);
		const state = mapConnectionToWorkflowState(repaired);
		expect(state.nodes).toHaveLength(5);
		expect(state.nodes.every((n) => Number.isFinite(n.position.x) && Number.isFinite(n.position.y))).toBe(true);
	});
	it('does not borrow metadata from an unrelated node with missing identifiers', () => {
		const legacy = {
			fromConnector: { methods: [{ name: 'read', connector: null }] },
			ui: {
				workflowNodes: [
					{
						id: 'unrelated',
						type: 'connector',
						position: { x: 0, y: 0 },
						data: { connector: { connectorId: 99, title: 'Unrelated', invokerName: 'Invoker' } },
					},
				],
			},
		};
		expect(findDeletedConnectorGroups(legacy, [])).toEqual([]);
	});
	it('recovers connector metadata by node ID when indexes are missing', () => {
		const legacy = {
			fromConnector: { methods: [{ id: 'method', name: 'read', connector: null }] },
			ui: {
				workflowNodes: [
					{ id: 'other', type: 'connector', position: { x: 0, y: 0 }, data: { connector: { connectorId: 99 } } },
					{
						id: 'method',
						type: 'connector',
						position: { x: 120, y: 80 },
						data: { connector: { connectorId: 2, title: 'Deleted', invokerName: 'Invoker' } },
					},
				],
			},
		};
		expect(findDeletedConnectorGroups(legacy, [])).toMatchObject([{ oldConnectorId: 2, templateTitle: 'Deleted' }]);
	});
});
