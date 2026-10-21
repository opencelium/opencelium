import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNashornCompatibility } from './useNashornCompatibility';

const es6Script = 'let a = 1;';

describe('useNashornCompatibility', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('checks a JavaScript script 300 ms after the last change', () => {
		const { result } = renderHook(() => useNashornCompatibility(es6Script, 'js'));

		act(() => vi.advanceTimersByTime(299));
		expect(result.current).toEqual([]);
		act(() => vi.advanceTimersByTime(1));
		expect(result.current).toEqual([expect.objectContaining({ kind: 'syntax' })]);
	});

	it.each(['python2', 'python3', 'ruby'])('does not check %s scripts', (language) => {
		const { result } = renderHook(() => useNashornCompatibility(es6Script, language));

		act(() => vi.advanceTimersByTime(1000));
		expect(result.current).toEqual([]);
	});
});
