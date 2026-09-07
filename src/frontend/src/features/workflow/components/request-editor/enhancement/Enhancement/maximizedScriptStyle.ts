import type { CSSProperties } from 'react';

const HOST_SELECTOR = '.ant-modal-body, .bindingDrawer';
const DRAWER_CLASS = 'bindingDrawer';
const PAGE_SELECTOR = '.page';
const CONTAINMENT_TOKENS = ['layout', 'paint', 'strict', 'content'];

/**
 * The first ancestor that makes itself the containing block for `position: fixed`
 * descendants, i.e. the box such a descendant's `top`/`left` are resolved
 * against instead of the viewport. A transform is the case that matters here —
 * `.rightDrawer` slides in with `translateX` and keeps `translateX(0)` (or
 * `-460px` while the binding list is open) once open, so the field-binding
 * drawer is always one — but filter, containment and a `will-change` promising
 * either do it too, and are cheap to cover while we are asking.
 */
export function findFixedContainingBlock(element: Element | null): Element | null {
	for (let node = element?.parentElement ?? null; node; node = node.parentElement) {
		const style = getComputedStyle(node);
		const isContainingBlock = style.transform !== 'none'
			|| style.perspective !== 'none'
			|| style.filter !== 'none'
			|| style.backdropFilter !== 'none'
			|| style.willChange.includes('transform')
			|| style.willChange.includes('filter')
			|| style.contain.split(/\s+/).some((token) => CONTAINMENT_TOKENS.includes(token));
		if (isContainingBlock) return node;
	}
	return null;
}

/**
 * The two boxes the maximized script's geometry is derived from: the surface it
 * should cover, and the ancestor its `position: fixed` offsets will be resolved
 * against. Kept as elements rather than measured once, because both are live —
 * collapsing the app's main menu resizes the surface without a window resize
 * event to notice it by.
 */
export type MaximizedScriptTargets = {
	surface: Element;
	base: Element | null;
};

export function resolveMaximizedScriptTargets(
	scriptBox: HTMLElement | null,
): MaximizedScriptTargets | null {
	const host = scriptBox?.closest(HOST_SELECTOR);
	if (!host) return null;
	// The drawer is 460px wide, so filling it would only make the box taller —
	// it takes over the whole workflow page it floats above instead, the way the
	// method dialog's script takes over the dialog body.
	const surface = host.classList.contains(DRAWER_CLASS)
		? host.closest(PAGE_SELECTOR) ?? host
		: host;
	return { surface, base: findFixedContainingBlock(scriptBox) };
}

/**
 * Geometry for the maximized script box, in the coordinate space that box will
 * actually be laid out in: viewport coordinates only work while nothing above it
 * is a fixed containing block, and in the field-binding drawer something always
 * is (see findFixedContainingBlock), which is why the maximized script used to
 * land a drawer's width off the right edge of the screen instead of opening.
 */
export function maximizedScriptStyle(
	targets: MaximizedScriptTargets | null,
): CSSProperties | undefined {
	if (!targets) return undefined;
	const rect = targets.surface.getBoundingClientRect();
	const base = targets.base?.getBoundingClientRect();
	return {
		position: 'fixed',
		top: rect.top - (base?.top ?? 0),
		left: rect.left - (base?.left ?? 0),
		width: rect.width,
		height: rect.height,
	};
}

export function resolveMaximizedScriptStyle(scriptBox: HTMLElement | null): CSSProperties | undefined {
	return maximizedScriptStyle(resolveMaximizedScriptTargets(scriptBox));
}

const GEOMETRY_KEYS = ['top', 'left', 'width', 'height'] as const;

/**
 * Whether a fresh measurement says anything new. The box is `position: fixed`
 * while maximized, i.e. out of flow, so re-measuring a surface it no longer
 * contributes to must not be able to feed itself a new render.
 */
export function isSameMaximizedGeometry(a?: CSSProperties, b?: CSSProperties): boolean {
	if (!a || !b) return a === b;
	return GEOMETRY_KEYS.every((key) => a[key] === b[key]);
}
