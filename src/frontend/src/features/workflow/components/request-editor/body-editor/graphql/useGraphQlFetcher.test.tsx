import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import type { MethodWithId } from '../../../../types/connection';
import { useGraphQlFetcher } from './useGraphQlFetcher';

const { appDispatch, initiate, confirm, emit, i18n } = vi.hoisted(() => ({
	i18n: { t: (key: string) => key, lang: 'en' },
	appDispatch: vi.fn(),
	initiate: vi.fn((request: unknown, options: unknown) => ({ type: 'testMethod/initiate', request, options })),
	confirm: vi.fn(),
	emit: vi.fn(),
}));

vi.mock('@app/store/store', () => ({ store: { dispatch: appDispatch } }));
vi.mock('../../../../request-playground/model/playgroundApi', () => ({
	playgroundApi: { endpoints: { testMethod: { initiate } } },
}));
vi.mock('@shared/ui/confirm/ConfirmDialogContext', () => ({ useConfirm: () => confirm }));
vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => i18n }));
vi.mock('@shared/errors/api/errorBus', () => ({ errorBus: { emit } }));

const method = {
	id: 'connector-1', name: 'Query', index: '0', methodType: 'CONNECTOR', color: '#C77E7E',
	connector: { connectorId: 1, title: 'fake', icon: null },
	request: { endpoint: '{url}', method: 'POST', header: { Authorization: '{token}' }, body: { fields: { query: '' } } },
	response: { success: { status: '200' }, fail: { status: '401' } },
} as unknown as MethodWithId;

// The method dialog's own store: no API reducer, no auth session.
const dialogStore = configureStore({ reducer: { connection: (state: object = {}) => state } });
const wrapper = ({ children }: { children: ReactNode }) => <Provider store={dialogStore}>{children}</Provider>;

const okResult = (body: unknown) => ({
	data: { request: {}, response: { status: 200, headers: {}, body }, durationMs: 1, connectorErrors: [] },
});

describe('useGraphQlFetcher', () => {
	beforeEach(() => {
		appDispatch.mockReset();
		initiate.mockClear();
		confirm.mockReset();
		emit.mockReset();
	});

	it('sends the method test on the app store even when rendered under the dialog store', async () => {
		appDispatch.mockResolvedValue(okResult({ data: { country: { name: 'Germany' } } }));
		const { result } = renderHook(() => useGraphQlFetcher(method), { wrapper });

		const response = await result.current({ query: 'query Germany { country(code: "DE") { name } }', operationName: 'Germany' });

		expect(appDispatch).toHaveBeenCalledTimes(1);
		expect(initiate).toHaveBeenCalledWith(expect.objectContaining({ confirmWrite: true }), { track: false });
		expect(response).toEqual({ data: { country: { name: 'Germany' } } });
	});

	it('keeps the fetcher stable across method edits and sends the latest method', async () => {
		appDispatch.mockResolvedValue(okResult({ data: {} }));
		const { result, rerender } = renderHook(({ m }) => useGraphQlFetcher(m), { wrapper, initialProps: { m: method } });
		const first = result.current;
		const edited = { ...method, request: { ...method.request, endpoint: '{url}/v2' } } as MethodWithId;

		rerender({ m: edited });
		await result.current({ query: '{ __typename }', operationName: null });

		expect(result.current).toBe(first);
		expect(initiate.mock.calls[0][0]).toMatchObject({ method: { request: { endpoint: '{url}/v2' } } });
	});

	it('sends nothing when the user cancels a mutation', async () => {
		confirm.mockResolvedValue(false);
		const { result } = renderHook(() => useGraphQlFetcher(method), { wrapper });

		const response = await result.current({ query: 'mutation Create { createPost { id } }', operationName: 'Create' });

		expect(appDispatch).not.toHaveBeenCalled();
		expect(response).toEqual({ errors: [{ message: 'graphqlBody.mutationCancelled' }] });
	});

	it('shows the server message and reports an expired session', async () => {
		appDispatch.mockResolvedValue({ error: { status: 401, data: { message: 'Token expired' } } });
		const { result } = renderHook(() => useGraphQlFetcher(method), { wrapper });

		const response = await result.current({ query: '{ __typename }', operationName: null });

		expect(emit).toHaveBeenCalledWith(expect.objectContaining({ type: 'UNAUTHORIZED' }));
		expect(response).toEqual({ errors: [{ message: 'Token expired' }] });
	});
});
