import { useLayoutEffect, useState } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Connector } from '@entities/connector/model/types';
import { mapConnectionToWorkflowState, type WorkflowConnectionState } from '../api/connectionMapper';
import { buildConnectionPayload } from '../api/connectionPayload';
import { testConnectionExecution } from '../api/connectionApi';
import { saveWorkflowConnection } from '../api/connectionService';
import { useWorkflowConnectionState } from './useWorkflowConnectionState';
import { useWorkflowChangeTracking } from './useWorkflowChangeTracking';

const transport = vi.hoisted(() => vi.fn());
vi.mock('@shared/api/apiFetch', () => ({ apiFetchWithHeaders: transport }));
vi.mock('./useUnsavedChangesGuard', () => ({ useUnsavedChangesGuard: () => {} }));

const connectors = [
	{ connectorId: 20, title: 'Replacement A', invoker: { name: 'A' } },
	{ connectorId: 30, title: 'Replacement B', invoker: { name: 'B' } },
] as Connector[];
const reference = '#AABBCC.(response).success.$.value';

const positions = (nodes: WorkflowConnectionState['nodes']) =>
	nodes.map(({ id, position }) => [id, position]).sort((a, b) => String(a[0]).localeCompare(String(b[0])));

const connectorIds = (methods: { connector?: { connectorId: number } | null }[]) =>
	methods.map((method) => method.connector?.connectorId);

