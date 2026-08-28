import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { KitProvider } from '@app/providers/ui/KitProvider';
import { notification } from 'antd';
import { notifyReferencesCleared } from './notifyReferencesCleared';

vi.mock('antd', async (importOriginal) => {
	const actual = await importOriginal<typeof import('antd')>();
	return {
		...actual,
		notification: { ...actual.notification, warning: vi.fn(), destroy: vi.fn() },
	};
});

const warning = vi.mocked(notification.warning);
const destroy = vi.mocked(notification.destroy);

const show = (onUndo = vi.fn()) => {
	notifyReferencesCleared({
		title: 'References cleared',
		description: '3 other steps were reading “Get users”.',
		undoLabel: 'Undo',
		onUndo,
	});
	return { onUndo, config: warning.mock.calls[0][0] };
};

beforeEach(() => {
	warning.mockClear();
	destroy.mockClear();
});

describe('notifyReferencesCleared', () => {
	it('shows what was cleared, and stays long enough to be acted on', () => {
		const { config } = show();
		expect(config.message).toBe('References cleared');
		expect(config.duration).toBeGreaterThanOrEqual(10);
	});

	// A second delete should replace the standing offer, not leave the user
	// choosing between two undos that mean different things.
	it('keys every toast the same, so one replaces the other', () => {
		show();
		show();
		expect(warning.mock.calls.map(([config]) => config.key))
			.toEqual([warning.mock.calls[0][0].key, warning.mock.calls[0][0].key]);
	});

	// The Ant kit, because that is what the app mounts and what emits the
	// data-testid the e2e suite targets — the custom kit's Button drops it.
	it('undoes on click and takes the toast away with it', () => {
		const { onUndo, config } = show();
		render(<KitProvider initialSystem='ant'>{config.btn}</KitProvider>);

		fireEvent.click(screen.getByTestId('workflow-references-cleared-undo'));
		expect(onUndo).toHaveBeenCalledTimes(1);
		expect(destroy).toHaveBeenCalledWith(config.key);
	});
});
