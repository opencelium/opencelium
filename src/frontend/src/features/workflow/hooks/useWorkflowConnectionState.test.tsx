import { act, renderHook, waitFor } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Connector } from '@entities/connector/model/types';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { useWorkflowConnectionState } from './useWorkflowConnectionState';
const load = vi.hoisted(() => vi.fn());
vi.mock('../api/connectionService', () => ({
	loadWorkflowConnectionData: load,
}));
const connectors = [{ connectorId: 10, title: 'Existing', invoker: { name: 'API' } }] as Connector[];
const payload = (id: number) => ({
	title: 'Test',
	fromConnector: {
		methods: [
			{
				index: '0',
				name: 'read',
				connector: { connectorId: id, title: 'Original', invoker: 'API' },
			},
		],
	},
});

function setup(available?: Connector[], failed = false) {
	const apply = vi.fn();
	const hook = renderHook(
		({ available, failed }) => {
			const state = useWorkflowConnectionState('1', available, failed);
			const { applyConnectionRef } = state;
			useLayoutEffect(() => {
				applyConnectionRef.current = apply;
			}, [applyConnectionRef]);
			return state;
		},
		{ initialProps: { available, failed } },
	);
	return { ...hook, apply };
}

describe('useWorkflowConnectionState', () => {
	it('waits for connectors before opening an intact workflow', async () => {
		load.mockResolvedValue({ payload: payload(10), versions: [] });
		const { result, rerender, apply } = setup();
		await waitFor(() => expect(load).toHaveBeenCalled());
		expect(apply).not.toHaveBeenCalled();
		rerender({ available: connectors, failed: false });
		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.mappingGroups).toEqual([]);
		expect(apply).toHaveBeenCalledTimes(1);
		expect(result.current.repairAppliedRef.current).toBeNull();
	});
	it('opens the canvas only after a valid replacement is selected', async () => {
		load.mockResolvedValue({ payload: payload(2), versions: [] });
		const { result, apply } = setup(connectors);
		await waitFor(() => expect(result.current.mappingGroups).toHaveLength(1));
		expect(result.current.isLoading).toBe(true);
		expect(apply).not.toHaveBeenCalled();
		const markDirty = vi.fn();
		result.current.repairAppliedRef.current = markDirty;
		act(() => result.current.confirmRepair({}));
		expect(apply).not.toHaveBeenCalled();
		const created = { ...connectors[0], connectorId: 99 };
		act(() => result.current.confirmRepair({ 2: 99 }, [created]));
		expect(result.current.isLoading).toBe(false);
		expect(markDirty).toHaveBeenCalledOnce();
		expect(
			apply.mock.calls[0][0].nodes.find((node: WorkflowNodeModel) => node.type === 'connector').data.connector
				.connectorId,
		).toBe(99);
	});

	it('keeps the canvas closed when no connectors exist', async () => {
		load.mockResolvedValue({ payload: payload(2), versions: [] });
		const { result, apply } = setup([]);
		await waitFor(() => expect(result.current.mappingGroups).toHaveLength(1));
		act(() => result.current.confirmRepair({ 2: 10 }));
		expect(apply).not.toHaveBeenCalled();
		expect(result.current.isLoading).toBe(true);
	});
	it('rejects a replacement removed from the refreshed connector list', async () => {
		load.mockResolvedValue({ payload: payload(2), versions: [] });
		const { result, rerender, apply } = setup(connectors);
		await waitFor(() => expect(result.current.mappingGroups).toHaveLength(1));
		rerender({ available: [], failed: false });
		act(() => result.current.confirmRepair({ 2: 10 }));
		expect(apply).not.toHaveBeenCalled();
		expect(result.current.mappingGroups).toHaveLength(1);
	});
	it('ignores a late load response after unmount', async () => {
		let resolve!: (data: { payload: ReturnType<typeof payload>; versions: [] }) => void;
		load.mockReturnValueOnce(
			new Promise((r) => {
				resolve = r;
			}),
		);
		const { unmount, apply } = setup(connectors);
		unmount();
		await act(async () => {
			resolve({ payload: payload(10), versions: [] });
		});
		expect(apply).not.toHaveBeenCalled();
	});
	it('applies a repair only once', async () => {
		load.mockResolvedValue({ payload: payload(2), versions: [] });
		const { result, apply } = setup(connectors);
		await waitFor(() => expect(result.current.mappingGroups).toHaveLength(1));
		act(() => result.current.confirmRepair({ 2: 10 }));
		act(() => result.current.confirmRepair({ 2: 10 }));
		expect(apply).toHaveBeenCalledOnce();
	});
 it('reports a workflow load failure without opening the canvas', async () => {
  load.mockRejectedValueOnce(new Error('Network error'));
  const { result, apply } = setup(connectors);
  await waitFor(() => expect(result.current.loadFailed).toBe(true));
  expect(result.current.isLoading).toBe(false);
  expect(result.current.mappingGroups).toEqual([]);
  expect(apply).not.toHaveBeenCalled();
 });
 it('can reload after a failed request', async () => {
  load.mockRejectedValueOnce(new Error('Network error'));
  const { result, apply } = setup(connectors);
  await waitFor(() => expect(result.current.loadFailed).toBe(true));
  load.mockResolvedValueOnce({ payload: payload(10), versions: [] });
  act(() => result.current.retryLoad());
  await waitFor(() => expect(apply).toHaveBeenCalledOnce());
  expect(result.current.loadFailed).toBe(false);
  expect(result.current.isLoading).toBe(false);
 });
 it('does not treat a failed connector request as an empty list or use cached connectors', async () => {
  load.mockResolvedValueOnce({ payload: payload(10), versions: [] });
  const { result, apply, rerender } = setup(connectors, true);
  await act(async () => {});
  expect(result.current.loadFailed).toBe(true);
  expect(apply).not.toHaveBeenCalled();
  expect(result.current.mappingGroups).toEqual([]);
  rerender({ available: connectors, failed: false });
  await waitFor(() => expect(apply).toHaveBeenCalledOnce());
  expect(result.current.loadFailed).toBe(false);
 });
 it('blocks repair while the connector request has failed and resumes after recovery', async () => {
  load.mockResolvedValueOnce({ payload: payload(2), versions: [] });
  const { result, apply, rerender } = setup(connectors, true);
  await act(async () => {});
  act(() => result.current.confirmRepair({ 2: 10 }));
  expect(apply).not.toHaveBeenCalled();
  rerender({ available: connectors, failed: false });
  await waitFor(() => expect(result.current.mappingGroups).toHaveLength(1));
  act(() => result.current.confirmRepair({ 2: 10 }));
  expect(apply).toHaveBeenCalledOnce();
 });
 it('rejects a replacement with a different invoker', async () => {
  load.mockResolvedValueOnce({ payload: payload(2), versions: [] });
  const wrong = { ...connectors[0], invoker: { name: 'Other' } } as Connector;
  const { result, apply } = setup([wrong]);
  await waitFor(() => expect(result.current.mappingGroups).toHaveLength(1));
  act(() => result.current.confirmRepair({ 2: 10 }));
  expect(apply).not.toHaveBeenCalled();
  expect(result.current.isLoading).toBe(true);
 });
 it('ignores a rejected request after unmount', async () => {
  let reject!: (error: Error) => void;
  load.mockReturnValueOnce(new Promise((_, r) => { reject = r; }));
  const { unmount, apply } = setup(connectors);
  unmount();
  await act(async () => { reject(new Error('Late error')); });
  expect(apply).not.toHaveBeenCalled();
 });

});
