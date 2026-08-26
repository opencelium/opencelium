import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useWorkflowChangeTracking } from './useWorkflowChangeTracking';

vi.mock('./useUnsavedChangesGuard', () => ({ useUnsavedChangesGuard: () => {} }));

const BLANK = '{"nodes":["start"]}';
const TEMPLATE = '{"nodes":["start","method"]}';

const setup = (initial: { currentSnapshot: string; isLoading: boolean }) =>
	renderHook((props: { currentSnapshot: string; isLoading: boolean }) =>
		useWorkflowChangeTracking({ ...props, readOnly: false, leaveConfirmMessage: '' }),
	{ initialProps: initial });

describe('useWorkflowChangeTracking', () => {
	it('treats the graph present when loading settles as the clean baseline', () => {
		const { result, rerender } = setup({ currentSnapshot: BLANK, isLoading: true });
		rerender({ currentSnapshot: BLANK, isLoading: false });
		expect(result.current.hasChanges).toBe(false);
	});

	it('reports an edit made after the baseline was captured', () => {
		const { result, rerender } = setup({ currentSnapshot: BLANK, isLoading: false });
		rerender({ currentSnapshot: TEMPLATE, isLoading: false });
		expect(result.current.hasChanges).toBe(true);
	});

	// The template can land before the baseline exists — the baseline waits for
	// `isLoading`, and applying a template on a blank workflow beats it there.
	// Without markDirty the template would have become the baseline and the fully
	// populated workflow would have read as untouched.
	it('keeps a template applied before the baseline was captured dirty', () => {
		const { result, rerender } = setup({ currentSnapshot: BLANK, isLoading: true });
		act(() => result.current.markDirty());
		rerender({ currentSnapshot: TEMPLATE, isLoading: false });
		expect(result.current.hasChanges).toBe(true);
		expect(result.current.hasManualChanges).toBe(true);
	});

	it('goes clean again once a save declares a new baseline', () => {
		const { result, rerender } = setup({ currentSnapshot: BLANK, isLoading: true });
		act(() => result.current.markDirty());
		rerender({ currentSnapshot: TEMPLATE, isLoading: false });
		act(() => result.current.setBaselineSnapshot(TEMPLATE));
		rerender({ currentSnapshot: TEMPLATE, isLoading: false });
		expect(result.current.hasChanges).toBe(false);
	});
});
