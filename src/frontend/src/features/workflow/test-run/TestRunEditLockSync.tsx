import { useEffect } from 'react';
import { useTestRun } from './useTestRun';

type Props = {
	onLockChange: (isLocked: boolean) => void;
};

/**
 * The workflow page renders TestRunProvider itself (the provider needs the
 * payload builder and graph metadata computed inside the page), so the page
 * cannot call useTestRun directly. This bridge, mounted inside the provider,
 * mirrors the "a run is actively executing" flag back up so page-level edit
 * surfaces (delete/undo shortcuts, sidebar, header, version history) can be
 * locked for its duration — the payload is already with the backend, so an edit
 * would silently diverge from what is actually executing.
 *
 * Paused counts as UNLOCKED, same reasoning as WorkflowCanvas's `isEditLocked`:
 * a paused debugging session is exactly when inspecting and adjusting the graph
 * is wanted, even though the backend run keeps going regardless of the
 * client-side pause.
 */
export function TestRunEditLockSync({ onLockChange }: Props) {
	const testRun = useTestRun();
	const isLocked = !!testRun && testRun.phase !== 'idle' && !testRun.isPaused;

	useEffect(() => {
		onLockChange(isLocked);
	}, [isLocked, onLockChange]);

	return null;
}
