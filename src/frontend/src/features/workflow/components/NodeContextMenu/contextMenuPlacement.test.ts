import { describe, expect, it } from 'vitest';
import { MENU_VIEWPORT_MARGIN, placeContextMenu } from './contextMenuPlacement';

const viewport = { width: 1000, height: 600 };
const menu = { width: 300, height: 400 };

describe('placeContextMenu', () => {
	it('opens below and to the right of the pointer when it fits', () => {
		expect(placeContextMenu({ x: 100, y: 100 }, menu, viewport)).toEqual({ left: 100, top: 100 });
	});

	it('flips above and to the left when it would leave the viewport', () => {
		expect(placeContextMenu({ x: 900, y: 500 }, menu, viewport)).toEqual({ left: 600, top: 100 });
	});

	it('pins to the bottom edge when it fits neither below nor above', () => {
		expect(placeContextMenu({ x: 100, y: 300 }, menu, viewport).top).toBe(600 - MENU_VIEWPORT_MARGIN - 400);
	});

	it('never starts above the top margin', () => {
		expect(placeContextMenu({ x: 100, y: 300 }, { width: 300, height: 700 }, viewport).top).toBe(MENU_VIEWPORT_MARGIN);
	});
});
