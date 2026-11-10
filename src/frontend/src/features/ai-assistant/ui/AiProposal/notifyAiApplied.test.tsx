import type { ReactElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({ success: vi.fn(), destroy: vi.fn() }));
vi.mock('antd', async (original) => ({ ...(await original<typeof import('antd')>()), message: toast }));
vi.mock('@shared/i18n/config/i18n', () => ({ i18n: { language: 'en', getFixedT: () => (key: string) => key } }));

import { quietly } from '../../editor/tell';
import { notifyAiApplied } from './notifyAiApplied';

const shown = () => toast.success.mock.calls.at(-1)?.[0] as { key: string; content: ReactElement | string };

describe('notifyAiApplied', () => {
	beforeEach(() => vi.clearAllMocks());

	it('says what was applied and undoes it from the toast', () => {
		const onUndo = vi.fn(() => true);
		notifyAiApplied({ key: 'ai-test', undoTestId: 'ai-test-undo', text: '3 fields mapped', onUndo });
		render(shown().content as ReactElement);
		expect(screen.getByText('3 fields mapped', { exact: false })).toBeTruthy();
		fireEvent.click(screen.getByTestId('ai-test-undo'));
		expect(onUndo).toHaveBeenCalledOnce();
		expect(toast.destroy).toHaveBeenCalledWith('ai-test');
		expect(shown()).toMatchObject({ key: 'ai-test', content: 'aiResult.undone' });
	});

	it('claims nothing when there was nothing left to undo', () => {
		notifyAiApplied({ key: 'ai-test', undoTestId: 'ai-test-undo', text: 'Applied', onUndo: () => false });
		render(shown().content as ReactElement);
		fireEvent.click(screen.getByTestId('ai-test-undo'));
		expect(toast.success).toHaveBeenCalledOnce();
	});

	it('shows nothing for a spoken request', async () => {
		await quietly(async () => notifyAiApplied({ key: 'ai-test', undoTestId: 'ai-test-undo', text: 'Applied', onUndo: vi.fn() }));
		expect(toast.success).not.toHaveBeenCalled();
	});
});
