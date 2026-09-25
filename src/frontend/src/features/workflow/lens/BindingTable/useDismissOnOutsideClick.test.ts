import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDismissOnOutsideClick } from './useDismissOnOutsideClick';

const mount = (open: boolean, panel: HTMLElement) => {
	const onClose = vi.fn();
	const view = renderHook(({ isOpen }) =>
		useDismissOnOutsideClick({ open: isOpen, panelRef: { current: panel }, onClose }),
	{ initialProps: { isOpen: open } });
	return { onClose, view };
};

const press = (target: Element) =>
	target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

let panel: HTMLElement;
let canvas: HTMLElement;

beforeEach(() => {
	panel = document.createElement('aside');
	panel.append(document.createElement('input'));
	canvas = document.createElement('div');
	document.body.append(panel, canvas);
});

afterEach(() => {
	document.body.innerHTML = '';
});

describe('useDismissOnOutsideClick', () => {
	it('closes on a press anywhere off the panel', () => {
		const { onClose } = mount(true, panel);
		press(canvas);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	// xyflow pans through d3-zoom, whose pane handler opens with
	// stopImmediatePropagation() — a bubble-phase listener never sees the press
	// that lands on the canvas, which is where most clicks off the panel land.
	it('closes on a press the canvas stops from propagating', () => {
		const { onClose } = mount(true, panel);
		canvas.addEventListener('mousedown', (event) => event.stopImmediatePropagation());
		press(canvas);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('stays open for a press on the panel or anything inside it', () => {
		const { onClose } = mount(true, panel);
		press(panel);
		press(panel.firstElementChild as Element);
		expect(onClose).not.toHaveBeenCalled();
	});

	// The toggle's own click would reopen what this had just closed.
	it('leaves the control that toggles the panel to do its own toggling', () => {
		const { onClose } = mount(true, panel);
		const toggle = document.createElement('button');
		toggle.dataset.testid = 'workflow-binding-table-toggle';
		canvas.append(toggle);
		press(toggle);
		expect(onClose).not.toHaveBeenCalled();
	});

	// The editor drawer is opened from a row of this list, and its backdrop is
	// what dismisses the editor — neither should take the list away behind it.
	it.each(['bindingDrawer', 'drawerOverlay', 'ant-select-dropdown'])(
		'stays open for a press inside .%s', (className) => {
			const { onClose } = mount(true, panel);
			const outside = document.createElement('div');
			outside.className = className;
			outside.append(document.createElement('span'));
			document.body.append(outside);
			press(outside.firstElementChild as Element);
			expect(onClose).not.toHaveBeenCalled();
		});

	it('closes on Escape', () => {
		const { onClose } = mount(true, panel);
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('listens only while the panel is open', () => {
		const { onClose, view } = mount(false, panel);
		press(canvas);
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(onClose).not.toHaveBeenCalled();

		view.rerender({ isOpen: true });
		press(canvas);
		expect(onClose).toHaveBeenCalledTimes(1);

		view.unmount();
		press(canvas);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
