import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { useOpenExecutionPlayground } from './useOpenExecutionPlayground';

const mocks = vi.hoisted(() => ({
	load: vi.fn(),
	warning: vi.fn(),
	canUpdate: true,
	route: { key: 'editor', pathname: '/workflow/update/7', search: '' },
}));
vi.mock('react-router-dom', () => ({ useLocation: () => mocks.route }));
vi.mock('antd', () => ({ message: { warning: mocks.warning, error: vi.fn() } }));
vi.mock('@features/auth/useAuth', () => ({ useAuth: () => ({ normalizedUser: { permissions: [] } }) }));
vi.mock('@/engine/policy', () => ({ hasComponentPermission: () => mocks.canUpdate }));
vi.mock('@features/logs', () => ({
	loadLoggedExecution: mocks.load,
	readExecutionPlaygroundSearch: vi.fn(() => null),
}));
vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock('../../api/connectionApi', () => ({ getConnectionById: vi.fn() }));

const location = { indexPath: '1_0', executionId: '9', elementId: 'log', direction: 'source' as const, loopIndex: '2' };
const node = { id: 'step', type: 'system', data: { color: '#112233', subtitle: 'Send' } } as WorkflowNodeModel;
const props = () => ({
	connectionId: '7', readOnly: false, isLoading: false,
	nodes: [node], indexById: new Map([['step', '1_0']]), selectNode: vi.fn(),
});

beforeEach(() => {
	mocks.canUpdate = true;
	mocks.warning.mockClear();
	mocks.load.mockReset().mockResolvedValue({
		location,
		method: { properties: { name: 'Send' }, segment: {} },
	});
});

it('opens from live logs in the existing editor using the selected iteration', async () => {
	const settings = props();
	const { result } = renderHook(() => useOpenExecutionPlayground(settings));
	act(() => result.current.openFromLogs?.(location));
	await waitFor(() => expect(result.current.dialog?.nodeId).toBe('step'));
	expect(mocks.load).toHaveBeenCalledWith(location, null);
	expect(settings.selectNode).toHaveBeenCalledWith('step');
	expect(mocks.route.search).toBe('');
});

it('warns and leaves the Playground closed when the recorded step is missing', async () => {
	const settings = { ...props(), nodes: [] };
	const { result } = renderHook(() => useOpenExecutionPlayground(settings));
	act(() => result.current.openFromLogs?.(location));
	await waitFor(() => expect(mocks.warning).toHaveBeenCalledWith('requestPlayground.execution.stepMismatch'));
	expect(result.current.dialog).toBeNull();
	expect(settings.selectNode).not.toHaveBeenCalled();
});

it('withholds the log action when the workflow cannot be edited', () => {
	mocks.canUpdate = false;
	const { result } = renderHook(() => useOpenExecutionPlayground(props()));
	expect(result.current.openFromLogs).toBeNull();
	expect(mocks.load).not.toHaveBeenCalled();
});
