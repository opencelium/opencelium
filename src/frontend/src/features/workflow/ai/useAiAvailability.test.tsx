import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { store } from '@app/store/store';
import { baseApi } from '@shared/api/baseApi';
import { useAiAvailability } from './useAiAvailability';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
	// Order matters. Vitest runs afterEach LIFO, so this hook goes before the global
	// cleanup() in test/setup.ts — resetting the cache with the hook still mounted makes
	// that subscriber refetch against handlers that are about to be torn down.
	cleanup();
	// The probe is a void-arg query, so one cache entry is shared by every consumer for the
	// whole session. Without this reset the first test's answer would be the only one read.
	store.dispatch(baseApi.util.resetApiState());
	server.resetHandlers();
});
afterAll(() => server.close());

const wrapper = ({ children }: { children: ReactNode }) =>
	<Provider store={store}>{children}</Provider>;

const probed = async (respond: Parameters<typeof http.get>[1]) => {
	server.use(http.get('*/ai/availability', respond));
	const { result } = renderHook(() => useAiAvailability(), { wrapper });
	await waitFor(() => expect(result.current.availability.status).not.toBe('checking'));
	return result;
};

describe('useAiAvailability', () => {
	it('grants both capabilities when a model is configured', async () => {
		const result = await probed(() =>
			HttpResponse.json({ available: true, provider: 'gemini · test' }));

		expect(result.current.availability).toEqual({ status: 'available', provider: 'gemini · test' });
		expect(result.current.canSuggestMappings).toBe(true);
		expect(result.current.canWriteScript).toBe(true);
		expect(result.current.isUnavailable).toBe(false);
	});

	// The point of the whole feature: the suggester's precedent and name-match tiers are
	// computed server-side without a model, so losing the model must not disable the panel.
	it('keeps mapping suggestions but not script writing when no model is configured', async () => {
		const result = await probed(() => HttpResponse.json({ available: false }));

		expect(result.current.availability.status).toBe('no-model');
		expect(result.current.canSuggestMappings).toBe(true);
		expect(result.current.canWriteScript).toBe(false);
		expect(result.current.isUnavailable).toBe(true);
	});

	it('withdraws both capabilities when the backend serves no AI routes', async () => {
		const result = await probed(() => new HttpResponse(null, { status: 404 }));

		expect(result.current.availability.status).toBe('unreachable');
		expect(result.current.canSuggestMappings).toBe(false);
		expect(result.current.canWriteScript).toBe(false);
		expect(result.current.isUnavailable).toBe(true);
	});

	it('offers nothing while the probe is still in flight', () => {
		server.use(http.get('*/ai/availability', () =>
			HttpResponse.json({ available: true, provider: 'gemini · test' })));
		const { result } = renderHook(() => useAiAvailability(), { wrapper });

		// A request fired at a route that turns out not to exist is the 404 toast this hook
		// exists to prevent, so nothing is offered until the answer is in.
		expect(result.current.availability.status).toBe('checking');
		expect(result.current.canSuggestMappings).toBe(false);
		expect(result.current.canWriteScript).toBe(false);
		// ...but no warning is shown for a question that has not been answered yet.
		expect(result.current.isUnavailable).toBe(false);
	});
});
