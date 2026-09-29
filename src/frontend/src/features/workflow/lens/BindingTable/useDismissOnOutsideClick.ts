import { useEffect, type RefObject } from 'react';

/* Not every click off the panel is a click "outside" it. The control that opens
   the list would reopen on its own click what the dismiss had just closed; the
   binding editor drawer and the backdrop it puts over the canvas are this
   list's own second half, and dismissing the list from under an editor that was
   opened from one of its rows loses the row it came from; and a kit renders its
   overlays in a body-level portal, so the pagination page-size dropdown is
   physically outside the panel while belonging to it. */
const KEEP_OPEN_SELECTOR = [
	'[data-testid="workflow-binding-table-toggle"]',
	'.bindingDrawer',
	'.drawerOverlay',
	'.ant-select-dropdown',
	'.ant-dropdown',
	'.ant-picker-dropdown',
	'.ant-popover',
	'.ant-tooltip',
	'.ant-modal-root',
	'.MuiPopover-root',
	'.MuiMenu-root',
	'.MuiTooltip-popper',
].join(', ');

type Params = {
	open: boolean;
	panelRef: RefObject<HTMLElement | null>;
	onClose: () => void;
};

/**
 * Escape, or a click off the panel, closes it — the dismissal every other
 * workflow drawer gets from its own backdrop, for the one panel that
 * deliberately has none (the canvas stays live behind this list, so hovering a
 * method still lights up its bindings while it is open).
 *
 * `mousedown` rather than `click`, matching NodeContextMenu: a click landing on
 * a canvas element that the same press re-renders would never reach a click
 * listener.
 *
 * In the capture phase, which is what makes it work over the canvas at all:
 * xyflow pans through d3-zoom, whose own mousedown handler on the pane opens
 * with `stopImmediatePropagation()`, so a bubble-phase listener on window is
 * never reached by a press on the canvas — the one place a click "outside this
 * panel" mostly lands. Capture runs on the way down, before any target handler
 * gets to stop anything.
 */
export const useDismissOnOutsideClick = ({ open, panelRef, onClose }: Params) => {
	useEffect(() => {
		if (!open) return;
		const onEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};
		const onPointerDown = (event: MouseEvent) => {
			const target = event.target instanceof Element ? event.target : null;
			if (!target || panelRef.current?.contains(target)) return;
			if (target.closest(KEEP_OPEN_SELECTOR)) return;
			onClose();
		};
		window.addEventListener('keydown', onEscape);
		window.addEventListener('mousedown', onPointerDown, true);
		return () => {
			window.removeEventListener('keydown', onEscape);
			window.removeEventListener('mousedown', onPointerDown, true);
		};
	}, [open, onClose, panelRef]);
};
