export const MENU_VIEWPORT_MARGIN = 8;

type Size = { width: number; height: number };

// Opens toward the side with room: below/right of the pointer by default, flipped above/left
// when it would leave the viewport, and pinned to the edge when it fits neither way.
const placeAxis = (anchor: number, size: number, viewport: number) => {
	if (anchor + size + MENU_VIEWPORT_MARGIN <= viewport) return anchor;
	if (anchor - size >= MENU_VIEWPORT_MARGIN) return anchor - size;
	return Math.max(MENU_VIEWPORT_MARGIN, viewport - MENU_VIEWPORT_MARGIN - size);
};

export function placeContextMenu(anchor: { x: number; y: number }, menu: Size, viewport: Size) {
	return {
		left: placeAxis(anchor.x, menu.width, viewport.width),
		top: placeAxis(anchor.y, menu.height, viewport.height),
	};
}
