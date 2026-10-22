import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReferencePathFeedback } from './referencePathSyntax';
import { useReferenceFeedbackTooltip } from './useReferenceFeedbackTooltip';

const error: ReferencePathFeedback = { severity: 'error', message: 'broken' };
const warning: ReferencePathFeedback = { severity: 'warning', message: 'unknown' };

const render = (initial: ReferencePathFeedback | null) => renderHook(
	({ feedback }: { feedback: ReferencePathFeedback | null }) => useReferenceFeedbackTooltip(feedback),
	{ initialProps: { feedback: initial } },
);

describe('useReferenceFeedbackTooltip', () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it('opens an error once the dialog has settled and falls back to hover after the pin expires', () => {
		const { result, rerender } = render(null);
		expect(result.current.open).toBe(false);
		rerender({ feedback: error });
		expect(result.current.open).toBe(false);
		act(() => vi.advanceTimersByTime(400));
		expect(result.current.open).toBe(true);
		act(() => vi.advanceTimersByTime(5000));
		expect(result.current.open).toBe(false);
		act(() => result.current.onOpenChange(true));
		expect(result.current.open).toBe(true);
	});

	it('pins the same error again after it was fixed and reintroduced', () => {
		const { result, rerender } = render(error);
		act(() => vi.advanceTimersByTime(5400));
		expect(result.current.open).toBe(false);
		rerender({ feedback: null });
		rerender({ feedback: error });
		act(() => vi.advanceTimersByTime(400));
		expect(result.current.open).toBe(true);
	});

	it('keeps warnings hover-only', () => {
		const { result } = render(warning);
		expect(result.current.open).toBe(false);
		act(() => result.current.onOpenChange(true));
		expect(result.current.open).toBe(true);
	});
});
