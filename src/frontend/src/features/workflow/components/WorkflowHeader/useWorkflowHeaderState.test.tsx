import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useWorkflowHeaderState } from './useWorkflowHeaderState';

const setup = (overrides?: {
	validateTitle?: (title: string) => Promise<string | null>;
	onNameCommitted?: (title: string, description: string) => Promise<void>;
	onDescriptionCommitted?: (title: string, description: string) => Promise<void>;
}) => {
	const validateTitle = overrides?.validateTitle ?? vi.fn(async () => null);
	const onNameCommitted = overrides?.onNameCommitted ?? vi.fn(async () => {});
	const onDescriptionCommitted = overrides?.onDescriptionCommitted ?? vi.fn(async () => {});
	const hook = renderHook(() => useWorkflowHeaderState({
		initialName: '[Empty Name]',
		initialDescription: '[Empty Description]',
		validateTitle,
		onNameCommitted,
		onDescriptionCommitted,
	}));
	return { ...hook, validateTitle, onNameCommitted, onDescriptionCommitted };
};

describe('useWorkflowHeaderState', () => {
	it('saves an inline name commit once', async () => {
		const { result, onNameCommitted } = setup();
		act(() => result.current.setDraftName('New workflow'));
		await act(async () => {
			await result.current.commitName();
		});
		expect(onNameCommitted).toHaveBeenCalledTimes(1);
	});

	// The confirm button disables itself for the duration of the commit, and a
	// focused element that becomes disabled fires blur — which used to re-enter
	// commitName while the first commit was still awaiting its title check, so a
	// brand-new workflow was created twice and the second attempt came back as
	// "a workflow with this title already exists".
	it('ignores a second commit while the first is still in flight', async () => {
		let releaseCheck: () => void = () => {};
		const validateTitle = vi.fn(() => new Promise<string | null>((resolve) => {
			releaseCheck = () => resolve(null);
		}));
		const { result, onNameCommitted } = setup({ validateTitle });
		act(() => result.current.setDraftName('New workflow'));
		act(() => {
			void result.current.commitName();
			void result.current.commitName();
		});
		await act(async () => {
			releaseCheck();
		});
		await waitFor(() => expect(onNameCommitted).toHaveBeenCalledTimes(1));
		expect(validateTitle).toHaveBeenCalledTimes(1);
	});

	it('ignores a second description commit while the first is still in flight', async () => {
		let releaseSave: () => void = () => {};
		const onDescriptionCommitted = vi.fn(() => new Promise<void>((resolve) => {
			releaseSave = () => resolve();
		}));
		const { result } = setup({ onDescriptionCommitted });
		act(() => result.current.setDraftDescription('Some description'));
		act(() => {
			void result.current.commitDescription();
			void result.current.commitDescription();
		});
		await act(async () => {
			releaseSave();
		});
		await waitFor(() => expect(onDescriptionCommitted).toHaveBeenCalledTimes(1));
	});
});