function brokenWorkflow() {
	const initial = mapConnectionToWorkflowState({
		title: 'Repair integration',
		fromConnector: {
			methods: [
				{
					index: '0_0_0',
					name: 'read',
					color: '#AABBCC',
					connector: { connectorId: 2, title: 'Deleted A', invoker: 'A' },
					request: {
						endpoint: '/read',
						method: 'GET',
						header: {},
						body: { fields: {} },
					},
				},
				{
					index: '0_0_1',
					name: 'write',
					color: '#DDEEFF',
					connector: { connectorId: 3, title: 'Deleted B', invoker: 'B' },
					request: {
						endpoint: '/write',
						method: 'POST',
						header: {},
						body: { fields: { value: reference } },
					},
				},
			],
			operators: [
				{ index: '0', type: 'loop', iterator: reference },
				{ index: '0_0', type: 'if', expression: reference },
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
	});
	initial.nodes = initial.nodes.map((node, i) => ({
		...node,
		position: { x: 50 + i * 173, y: 120 + i * 97 },
	}));
	return buildConnectionPayload({ ...initial, connectionId: '42' });
}
function useEditor() {
	const [graph, setGraph] = useState<WorkflowConnectionState | null>(null);
	const connection = useWorkflowConnectionState('42', connectors);
	const changes = useWorkflowChangeTracking({
		currentSnapshot: JSON.stringify(graph),
		isLoading: connection.isLoading,
		readOnly: false,
		leaveConfirmMessage: 'Unsaved',
	});
	const { applyConnectionRef, repairAppliedRef } = connection;
	useLayoutEffect(() => {
		applyConnectionRef.current = setGraph;
		repairAppliedRef.current = changes.markDirty;
	}, [applyConnectionRef, repairAppliedRef, changes.markDirty]);
	return { connection, changes, graph };
}

let persisted: ReturnType<typeof brokenWorkflow>;
beforeEach(() => {
	window.localStorage.clear();
	transport.mockReset();
	persisted = brokenWorkflow();
	transport.mockImplementation(async (url: string, options?: { method?: string; body?: typeof persisted }) => {
		if (options?.method === 'PUT') {
			persisted = structuredClone(options.body!);
			return { data: { connectionId: 42 } };
		}
		if (url.includes('/execution/test')) return { data: { schedulerId: 123 } };
		if (url.includes('version')) return { data: [] };
		return { data: structuredClone(persisted) };
	});
});

describe('workflow connector repair', () => {
	it('keeps nested node positions when two connectors share a replacement', async () => {
		const raw = structuredClone(persisted);
		raw.ui = {
			...raw.ui,
			workflowNodes: [],
			workflowEdges: [],
			flowcharts: [],
			flowchartEdges: [],
		};
		const method = raw.fromConnector.methods[0];
		raw.fromConnector.methods = ['0', '1_0', '1_1_0_0', '1_1_0_1', '2'].map((index, i) => ({
			...structuredClone(method),
			id: `method-${i}`,
			index,
			color: `#${String(i + 1).repeat(6)}`,
			connector: {
				connectorId: i % 2 ? 3 : 2,
				title: i % 2 ? 'Deleted B' : 'Deleted A',
				invoker: 'A',
				icon: null,
			},
		}));
		raw.fromConnector.operators = [
			{ id: 'outer-loop', index: '1', type: 'loop', iterator: reference, expression: reference, dataAggregator: null },
			{ id: 'nested-if', index: '1_1', type: 'if', expression: reference, dataAggregator: null },
			{
				id: 'inner-loop',
				index: '1_1_0',
				type: 'loop',
				iterator: reference,
				expression: reference,
				dataAggregator: null,
			},
		];
		const graph = mapConnectionToWorkflowState(raw);
		expect(graph.nodes).toHaveLength(9);
		graph.nodes = graph.nodes.map((node, i) => ({
			...node,
			position: { x: 83 + i * 137, y: 91 + (i % 4) * 149 },
		}));
		persisted = buildConnectionPayload({ ...graph, connectionId: '42' });
		const savedGraph = mapConnectionToWorkflowState(persisted);
		const expected = positions(graph.nodes);
		const editor = renderHook(useEditor);
		await waitFor(() => expect(editor.result.current.connection.mappingGroups).toHaveLength(2));
		act(() => editor.result.current.connection.confirmRepair({ 2: 20, 3: 20 }));
		const repaired = editor.result.current.graph!;
		expect(positions(repaired.nodes)).toEqual(expected);
		expect(repaired.edges).toEqual(savedGraph.edges);
		expect(repaired.fieldBindings).toEqual(savedGraph.fieldBindings);
		expect(repaired.nodes.map((node) => node.data.conditionConfig)).toEqual(
			savedGraph.nodes.map((node) => node.data.conditionConfig),
		);
		await act(async () => {
			await saveWorkflowConnection({ ...repaired, connectionId: '42' });
		});
		expect(connectorIds(persisted.fromConnector.methods)).toEqual([20, 20, 20, 20, 20]);
		editor.unmount();
		window.localStorage.clear();
		const reopened = renderHook(useEditor);
		await waitFor(() => expect(reopened.result.current.connection.isLoading).toBe(false));
		expect(reopened.result.current.connection.mappingGroups).toEqual([]);
		expect(positions(reopened.result.current.graph!.nodes)).toEqual(expected);
		expect(reopened.result.current.graph!.edges).toEqual(savedGraph.edges);
	});
	it('saves the repair only on demand and reopens without the dialog', async () => {
		const before = mapConnectionToWorkflowState(persisted);
		const { result, unmount } = renderHook(useEditor);
		await waitFor(() => expect(result.current.connection.mappingGroups).toHaveLength(2));
		expect(result.current.graph).toBeNull();
		expect(result.current.changes.hasChanges).toBe(false);
		act(() => result.current.connection.confirmRepair({ 2: 20 }));
		act(() => result.current.connection.confirmRepair({ 2: 999, 3: 30 }));
		expect(result.current.graph).toBeNull();
		expect(transport.mock.calls.every(([, options]) => !options?.method)).toBe(true);
		act(() => result.current.connection.confirmRepair({ 2: 20, 3: 30 }));
		expect(result.current.connection.isLoading).toBe(false);
		expect(result.current.changes.hasManualChanges).toBe(true);
		const repaired = result.current.graph!;
		expect(positions(repaired.nodes)).toEqual(positions(before.nodes));
		expect(repaired.nodes.map((node) => node.data.methodConfig)).toEqual(
			before.nodes.map((node) => node.data.methodConfig),
		);
		expect(repaired.nodes.map((node) => node.data.conditionConfig)).toEqual(
			before.nodes.map((node) => node.data.conditionConfig),
		);
		expect(repaired.fieldBindings).toEqual(before.fieldBindings);
		expect(transport.mock.calls.every(([, options]) => !options?.method)).toBe(true);
		await act(async () => {
			await saveWorkflowConnection({ ...repaired, connectionId: '42' });
		});
		expect(transport.mock.calls.filter(([, options]) => options?.method === 'PUT')).toHaveLength(1);
		expect(connectorIds(persisted.fromConnector.methods)).toEqual([20, 30]);
		act(() => result.current.changes.setBaselineSnapshot(JSON.stringify(repaired)));
		expect(result.current.changes.hasChanges).toBe(false);
		unmount();
		window.localStorage.clear();
		const reopened = renderHook(useEditor);
		await waitFor(() => expect(reopened.result.current.connection.isLoading).toBe(false));
		expect(reopened.result.current.connection.mappingGroups).toEqual([]);
		expect(reopened.result.current.changes.hasChanges).toBe(false);
		expect(positions(reopened.result.current.graph!.nodes)).toEqual(positions(repaired.nodes));
	});
	it('uses replacement connectors in the execution payload', async () => {
		const { result } = renderHook(useEditor);
		await waitFor(() => expect(result.current.connection.mappingGroups).toHaveLength(2));
		act(() => result.current.connection.confirmRepair({ 2: 20, 3: 30 }));
		const executionPayload = buildConnectionPayload({
			...result.current.graph!,
			connectionId: '42',
		});
		const original = structuredClone(persisted);
		const response = await testConnectionExecution(executionPayload, 'qa-repair');
		expect(response.data?.schedulerId).toBe(123);
		const execution = transport.mock.calls.find(([url]) => url.includes('/execution/test'));
		expect(execution?.[1]?.method).toBe('POST');
		expect(connectorIds(execution![1].body.fromConnector.methods)).toEqual([20, 30]);
		expect(execution?.[1]?.body.fromConnector.operators).toEqual(executionPayload.fromConnector.operators);
		expect(execution?.[1]?.body.fieldBinding).toEqual(executionPayload.fieldBinding);
		expect(persisted).toEqual(original);
	});
	it('leaves the stored workflow unchanged on cancel', async () => {
		const original = structuredClone(persisted);
		const editor = renderHook(useEditor);
		await waitFor(() => expect(editor.result.current.connection.mappingGroups).toHaveLength(2));
		editor.unmount();
		expect(persisted).toEqual(original);
		expect(transport.mock.calls.every(([, options]) => !options?.method)).toBe(true);
	});
	it('keeps the repair dirty and the stored workflow unchanged when saving fails', async () => {
		const original = structuredClone(persisted);
		const { result } = renderHook(useEditor);
		await waitFor(() => expect(result.current.connection.mappingGroups).toHaveLength(2));
		act(() => result.current.connection.confirmRepair({ 2: 20, 3: 30 }));
		transport.mockRejectedValueOnce(new Error('Save failed'));
		await act(async () => {
			await expect(saveWorkflowConnection({ ...result.current.graph!, connectionId: '42' })).rejects.toThrow(
				'Save failed',
			);
		});
		expect(persisted).toEqual(original);
		expect(result.current.changes.hasChanges).toBe(true);
		expect(
			result.current.graph!.nodes.filter((n) => n.type === 'connector').map((n) => n.data.connector?.connectorId),
		).toEqual([20, 30]);
	});
});
