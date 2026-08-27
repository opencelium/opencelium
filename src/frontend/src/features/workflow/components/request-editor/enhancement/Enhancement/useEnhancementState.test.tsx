import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLegacyStore } from '../../../../store';
import { useEnhancementState } from './useEnhancementState';

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

// jsdom has no ResizeObserver. This one records its observers so a test can fire
// them, which is the whole behaviour under test: the page resizing under a
// maximized script with no window resize event to hear (a main-menu collapse).
const observerCallbacks: ResizeObserverCallback[] = [];

class FakeResizeObserver implements ResizeObserver {
	private readonly callback: ResizeObserverCallback;
	observed: Element[] = [];
	constructor(callback: ResizeObserverCallback) {
		this.callback = callback;
		observerCallbacks.push(callback);
	}
	observe(target: Element) { this.observed.push(target); }
	unobserve() {}
	disconnect() {
		const index = observerCallbacks.indexOf(this.callback);
		if (index >= 0) observerCallbacks.splice(index, 1);
	}
}

const fireResize = () => act(() => {
	observerCallbacks.forEach((callback) => callback([], {} as ResizeObserver));
});

const wrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={createLegacyStore()}>{children}</Provider>
);

const buildDrawerDom = () => {
	const page = document.createElement('div');
	page.className = 'page';
	stubRect(page, { top: 64, left: 0, width: 1000, height: 800 });
	const drawer = document.createElement('div');
	drawer.className = 'bindingDrawer';
	drawer.setAttribute('style', 'transform: translateX(0)');
	stubRect(drawer, { top: 64, left: 540, width: 460, height: 800 });
	const scriptBox = document.createElement('div');
	page.appendChild(drawer);
	drawer.appendChild(scriptBox);
	document.body.appendChild(page);
	return { page, scriptBox };
};

beforeEach(() => {
	vi.stubGlobal('ResizeObserver', FakeResizeObserver);
});

afterEach(() => {
	observerCallbacks.length = 0;
	document.body.innerHTML = '';
	vi.unstubAllGlobals();
});

describe('useEnhancementState — maximized script geometry', () => {
	it('measures the surface on maximize and again when it resizes under the box', () => {
		const { page, scriptBox } = buildDrawerDom();
		const { result } = renderHook(() => useEnhancementState(), { wrapper });
		Object.defineProperty(result.current.scriptBoxRef, 'current', {
			value: scriptBox, writable: true,
		});

		act(() => result.current.toggleScriptMaximized());
		expect(result.current.isScriptMaximized).toBe(true);
		expect(result.current.maximizedStyle)
			.toEqual({ position: 'fixed', top: 0, left: -540, width: 1000, height: 800 });

		// The main menu collapses: the page grows and shifts left, the drawer stays
		// pinned to its right edge. No window resize event is involved.
		stubRect(page, { top: 64, left: 0, width: 1240, height: 800 });
		fireResize();
		expect(result.current.maximizedStyle)
			.toEqual({ position: 'fixed', top: 0, left: -540, width: 1240, height: 800 });
	});

	it('keeps the same style object when a resize says nothing new', () => {
		const { scriptBox } = buildDrawerDom();
		const { result } = renderHook(() => useEnhancementState(), { wrapper });
		Object.defineProperty(result.current.scriptBoxRef, 'current', {
			value: scriptBox, writable: true,
		});

		act(() => result.current.toggleScriptMaximized());
		const first = result.current.maximizedStyle;
		fireResize();
		expect(result.current.maximizedStyle).toBe(first);
	});

	it('stops following the surface once minimized', () => {
		const { scriptBox } = buildDrawerDom();
		const { result } = renderHook(() => useEnhancementState(), { wrapper });
		Object.defineProperty(result.current.scriptBoxRef, 'current', {
			value: scriptBox, writable: true,
		});

		act(() => result.current.toggleScriptMaximized());
		expect(observerCallbacks).toHaveLength(1);
		act(() => result.current.toggleScriptMaximized());
		expect(result.current.isScriptMaximized).toBe(false);
		expect(observerCallbacks).toHaveLength(0);
	});
});
