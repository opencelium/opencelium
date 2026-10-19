import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SandboxResult } from './sandbox.types';
import { useScriptSandbox } from './useScriptSandbox';

class FakeWorker {
	static instances: FakeWorker[] = [];
	onmessage: ((event: MessageEvent<SandboxResult>) => void) | null = null;
	onerror: ((event: ErrorEvent) => void) | null = null;
	terminate = vi.fn();
	postMessage = vi.fn();
	constructor() {
		FakeWorker.instances.push(this);
	}
	reply(result: SandboxResult) {
		this.onmessage?.({ data: result } as MessageEvent<SandboxResult>);
	}
}

const request = { script: 'RESULT_VAR = 1;', args: {} };

describe('useScriptSandbox', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		FakeWorker.instances = [];
		vi.stubGlobal('Worker', FakeWorker);
	});
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('stops an endless script after 2 seconds with a timeout result', () => {
		const { result } = renderHook(() => useScriptSandbox());

		act(() => result.current.run(request));
		expect(result.current.status).toBe('running');
		act(() => vi.advanceTimersByTime(1999));
		expect(result.current.status).toBe('running');
		act(() => vi.advanceTimersByTime(1));

		expect(result.current.result).toEqual({ kind: 'timeout' });
		expect(result.current.status).toBe('done');
		expect(FakeWorker.instances[0].terminate).toHaveBeenCalled();
	});

	it('starts a fresh worker for every run and ignores the previous one', () => {
		const { result } = renderHook(() => useScriptSandbox());

		act(() => result.current.run(request));
		act(() => result.current.run(request));
		const [first, second] = FakeWorker.instances;
		expect(first.terminate).toHaveBeenCalled();

		act(() => first.reply({ kind: 'value', value: 1, serverType: 'Number', console: [] }));
		expect(result.current.status).toBe('running');
		act(() => second.reply({ kind: 'value', value: 2, serverType: 'Number', console: [] }));
		expect(result.current.result).toMatchObject({ value: 2 });
		expect(second.terminate).toHaveBeenCalled();
	});
});
