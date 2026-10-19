import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLegacyStore } from '../../../../store';
import { useEnhancementState } from './useEnhancementState';

const wrapper = ({ children }: { children: ReactNode }) => (
	<Provider store={createLegacyStore()}>{children}</Provider>
);

const buildDrawerDom = () => {
	const drawer = document.createElement('div');
	drawer.className = 'bindingDrawer';
	drawer.setAttribute('style', 'transform: translateX(0)');
	drawer.getBoundingClientRect = () => ({ top: 64, left: 540 }) as DOMRect;
	const container = document.createElement('div');
	drawer.appendChild(container);
	document.body.appendChild(drawer);
	return container;
};

const resizeWindow = (width: number, height: number) =>
	act(() => {
		vi.stubGlobal('innerWidth', width);
		vi.stubGlobal('innerHeight', height);
		window.dispatchEvent(new Event('resize'));
	});

const renderMaximizable = () => {
	const container = buildDrawerDom();
	const hook = renderHook(() => useEnhancementState(), { wrapper });
	Object.defineProperty(hook.result.current.containerRef, 'current', {
		value: container,
		writable: true,
	});
	return hook;
};

beforeEach(() => {
	vi.stubGlobal('innerWidth', 1000);
	vi.stubGlobal('innerHeight', 800);
});

afterEach(() => {
	document.body.innerHTML = '';
	vi.unstubAllGlobals();
});

describe('useEnhancementState — maximized enhancement geometry', () => {
	it('covers the window from inside the drawer and follows window resizes', () => {
		const { result } = renderMaximizable();

		act(() => result.current.toggleMaximized());
		expect(result.current.isMaximized).toBe(true);
		expect(result.current.maximizedStyle).toEqual({
			position: 'fixed',
			top: -64,
			left: -540,
			width: 1000,
			height: 800,
		});

		resizeWindow(1240, 900);
		expect(result.current.maximizedStyle).toMatchObject({ width: 1240, height: 900 });
	});

	it('keeps the same style object when a resize says nothing new', () => {
		const { result } = renderMaximizable();

		act(() => result.current.toggleMaximized());
		const first = result.current.maximizedStyle;
		resizeWindow(1000, 800);
		expect(result.current.maximizedStyle).toBe(first);
	});

	it('stops following the window once minimized', () => {
		const { result } = renderMaximizable();

		act(() => result.current.toggleMaximized());
		act(() => result.current.toggleMaximized());
		expect(result.current.isMaximized).toBe(false);
		const last = result.current.maximizedStyle;
		resizeWindow(1500, 900);
		expect(result.current.maximizedStyle).toBe(last);
	});
});
