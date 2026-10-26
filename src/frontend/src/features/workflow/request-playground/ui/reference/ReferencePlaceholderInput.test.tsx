import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ReferencePlaceholderInput } from './ReferencePlaceholderInput';

vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => ({ t: () => '[set reference]' }) }));

const URL = '/user?test={%#C77E7E.(response).body.$.id%}';

function Harness() {
	const [value, setValue] = useState(URL);
	return <><ReferencePlaceholderInput value={value} testId='field' onChange={setValue} /><output>{value}</output></>;
}

const chip = () => screen.getByTestId('field').querySelector('[data-raw]');

describe('ReferencePlaceholderInput', () => {
	it('brings a clicked reference back when the field is left without typing', () => {
		render(<Harness />);
		fireEvent.mouseDown(chip()!);
		expect(chip()).toBeNull();
		expect(screen.getByRole('status').textContent).toBe('/user?test=');

		fireEvent.blur(screen.getByTestId('field'));
		expect(chip()).not.toBeNull();
		expect(screen.getByRole('status').textContent).toBe(URL);
	});

	it('keeps the reference removed once the user types', () => {
		render(<Harness />);
		fireEvent.mouseDown(chip()!);
		const field = screen.getByTestId('field');
		field.append('42');
		fireEvent.input(field);
		fireEvent.blur(field);
		expect(chip()).toBeNull();
		expect(screen.getByRole('status').textContent).toBe('/user?test=42');
	});
});
