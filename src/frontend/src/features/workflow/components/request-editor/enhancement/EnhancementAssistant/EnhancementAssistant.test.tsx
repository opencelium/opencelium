import type { ReactNode } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { setupServer } from 'msw/node';
import { KitProvider } from '@app/providers/ui/KitProvider';
import { aiHandlers } from '@/mock/ai/handler';
import { createLegacyStore } from '../../../../store';
import { Language, type Connection, type Enhancement } from '../../../../types/connection';
import { EnhancementAssistant } from './EnhancementAssistant';

const server = setupServer(...aiHandlers);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const enhancement = (script: string, args: Record<string, string>): Enhancement => ({
	enhanceId: 'e1', language: Language.JavaScript, script,
	args: { RESULT_VAR: '#DDEEFF.(request).body.$.fullName', ...args },
});

const connection = {
	connectionId: 1, name: 'c', description: '', fieldBindings: [],
	fromConnector: { connectorId: 1, title: 't', operator: [], method: [
		{ id: 'a', index: '0', color: '#AABBCC', name: 'GetAllUser', label: 'GetAllUser' },
	] },
	toConnector: null, ui: {},
} as unknown as Connection;

/** The editors' own per-modal store: connection reducer only, no RTK Query middleware. */
const renderInLegacyStore = (ui: ReactNode) =>
	render(
		<KitProvider initialSystem='ant'>
			<Provider store={createLegacyStore()}>{ui}</Provider>
		</KitProvider>,
	);

describe('EnhancementAssistant', () => {
	it('proposes a generated script without writing it into the editor', async () => {
		const onApplyScript = vi.fn();
		renderInLegacyStore(<EnhancementAssistant connection={connection}
			enhancement={enhancement('RESULT_VAR = VAR_0', {
				VAR_0: '#AABBCC.(response).body.$.firstName',
				VAR_1: '#AABBCC.(response).body.$.lastName',
			})}
			onApplyScript={onApplyScript} />);

		await userEvent.type(screen.getByTestId('workflow-enhancement-assistant-input'),
			'join first and last name');
		await userEvent.click(screen.getByTestId('workflow-enhancement-assistant-generate'));

		await waitFor(() => expect(
			screen.getByTestId('workflow-enhancement-assistant-proposal')).toBeVisible(),
		{ timeout: 5000 });
		// Proposed only — the editor is untouched until the user accepts.
		expect(onApplyScript).not.toHaveBeenCalled();
		expect(screen.getByText("RESULT_VAR = VAR_0 + ' ' + VAR_1")).toBeVisible();

		await userEvent.click(screen.getByTestId('workflow-enhancement-assistant-apply'));
		expect(onApplyScript).toHaveBeenCalledWith("RESULT_VAR = VAR_0 + ' ' + VAR_1");
	});

	it('discards a proposal without touching the editor', async () => {
		const onApplyScript = vi.fn();
		renderInLegacyStore(<EnhancementAssistant connection={connection}
			enhancement={enhancement('RESULT_VAR = VAR_0',
				{ VAR_0: '#AABBCC.(response).body.$.name' })}
			onApplyScript={onApplyScript} />);

		await userEvent.type(screen.getByTestId('workflow-enhancement-assistant-input'), 'trim it');
		await userEvent.click(screen.getByTestId('workflow-enhancement-assistant-generate'));
		await waitFor(() => expect(
			screen.getByTestId('workflow-enhancement-assistant-proposal')).toBeVisible(),
		{ timeout: 5000 });

		await userEvent.click(screen.getByTestId('workflow-enhancement-assistant-discard'));

		expect(screen.queryByTestId('workflow-enhancement-assistant-proposal')).toBeNull();
		expect(onApplyScript).not.toHaveBeenCalled();
	});

	it('offers a repair only for a script that names a missing input', async () => {
		const healthy = enhancement('RESULT_VAR = VAR_0',
			{ VAR_0: '#AABBCC.(response).body.$.name' });
		const { unmount } = renderInLegacyStore(
			<EnhancementAssistant connection={connection} enhancement={healthy}
				onApplyScript={vi.fn()} />);
		expect(screen.queryByTestId('workflow-enhancement-assistant-repair')).toBeNull();
		unmount();

		const onApplyScript = vi.fn();
		renderInLegacyStore(<EnhancementAssistant connection={connection}
			enhancement={enhancement('RESULT_VAR = VARIABLE_NOT_EXIST.trim()',
				{ VAR_0: '#AABBCC.(response).body.$.name' })}
			onApplyScript={onApplyScript} />);

		await userEvent.click(screen.getByTestId('workflow-enhancement-assistant-repair'));
		await waitFor(() => expect(
			screen.getByText('RESULT_VAR = VAR_0.trim()')).toBeVisible(), { timeout: 5000 });

		await userEvent.click(screen.getByTestId('workflow-enhancement-assistant-apply'));
		expect(onApplyScript).toHaveBeenCalledWith('RESULT_VAR = VAR_0.trim()');
	});
});
