import { afterEach, describe, expect, it } from 'vitest';
import { findFixedContainingBlock, resolveMaximizedScriptStyle } from './maximizedScriptStyle';

type Rect = { top: number; left: number; width: number; height: number };

const stubRect = (element: HTMLElement, rect: Rect) => {
	element.getBoundingClientRect = () => ({
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

const PAGE: Rect = { top: 64, left: 0, width: 1400, height: 800 };
const DRAWER: Rect = { top: 64, left: 940, width: 460, height: 800 };
const MODAL_BODY: Rect = { top: 100, left: 300, width: 800, height: 620 };

afterEach(() => {
	document.body.innerHTML = '';
});

describe('findFixedContainingBlock', () => {
	it('returns the nearest transformed ancestor, not the untransformed ones below it', () => {
		const page = el('page');
		const drawer = el('bindingDrawer', DRAWER, 'transform: translateX(0)');
		const body = el('drawerBody');
		const scriptBox = nest(page, drawer, body, el('bodyLegacyEnhancementScript'));
		expect(findFixedContainingBlock(scriptBox)).toBe(drawer);
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

describe('resolveMaximizedScriptStyle', () => {
	it('expresses the page rect relative to the drawer that will lay the box out', () => {
		const page = el('page', PAGE);
		const drawer = el('bindingDrawer', DRAWER, 'transform: translateX(0)');
		const scriptBox = nest(page, drawer, el('drawerBody'), el('bodyLegacyEnhancementScript'));

		// Rebased onto the drawer's own origin: left by the drawer's offset from the
		// page's left edge, top by nothing, since drawer and page start level.
		expect(resolveMaximizedScriptStyle(scriptBox)).toEqual({
			position: 'fixed', top: 0, left: -940, width: 1400, height: 800,
		});
	});

	it('follows the drawer when the binding list has shifted it aside', () => {
		const page = el('page', PAGE);
		const drawer = el('bindingDrawer', { ...DRAWER, left: 480 }, 'transform: translateX(-460px)');
		const scriptBox = nest(page, drawer, el('drawerBody'), el('bodyLegacyEnhancementScript'));

		expect(resolveMaximizedScriptStyle(scriptBox)).toEqual({
			position: 'fixed', top: 0, left: -480, width: 1400, height: 800,
		});
	});

	it('fills the modal body in viewport coordinates when nothing above is a containing block', () => {
		const modalBody = el('ant-modal-body', MODAL_BODY);
		const scriptBox = nest(modalBody, el('bodyLegacyEnhancementScript'));

		expect(resolveMaximizedScriptStyle(scriptBox)).toEqual({
			position: 'fixed', top: 100, left: 300, width: 800, height: 620,
		});
	});

	it('gives no geometry when the script box is in neither host', () => {
		expect(resolveMaximizedScriptStyle(nest(el('somewhereElse'), el('bodyLegacyEnhancementScript'))))
			.toBeUndefined();
		expect(resolveMaximizedScriptStyle(null)).toBeUndefined();
	});
});
