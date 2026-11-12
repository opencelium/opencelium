import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { executeScript } from './langCodeApi';
import type { ScriptExecutionResponse } from './langCode.types';
import { toRunResult, useScriptRun } from './useScriptRun';

vi.mock('./langCodeApi', () => ({ executeScript: vi.fn() }));

const execute = vi.mocked(executeScript);
const request = { language: 'js' as const, script: 'RESULT_VAR = VAR_0 + 1', variables: { VAR_0: 1 } };
const success: ScriptExecutionResponse = {
	success: true, language: 'js', result: 2.0, resultType: 'number', output: '', durationMs: 4, error: null,
};
const runtimeError = {
	type: 'RUNTIME' as const, name: 'ReferenceError', line: 1, column: null,
	message: '"VAR_2" is not defined', codeLine: 'RESULT_VAR = VAR_2', hint: 'VAR_2 is not defined',
};

beforeEach(() => execute.mockReset());

describe('toRunResult', () => {
	it('maps a successful run to a value', () => {
		expect(toRunResult({ kind: 'response', response: success })).toEqual({
			kind: 'value', value: 2, resultType: 'number', output: '', durationMs: 4,
		});
	});

	it('maps a failed script to an error with the printed output', () => {
		const response = { ...success, success: false, result: null, resultType: null, output: 'a', error: runtimeError };
		expect(toRunResult({ kind: 'response', response })).toEqual({
			kind: 'error', error: runtimeError, output: 'a', durationMs: 4,
		});
	});

	it('maps a refused request to rejected', () => {
		const failure = { status: 429, code: 'TOO_MANY_SCRIPT_RUNS' };
		expect(toRunResult({ kind: 'failure', failure })).toEqual({ kind: 'rejected', failure });
	});
});

describe('useScriptRun', () => {
	it('sends the request and stores the result', async () => {
		execute.mockResolvedValue({ kind: 'response', response: success });
		const { result } = renderHook(() => useScriptRun());

		await act(() => result.current.run(request));

		expect(execute).toHaveBeenCalledWith(request);
		expect(result.current.status).toBe('done');
		expect(result.current.result).toMatchObject({ kind: 'value', value: 2 });
	});

	it('drops the answer of a run that a newer run replaced', async () => {
		let resolveFirst: (value: Awaited<ReturnType<typeof executeScript>>) => void = () => undefined;
		execute
			.mockReturnValueOnce(new Promise((done) => (resolveFirst = done)))
			.mockResolvedValueOnce({ kind: 'response', response: { ...success, result: 3 } });
		const { result } = renderHook(() => useScriptRun());

		let first: Promise<void> = Promise.resolve();
		act(() => {
			first = result.current.run(request);
		});
		await act(() => result.current.run(request));
		await act(async () => {
			resolveFirst({ kind: 'response', response: success });
			await first;
		});

		expect(result.current.result).toMatchObject({ value: 3 });
	});
});
