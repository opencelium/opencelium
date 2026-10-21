import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findFixedContainingBlock, isSameMaximizedGeometry, maximizedStyle } from './maximizedStyle';

type Rect = { top: number; left: number; width: number; height: number };

const stubRect = (element: HTMLElement, rect: Rect) => {
	element.getBoundingClientRect = () =>
		({
			...rect,
			right: rect.left + rect.width,
			bottom: rect.top + rect.height,
			x: rect.left,
			y: rect.top,
			toJSON: () => rect,
		}) as DOMRect;
};

const el = (className: string, rect?: Rect, inlineStyle?: string) => {
	const node = document.createElement('div');
	node.className = className;
	if (inlineStyle) node.setAttribute('style', inlineStyle);
	if (rect) stubRect(node, rect);
	return node;
};

const nest = (...nodes: HTMLElement[]) => {
	nodes.reduce((parent, child) => {
		parent.appendChild(child);
		return child;
	});
	document.body.appendChild(nodes[0]);
	return nodes[nodes.length - 1];
};

beforeEach(() => {
	vi.stubGlobal('innerWidth', 1600);
	vi.stubGlobal('innerHeight', 900);
});

afterEach(() => {
	document.body.innerHTML = '';
	vi.unstubAllGlobals();
});

describe('findFixedContainingBlock', () => {
	it('returns the nearest transformed ancestor, not the untransformed ones below it', () => {
		const page = el('page');
		const drawer = el('bindingDrawer', undefined, 'transform: translateX(0)');
		const body = el('drawerBody');
		const box = nest(page, drawer, body, el('bodyLegacyEnhancementContent'));
		expect(findFixedContainingBlock(box)).toBe(drawer);
	});

	it('sees containment and will-change as well as a transform', () => {
		const contained = el('contained', undefined, 'contain: paint');
		const promised = el('promised', undefined, 'will-change: transform');
		expect(findFixedContainingBlock(nest(contained, el('inner')))).toBe(contained);
		expect(findFixedContainingBlock(nest(promised, el('inner')))).toBe(promised);
	});

	it('returns null when every ancestor leaves fixed positioning to the viewport', () => {
		expect(findFixedContainingBlock(nest(el('page'), el('drawerBody'), el('inner')))).toBeNull();
	});
});

describe('maximizedStyle', () => {
	it('covers the window in viewport coordinates when nothing above is a containing block', () => {
		expect(maximizedStyle(null)).toEqual({
			position: 'fixed',
			top: -0,
			left: -0,
			width: 1600,
			height: 900,
		});
	});

	it('rebases the window origin onto a transformed drawer', () => {
		const drawer = el('bindingDrawer', { top: 64, left: 940, width: 460, height: 800 });
		expect(maximizedStyle(drawer)).toEqual({
			position: 'fixed',
			top: -64,
			left: -940,
			width: 1600,
			height: 900,
		});
	});
});

describe('isSameMaximizedGeometry', () => {
	it('compares only the geometry', () => {
		expect(isSameMaximizedGeometry(maximizedStyle(null), maximizedStyle(null))).toBe(true);
		expect(isSameMaximizedGeometry(undefined, maximizedStyle(null))).toBe(false);
	});
});
