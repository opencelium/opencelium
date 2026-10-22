import type { CSSProperties } from 'react';

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
		const isContainingBlock =
			style.transform !== 'none' ||
			style.perspective !== 'none' ||
			style.filter !== 'none' ||
			style.backdropFilter !== 'none' ||
			style.willChange.includes('transform') ||
			style.willChange.includes('filter') ||
			style.contain.split(/\s+/).some((token) => CONTAINMENT_TOKENS.includes(token));
		if (isContainingBlock) return node;
	}
	return null;
}

/**
 * Geometry that makes a `position: fixed` box cover the whole window. The offsets
 * are rebased onto `base`, the box's fixed containing block: inside the
 * field-binding drawer `top: 0; left: 0` would otherwise mean the drawer's corner,
 * not the window's.
 */
export function maximizedStyle(base: Element | null): CSSProperties {
	const origin = base?.getBoundingClientRect();
	return {
		position: 'fixed',
		top: -(origin?.top ?? 0),
		left: -(origin?.left ?? 0),
		width: window.innerWidth,
		height: window.innerHeight,
	};
}

const GEOMETRY_KEYS = ['top', 'left', 'width', 'height'] as const;

/**
 * Whether a fresh measurement says anything new, so a resize that changes nothing
 * does not cost a render.
 */
export function isSameMaximizedGeometry(a?: CSSProperties, b?: CSSProperties): boolean {
	if (!a || !b) return a === b;
	return GEOMETRY_KEYS.every((key) => a[key] === b[key]);
}
