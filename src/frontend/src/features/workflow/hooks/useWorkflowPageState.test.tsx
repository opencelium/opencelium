import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWorkflowPageState } from './useWorkflowPageState';

const mocks = vi.hoisted(() => ({
	load: vi.fn(), refetch: vi.fn(), setGraph: vi.fn(), markDirty: vi.fn(),
	query: { data: [{ connectorId: 10, title: 'Existing', invoker: { name: 'API' } }], isLoading: false, isFetching: false, isError: false },
}));
vi.mock('../api/connectionService', () => ({ loadWorkflowConnectionData: mocks.load }));
vi.mock('@entities/connector/api/connectorApi', () => ({ useGetConnectorsQuery: () => ({ ...mocks.query, refetch: mocks.refetch }) }));
vi.mock('@entities/invoker/api/invokerApi', () => ({ useGetInvokersQuery: () => ({ data: [] }) }));
vi.mock('@entities/auth/model/authSelectors', () => ({ selectAuthUser: vi.fn() }));
vi.mock('@shared/lib/storeHooks', () => ({ useAppSelector: () => null }));
vi.mock('@shared/ui/confirm/ConfirmDialogContext', () => ({ useConfirm: () => vi.fn() }));
vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock('./useWorkflowPage', () => ({ useWorkflowPage: () => ({ nodes: [], edges: [], setWorkflowGraph: mocks.setGraph }) }));
vi.mock('./useWorkflowViewData', () => ({ useWorkflowViewData: () => ({ hydratedNodes: [], currentSnapshot: '{}' }) }));
vi.mock('./useWorkflowDerivedData', () => ({ useWorkflowDerivedData: () => ({}) }));
vi.mock('./simulatedWorkflowGraph', () => ({ useSimulatedWorkflowGraph: () => {} }));
vi.mock('./useWorkflowChangeTracking', () => ({ useWorkflowChangeTracking: () => ({
	markDirty: mocks.markDirty, setBaselineSnapshot: vi.fn(), setChangeSource: vi.fn(), setHistoryPreviewSnapshot: vi.fn(),
}) }));

const usePage = () => useWorkflowPageState({ connectionId: '1', readOnly: false, leaveConfirmMessage: '' });
beforeEach(() => {
	vi.clearAllMocks();
	mocks.query.isError = false;
	mocks.query.isFetching = false;
	mocks.query.isLoading = false;
	mocks.load.mockResolvedValue({ payload: { title: 'Workflow', fromConnector: { methods: [
		{ index: '0', name: 'read', connector: { connectorId: 10, title: 'Existing', invoker: 'API' } },
	] } }, versions: [] });
});

describe('workflow page loading', () => {
	it('does not open a cached workflow before the connector refresh finishes', async () => {
		mocks.query.isFetching = true;
		const { result, rerender } = renderHook(usePage);
		await act(async () => {});
		expect(result.current.isLoading).toBe(true);
		expect(mocks.setGraph).not.toHaveBeenCalled();
		mocks.query.isFetching = false;
		rerender();
		await waitFor(() => expect(mocks.setGraph).toHaveBeenCalledOnce());
		expect(result.current.isLoading).toBe(false);
	});
	it('blocks the editor when the connector request fails despite cached data', async () => {
		mocks.query.isError = true;
		const { result } = renderHook(usePage);
		await act(async () => {});
		expect(result.current.connection.loadFailed).toBe(true);
		expect(result.current.isLoading).toBe(true);
		expect(mocks.setGraph).not.toHaveBeenCalled();
	});
	it('keeps the replacement dialog open during a connector refresh', async () => {
		mocks.load.mockResolvedValue({ payload: { title: 'Broken', fromConnector: { methods: [
			{ index: '0', name: 'read', connector: { connectorId: 2, invoker: 'API' } },
		] } }, versions: [] });
		const { result, rerender } = renderHook(usePage);
		await waitFor(() => expect(result.current.connection.mappingGroups).toHaveLength(1));
		mocks.query.isFetching = true;
		rerender();
		expect(result.current.connection.mappingGroups).toHaveLength(1);
		act(() => result.current.connection.confirmRepair({ 2: 10 }));
		expect(mocks.setGraph).not.toHaveBeenCalled();
		mocks.query.isFetching = false;
		rerender();
		act(() => result.current.connection.confirmRepair({ 2: 10 }));
		expect(mocks.setGraph).toHaveBeenCalledOnce();
	});
	it('retries both the workflow and connector requests', async () => {
		mocks.query.isError = true;
		const { result, rerender } = renderHook(usePage);
		await act(async () => {});
		act(() => result.current.retryLoad());
		expect(mocks.refetch).toHaveBeenCalledOnce();
		await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
		mocks.query.isError = false;
		rerender();
		await waitFor(() => expect(mocks.setGraph).toHaveBeenCalledOnce());
		expect(result.current.connection.loadFailed).toBe(false);
	});
});
