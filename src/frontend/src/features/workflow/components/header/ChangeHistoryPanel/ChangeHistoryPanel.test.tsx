import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

// Provider-free stand-ins: the real primitives need SystemProvider.
vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key, lang: 'en' }) }));
vi.mock('@shared/ui/primitives/Tooltip', () => ({ Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</> }));
vi.mock('@shared/ui/primitives/Icon', () => ({ Icon: ({ name }: { name: string }) => <i data-icon={name} /> }));
vi.mock('@shared/ui/primitives/IconButton', () => ({
	IconButton: ({ onClick, testId }: { onClick?: () => void; testId?: string }) => <button type='button' onClick={onClick} data-testid={testId} />,
}));
vi.mock('@shared/ui/primitives/Checkbox', () => ({
	Checkbox: ({ checked, onChange, testId }: { checked?: boolean; onChange?: (isOn: boolean) => void; testId?: string }) =>
		<input type='checkbox' checked={checked} onChange={(event) => onChange?.(event.target.checked)} data-testid={testId} />,
}));
vi.mock('@shared/ui/primitives/Empty', () => ({ Empty: () => null }));
vi.mock('@features/workflow/components/sidebar/DrawerHeader/DrawerHeader', () => ({ DrawerHeader: () => null }));
import type { WorkflowUndoEntry } from '../../../types/undoHistory.types';
import { ChangeHistoryPanel } from './ChangeHistoryPanel';

const entry = (offset: number, origin: WorkflowUndoEntry['origin']): WorkflowUndoEntry => ({
	offset, origin, at: 0, change: offset === -3 ? { kind: 'initial' } : { kind: 'nodes-added', count: 1, name: `step${offset}` },
});

// Newest first: an AI change undone (redo +1), the current hand edit, an earlier AI change, the session start.
const entries = [entry(1, 'ai'), entry(0, 'user'), entry(-1, 'ai'), entry(-2, 'user'), entry(-3, 'user')];

const renderPanel = (onJumpTo = vi.fn()) => {
	render(<ChangeHistoryPanel open entries={entries} onClose={vi.fn()} onJumpTo={onJumpTo} />);
	return onJumpTo;
};

describe('ChangeHistoryPanel', () => {
	it('marks the AI\'s changes and undoes one by going back to before it', () => {
		const onJumpTo = renderPanel();
		expect(screen.getByTestId('workflow-change-history-ai--1')).toBeTruthy();
		expect(screen.queryByTestId('workflow-change-history-ai-0')).toBeNull();
		fireEvent.click(screen.getByTestId('workflow-change-history-undo--1'));
		expect(onJumpTo).toHaveBeenCalledWith(-2);
	});

	it('offers no Undo for an AI change that is already undone', () => {
		renderPanel();
		expect(screen.getByTestId('workflow-change-history-ai-1')).toBeTruthy();
		expect(screen.queryByTestId('workflow-change-history-undo-1')).toBeNull();
	});

	it('lists only the AI\'s changes when asked', () => {
		renderPanel();
		fireEvent.click(screen.getByTestId('workflow-change-history-ai-only'));
		expect(screen.queryByTestId('workflow-change-history-item-0')).toBeNull();
		expect(screen.getByTestId('workflow-change-history-item--1')).toBeTruthy();
		expect(screen.getByTestId('workflow-change-history-item-1')).toBeTruthy();
	});
});
