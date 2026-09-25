import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { KitProvider } from '@app/providers/ui/KitProvider';
import { LoopIterationInput } from './LoopIterationInput';

// The primitives dispatch on the active kit, so they need the system context
// the app mounts around everything (see AppProviders).
const withKit = (ui: ReactNode) => <KitProvider initialSystem='custom'>{ui}</KitProvider>;

const renderInput = (value: number) => {
	const onJump = vi.fn();
	render(withKit(<LoopIterationInput value={value} onJump={onJump} testId='iteration-input' />));
	return { onJump, input: screen.getByTestId('iteration-input') as HTMLInputElement };
};

describe('LoopIterationInput', () => {
	it('jumps to a target ahead of the current iteration', () => {
		const { onJump, input } = renderInput(3);

		fireEvent.change(input, { target: { value: '9' } });
		fireEvent.blur(input);

		expect(onJump).toHaveBeenCalledWith(9);
	});

	// The replay discards each line as it applies it, so there is nothing behind
	// the current iteration to go back to.
	it('ignores a target at or behind the current iteration and restores the display', () => {
		const { onJump, input } = renderInput(3);

		fireEvent.change(input, { target: { value: '2' } });
		fireEvent.blur(input);
		expect(onJump).not.toHaveBeenCalled();
		expect(input.value).toBe('3');

		fireEvent.change(input, { target: { value: '3' } });
		fireEvent.blur(input);
		expect(onJump).not.toHaveBeenCalled();
	});

	it('ignores an empty or non-numeric draft', () => {
		const { onJump, input } = renderInput(3);

		fireEvent.change(input, { target: { value: '' } });
		fireEvent.blur(input);

		expect(onJump).not.toHaveBeenCalled();
		expect(input.value).toBe('3');
	});

	it('follows the live counter again once the draft is committed', () => {
		const onJump = vi.fn();
		const { rerender } = render(withKit(<LoopIterationInput value={3} onJump={onJump} testId='iteration-input' />));
		const input = screen.getByTestId('iteration-input') as HTMLInputElement;

		fireEvent.change(input, { target: { value: '9' } });
		expect(input.value).toBe('9');

		fireEvent.blur(input);
		rerender(withKit(<LoopIterationInput value={9} onJump={onJump} testId='iteration-input' />));
		expect(input.value).toBe('9');

		rerender(withKit(<LoopIterationInput value={10} onJump={onJump} testId='iteration-input' />));
		expect(input.value).toBe('10');
	});

	it('abandons the draft on Escape', () => {
		const { onJump, input } = renderInput(3);

		fireEvent.change(input, { target: { value: '9' } });
		fireEvent.keyDown(input, { key: 'Escape' });
		fireEvent.blur(input);

		expect(onJump).not.toHaveBeenCalled();
		expect(input.value).toBe('3');
	});
});
