import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { ReferencePathOption } from '../../body-editor/requestReferenceOptions';
import { ReferenceFieldDropdown } from './ReferenceFieldDropdown';

vi.mock('@shared/i18n/hooks/useI18n', () => ({
	useI18n: () => ({ t: (key: string) => key, lang: 'en' }),
}));
vi.mock('@shared/ui/primitives/Tooltip', () => ({
	Tooltip: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

const options: ReferencePathOption[] = [
	{ kind: 'field', label: 'name', value: 'node.name' },
	{ kind: 'operation', label: 'Any property', value: 'node.*', syntax: '*', description: 'Every property.' },
	{ kind: 'field', label: 'object1', value: 'node.object1' },
];

const renderDropdown = (items: ReferencePathOption[], onSelect = vi.fn()) => {
	render(<ReferenceFieldDropdown open position={{ top: 0, left: 0, width: 200 }}
		dropdownRef={{ current: null }} options={items} onSelect={onSelect} />);
	return onSelect;
};

describe('ReferenceFieldDropdown', () => {
	it('renders operations first, then fields, each under its group header', () => {
		renderDropdown(options);
		const rows = Array.from(document.querySelectorAll('.referenceDropdownGroupLabel, .referenceDropdownOption'))
			.map((row) => row.textContent);
		expect(rows).toEqual(['references.operationsGroup', 'Any property*references.listResult',
			'references.fieldsGroup', 'name', 'object1']);
	});

	it('omits the header of an empty group', () => {
		renderDropdown(options.filter(({ kind }) => kind === 'field'));
		expect(screen.queryByText('references.operationsGroup')).toBeNull();
		expect(screen.getByText('references.fieldsGroup')).toBeInTheDocument();
	});

	it('selects the clicked option', () => {
		const onSelect = renderDropdown(options);
		fireEvent.click(screen.getByText('object1'));
		expect(onSelect).toHaveBeenCalledWith(options[2]);
	});
});
