import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { ReferencePathOption } from '../requestReferenceOptions';
import { ReferenceOptionLabel } from './ReferenceOptionLabel';

vi.mock('@shared/i18n/hooks/useI18n', () => ({
	useI18n: () => ({ t: (key: string) => key, lang: 'en' }),
}));

// Exposes the tooltip text on a wrapper so a test can tell which element owns it.
vi.mock('@shared/ui/primitives/Tooltip', () => ({
	Tooltip: ({ content, children }: { content: ReactNode; children?: ReactNode }) => (
		<span data-testid='tooltip' data-tooltip={String(content)}>{children}</span>
	),
}));

const field = (value: string): ReferencePathOption => ({ kind: 'field', label: 'hostname', value });
const operation: ReferencePathOption = {
	kind: 'operation', label: 'Last element of the array', value: 'servers[-1]', syntax: '[-1]',
	description: 'The last element of the array.',
};

describe('ReferenceOptionLabel', () => {
	it('renders a plain field as text with its full label as hover title', () => {
		render(<ReferenceOptionLabel option={field('node.hostname')} />);
		expect(screen.getByText('hostname')).toHaveAttribute('title', 'hostname');
		expect(screen.queryByTestId('tooltip')).toBeNull();
	});

	it('shows an operation syntax tag whose tooltip is the description', () => {
		render(<ReferenceOptionLabel option={operation} />);
		const tag = screen.getByText('[-1]');
		expect(tag.closest('[data-testid="tooltip"]')).toHaveAttribute('data-tooltip', 'The last element of the array.');
	});

	it('marks a list result with a badge tooltip', () => {
		render(<ReferenceOptionLabel option={field('node.*.hostname')} />);
		const badge = screen.getByText('references.listResult');
		expect(badge.closest('[data-testid="tooltip"]')).toHaveAttribute('data-tooltip', 'references.listResultHint');
	});

	it('keeps the native title off the tags so only their tooltip shows', () => {
		render(<ReferenceOptionLabel option={{ ...operation, value: 'servers[*]', syntax: '[*]' }} />);
		expect(screen.getByText('[*]').closest('[title]')).toBeNull();
		expect(screen.getByText('references.listResult').closest('[title]')).toBeNull();
	});
});
