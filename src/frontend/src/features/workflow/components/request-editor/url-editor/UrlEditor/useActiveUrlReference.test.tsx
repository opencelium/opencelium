import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useLayoutEffect, useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { useActiveUrlReference } from './useActiveUrlReference';
import { buildInlineHtml } from '../urlInlineTokens';

const html = buildInlineHtml('/pre/#{%a%}/mid/#{%a%}/end');
function Harness({ readOnly = false }: { readOnly?: boolean }) {
	const wrapper = useRef<HTMLDivElement>(null);
	const field = useRef<HTMLDivElement>(null);
	useLayoutEffect(() => {
		field.current!.innerHTML = html;
	}, []);
	const { active, setPickerOpen, restore } = useActiveUrlReference(wrapper, readOnly);
	return (
		<div ref={wrapper}>
			<div ref={field} data-testid="field" contentEditable={!readOnly} />
			<span data-testid="active">{active ? `${active.start}:${active.end}` : ''}</span>
			<button
				data-url-reference-control
				onMouseDown={(e) => e.preventDefault()}
				onClick={() => setPickerOpen(true)}
			>
				Picker
			</button>
			<div data-url-reference-control>
				<input aria-label="picker" />
				<button
					onClick={() => {
						setPickerOpen(false);
						restore();
					}}
				>
					Cancel
				</button>
			</div>
			<input aria-label="outside" />
		</div>
	);
}
const pills = () => screen.getByTestId('field').querySelectorAll<HTMLElement>('.oc-endpoint-ref');
function caret(node: Node, offset: number) {
	act(() => {
		const range = document.createRange();
		range.setStart(node, offset);
		range.collapse(true);
		const selection = window.getSelection()!;
		selection.removeAllRanges();
		selection.addRange(range);
		document.dispatchEvent(new Event('selectionchange'));
	});
}
describe('active URL references', () => {
	it('activates only the clicked occurrence and clears at either outer edge', () => {
		render(<Harness />);
		fireEvent.click(pills()[1]);
		expect(screen.getByTestId('active')).toHaveTextContent('16:22');
		expect(screen.getByTestId('workflow-url-active-reference')).toBe(pills()[1]);
		const root = screen.getByTestId('field');
		const index = Array.from(root.childNodes).indexOf(pills()[1]);
		caret(root, index);
		expect(screen.getByTestId('active')).toBeEmptyDOMElement();
		fireEvent.click(pills()[1]);
		caret(root, index + 1);
		expect(screen.getByTestId('active')).toBeEmptyDOMElement();
	});
	it('enters an atomic token with arrow keys and exits to its boundary', async () => {
		render(<Harness />);
		const root = screen.getByTestId('field');
		root.focus();
		caret(root.firstChild!, root.firstChild!.textContent!.length);
		fireEvent.keyDown(root, { key: 'ArrowRight' });
		await waitFor(() =>
			expect(screen.getByTestId('workflow-url-active-reference')).toBe(pills()[0]),
		);
		fireEvent.keyDown(root, { key: 'ArrowRight' });
		expect(screen.getByTestId('active')).toBeEmptyDOMElement();
		fireEvent.keyDown(root, { key: 'ArrowLeft' });
		await waitFor(() =>
			expect(screen.getByTestId('workflow-url-active-reference')).toBe(pills()[0]),
		);
	});
	it('leaves Shift+arrow to the browser so a selection can grow over a token', () => {
		render(<Harness />);
		const root = screen.getByTestId('field');
		root.focus();
		caret(root.firstChild!, root.firstChild!.textContent!.length);
		expect(fireEvent.keyDown(root, { key: 'ArrowRight', shiftKey: true })).toBe(true);
		expect(screen.getByTestId('active')).toBeEmptyDOMElement();
		fireEvent.click(pills()[0]);
		expect(fireEvent.keyDown(root, { key: 'ArrowLeft', shiftKey: true })).toBe(true);
		expect(screen.getByTestId('workflow-url-active-reference')).toBe(pills()[0]);
	});
	it('keeps selection in the picker and on cancel, but clears outside', async () => {
		render(<Harness />);
		fireEvent.click(pills()[0]);
		fireEvent.click(screen.getByText('Picker'));
		act(() => screen.getByLabelText('picker').focus());
		await waitFor(() =>
			expect(screen.getByTestId('workflow-url-active-reference')).toBe(pills()[0]),
		);
		fireEvent.click(screen.getByText('Cancel'));
		expect(screen.getByTestId('field')).toHaveFocus();
		act(() => document.dispatchEvent(new Event('selectionchange')));
		await waitFor(() =>
			expect(screen.getByTestId('workflow-url-active-reference')).toBe(pills()[0]),
		);
		act(() => screen.getByLabelText('outside').focus());
		expect(screen.queryByTestId('workflow-url-active-reference')).toBeNull();
	});
	it('clears the active token when it is deleted', async () => {
		render(<Harness />);
		fireEvent.click(pills()[0]);
		act(() => pills()[0].remove());
		await waitFor(() => expect(screen.getByTestId('active')).toBeEmptyDOMElement());
	});
	it('never highlights in read-only mode', () => {
		render(<Harness readOnly />);
		fireEvent.click(pills()[0]);
		expect(screen.queryByTestId('workflow-url-active-reference')).toBeNull();
	});
});
