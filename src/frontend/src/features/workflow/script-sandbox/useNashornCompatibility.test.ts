import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { validateScript } from './langCodeApi';
import { useNashornCompatibility } from './useNashornCompatibility';

vi.mock('./langCodeApi', () => ({ validateScript: vi.fn() }));

const validate = vi.mocked(validateScript);
const invalid = {
	valid: false,
	language: 'js',
	errors: [
		{ line: 2, column: 12, message: 'Expected an operand but found ;', codeLine: 'var b = a +;', hint: 'A value is missing' },
	],
};

describe('useNashornCompatibility', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		validate.mockReset();
	});
	afterEach(() => vi.useRealTimers());

	it('checks a JavaScript script with the backend 500 ms after the last change', async () => {
		validate.mockResolvedValue(invalid);
		const { result } = renderHook(() => useNashornCompatibility('var a = 1;\nvar b = a +;', 'js'));

		act(() => vi.advanceTimersByTime(499));
		expect(validate).not.toHaveBeenCalled();
		await act(async () => vi.advanceTimersByTime(1));

		expect(result.current.isChecked).toBe(true);
		expect(result.current.issues).toEqual([
			{ kind: 'syntax', hint: 'A value is missing', message: 'Expected an operand but found ;', line: 2, column: 11 },
		]);
	});

	it('ignores an answer for a script that has changed since', async () => {
		let resolve: (value: typeof invalid) => void = () => undefined;
		validate.mockReturnValueOnce(new Promise((done) => (resolve = done)));
		const { result, rerender } = renderHook(({ script }) => useNashornCompatibility(script, 'js'), {
			initialProps: { script: 'var b = a +;' },
		});
		act(() => vi.advanceTimersByTime(500));
		rerender({ script: 'var b = a + 1;' });
		await act(async () => resolve(invalid));

		expect(result.current).toEqual({ issues: [], isChecked: false });
	});

	it('keeps the lint warnings when the backend check fails', async () => {
		validate.mockResolvedValue(null);
		const { result } = renderHook(() => useNashornCompatibility('s.includes("x");', 'js'));
		await act(async () => vi.advanceTimersByTime(500));

		expect(result.current.issues).toEqual([expect.objectContaining({ kind: 'unsupportedBuiltin' })]);
	});

	it.each(['python2', 'python3', 'ruby'])('does not check %s scripts', (language) => {
		const { result } = renderHook(() => useNashornCompatibility('let a = 1;', language));

		act(() => vi.advanceTimersByTime(1000));
		expect(validate).not.toHaveBeenCalled();
		expect(result.current.issues).toEqual([]);
	});
});
