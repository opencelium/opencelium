import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import { KitProvider } from '@app/providers/ui/KitProvider';
import { aiHandlers } from '@/mock/ai/handler';
import { createLegacyStore } from '../../../store';
import type { Connection, MethodWithId } from '../../../types/connection';
import { MethodType } from '../../../types/connection';
import { SuggestedBindings } from './SuggestedBindings';

const server = setupServer(...aiHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const payload = (fields: Record<string, unknown>) => ({
	type: 'object', format: 'json', data: 'raw', fields,
}) as MethodWithId['request']['body'];

const method = (over: Partial<MethodWithId> & { id: string; index: string; color: string }) => ({
	name: over.id, label: over.id, methodType: MethodType.Connector, connector: null,
	request: { requestId: 'r', endpoint: '', method: 'POST', header: {}, body: payload({}) },
	response: {
		responseId: 'p',
		success: { status: '200', header: {}, body: payload({}) },
		fail: { status: '500', header: {}, body: payload({}) },
	},
	...over,
}) as MethodWithId;

const producer = method({
	id: 'a', index: '0', color: '#AABBCC',
	response: {
		responseId: 'p',
		success: { status: '200', header: {}, body: payload({ role: '', department: '' }) },
		fail: { status: '500', header: {}, body: payload({}) },
	},
} as Partial<MethodWithId> & { id: string; index: string; color: string });

const consumer = method({
	id: 'b', index: '1', color: '#DDEEFF',
	request: { requestId: 'r', endpoint: '', method: 'POST', header: {},
		body: payload({ role: '', department: '' }) },
} as Partial<MethodWithId> & { id: string; index: string; color: string });

const connection = {
	connectionId: 1, name: 'c', description: '', fieldBindings: [],
	fromConnector: { connectorId: 1, title: 't', method: [producer, consumer], operator: [] },
	toConnector: null, ui: {},
} as unknown as Connection;

/** The dialog's own per-modal store: only a connection reducer, no RTK Query middleware. */
const renderInLegacyStore = (ui: ReactNode) =>
	render(
		<KitProvider initialSystem='ant'>
			<Provider store={createLegacyStore()}>{ui}</Provider>
		</KitProvider>,
	);

describe('SuggestedBindings', () => {
	it('reaches the API from inside the per-modal legacy store', async () => {
		const syncSource = vi.fn();
		const source = { role: '', department: '' };

		renderInLegacyStore(<SuggestedBindings source={source}
			editor={{ connection, method: consumer, syncSource } as never} />);

		await userEvent.click(screen.getByTestId('workflow-suggestions-generate'));

		// A suggestion row only appears if the request actually left — which it does not
		// when an RTK Query hook is dispatched into a store that has no api reducer.
		await waitFor(() => expect(screen.getByTestId('workflow-suggestion-$.role')).toBeVisible(),
			{ timeout: 5000 });
		expect(screen.getByTestId('workflow-suggestion-$.department')).toBeVisible();
	});

	it('writes the reference through the editor when a suggestion is applied', async () => {
		const syncSource = vi.fn();
		const source = { role: '', department: '' };

		renderInLegacyStore(<SuggestedBindings source={source}
			editor={{ connection, method: consumer, syncSource } as never} />);

		await userEvent.click(screen.getByTestId('workflow-suggestions-generate'));
		await waitFor(() => expect(screen.getByTestId('workflow-suggestion-apply-$.role')).toBeVisible(),
			{ timeout: 5000 });
		await userEvent.click(screen.getByTestId('workflow-suggestion-apply-$.role'));

		expect(syncSource).toHaveBeenCalledWith(expect.objectContaining({
			name: 'role',
			new_value: '#AABBCC.(response).body.$.role',
		}));
	});
});
