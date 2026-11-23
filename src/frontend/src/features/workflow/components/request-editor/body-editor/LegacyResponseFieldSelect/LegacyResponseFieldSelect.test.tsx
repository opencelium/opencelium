import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { MethodWithId } from '../../../../types/connection';
import type { ReferencePathFeedback } from '../referenceValidation.utils';
import { useReferenceValidation } from '../useReferenceValidation';
import { LegacyResponseFieldSelect } from './LegacyResponseFieldSelect';

vi.mock('@shared/i18n/hooks/useI18n', () => ({
	useI18n: () => ({ t: (key: string) => key, lang: 'en' }),
}));
vi.mock('@shared/ui/primitives/Tooltip', () => ({
	Tooltip: ({ content, children }: { content: ReactNode; children?: ReactNode }) => (
		<span data-testid='tooltip' data-tooltip={content ? String(content) : ''}>{children}</span>
	),
}));
vi.mock('@shared/ui/actions/CopyButton', () => ({ CopyButton: () => null }));
vi.mock('../useReferenceValidation', () => ({ useReferenceValidation: vi.fn(() => null) }));

const validation = vi.mocked(useReferenceValidation);
const giveFeedback = (feedback: ReferencePathFeedback | null) =>
	validation.mockImplementation(({ isPaused }) => (isPaused ? null : feedback));

// jsdom has no ResizeObserver; antd's virtual option list needs one to mount.
beforeAll(() => {
	vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});

const body = { node: { name: '', object1: { title: '' } } };
const method = { response: { success: { body: { type: 'object', fields: body } } } } as unknown as MethodWithId;

const renderSelect = (value?: string) => render(
	<LegacyResponseFieldSelect method={method} type='body' value={value} onChange={vi.fn()} />,
);

// The picker only opens after a real user interaction (see userInteractionRef).
const openDropdown = () => {
	const input = screen.getByRole('combobox');
	fireEvent.mouseDown(input);
	fireEvent.focus(input);
};

const fieldTooltip = () => document.querySelector('.selectCopyHost > [data-testid="tooltip"]');

describe('LegacyResponseFieldSelect', () => {
	it('groups the options into Operations, then Fields', () => {
		renderSelect('node.');
		openDropdown();
		const headers = Array.from(document.querySelectorAll('.ant-select-item-group')).map((row) => row.textContent);
		expect(headers).toEqual(['references.operationsGroup', 'references.fieldsGroup']);
		expect(screen.getByText('object1')).toBeInTheDocument();
	});

	it('validates the path with the iterators it was given', () => {
		giveFeedback(null);
		render(<LegacyResponseFieldSelect method={method} type='body' value='node.name' iterators={['i']}
			onChange={vi.fn()} />);
		expect(validation).toHaveBeenLastCalledWith(expect.objectContaining({
			method, type: 'body', path: 'node.name', iterators: ['i'], isPaused: false }));
	});

	it('marks the field with the severity the backend reported', () => {
		giveFeedback({ severity: 'warning', message: 'not in sample', hint: "Did you mean 'title'?" });
		renderSelect('node.titel');
		expect(document.querySelector('.ant-select-status-warning')).not.toBeNull();
		expect(fieldTooltip()).not.toHaveAttribute('data-tooltip', '');
	});

	it('marks an error red', () => {
		giveFeedback({ severity: 'error', message: 'unclosed bracket', hint: 'add ]' });
		renderSelect('node[0');
		expect(document.querySelector('.ant-select-status-error')).not.toBeNull();
	});

	it('does not mark a valid path', () => {
		giveFeedback(null);
		renderSelect('node.object1.title');
		expect(document.querySelector('.ant-select-status-warning, .ant-select-status-error')).toBeNull();
		expect(fieldTooltip()).toHaveAttribute('data-tooltip', '');
	});

	it('pauses the check while the user is typing', () => {
		giveFeedback({ severity: 'warning', message: 'not in sample', hint: null });
		renderSelect('node.titel');
		openDropdown();
		expect(validation).toHaveBeenLastCalledWith(expect.objectContaining({ isPaused: true }));
		expect(document.querySelector('.ant-select-status-warning')).toBeNull();
	});

	it('submits on Enter while the options list is closed', () => {
		const onSubmit = vi.fn();
		render(<LegacyResponseFieldSelect method={method} type='body' value='node.name'
			onChange={vi.fn()} onSubmit={onSubmit} />);
		fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it('leaves Enter to the options list while it is open', () => {
		const onSubmit = vi.fn();
		render(<LegacyResponseFieldSelect method={method} type='body' value='node.'
			onChange={vi.fn()} onSubmit={onSubmit} />);
		openDropdown();
		fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('does not submit an empty field', () => {
		const onSubmit = vi.fn();
		render(<LegacyResponseFieldSelect method={method} type='body' onChange={vi.fn()} onSubmit={onSubmit} />);
		fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
		expect(onSubmit).not.toHaveBeenCalled();
	});
});
