import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Enhancement } from '../../../../types/connection';
import { useScriptDebugValue } from './useScriptDebugValue';

const mocks = vi.hoisted(() => ({ resolve: vi.fn() }));
vi.mock('../../../../test-run/useTestRun', () => ({ useTestRun: () => ({ isPaused: true }) }));
vi.mock('./scriptDebugValue.utils', () => ({ resolveScriptDebugSnapshot: mocks.resolve }));

const enhancementA: Enhancement = { enhanceId: 'a', language: 'js', script: 'A', args: {} };
const enhancementB: Enhancement = { enhanceId: 'b', language: 'js', script: 'B', args: {} };
const useDebug = ({ enhancement }: { enhancement: Enhancement }) => useScriptDebugValue(enhancement, null, undefined);

beforeEach(() => {
	mocks.resolve.mockReset();
});

describe('useScriptDebugValue', () => {
	it('resolves the newly selected reference when the panel is already showing data', async () => {
		mocks.resolve.mockImplementation((enhancement: Enhancement) =>
			Promise.resolve({ kind: 'value', value: `from ${enhancement.script}` }));
		const { result, rerender } = renderHook(useDebug, { initialProps: { enhancement: enhancementA } });
		act(() => result.current.toggle());
		await waitFor(() => expect(result.current.snapshot).toEqual({ kind: 'value', value: 'from A' }));

		rerender({ enhancement: enhancementB });

		expect(result.current.isOpen).toBe(true);
		await waitFor(() => expect(result.current.snapshot).toEqual({ kind: 'value', value: 'from B' }));
		expect(result.current.status).toBe('value');
		expect(mocks.resolve).toHaveBeenLastCalledWith(enhancementB, null, undefined, expect.anything());
	});

	it('does not resolve the newly selected reference when the panel is closed', () => {
		const { result, rerender } = renderHook(useDebug, { initialProps: { enhancement: enhancementA } });

		rerender({ enhancement: enhancementB });

		expect(result.current.isOpen).toBe(false);
		expect(result.current.status).toBe('idle');
		expect(mocks.resolve).not.toHaveBeenCalled();
	});

	it('ignores a resolve for the previous reference that settles after the switch', async () => {
		const settlers: Record<string, (value: unknown) => void> = {};
		mocks.resolve.mockImplementation((enhancement: Enhancement) =>
			new Promise((resolve) => { settlers[enhancement.script] = resolve; }));
		const { result, rerender } = renderHook(useDebug, { initialProps: { enhancement: enhancementA } });
		act(() => result.current.toggle());

		rerender({ enhancement: enhancementB });
		await act(async () => settlers.A({ kind: 'value', value: 'from A' }));
		expect(result.current.status).toBe('loading');
		expect(result.current.snapshot).toBeNull();

		await act(async () => settlers.B({ kind: 'value', value: 'from B' }));
		expect(result.current.snapshot).toEqual({ kind: 'value', value: 'from B' });
	});
});
