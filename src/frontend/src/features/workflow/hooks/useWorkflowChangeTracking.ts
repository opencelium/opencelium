import { useCallback, useEffect, useState } from 'react';
import { useUnsavedChangesGuard } from './useUnsavedChangesGuard';

export type WorkflowChangeSource = 'clean' | 'manual' | 'history';

type Params = {
	currentSnapshot: string;
	isLoading: boolean;
	readOnly: boolean;
	leaveConfirmMessage: string;
};

export const useWorkflowChangeTracking = ({ currentSnapshot, isLoading,
	readOnly, leaveConfirmMessage }: Params) => {
	const [baselineSnapshot, setBaselineSnapshotState] = useState<string | null>(null);
	const [changeSource, setChangeSource] = useState<WorkflowChangeSource>('clean');
	const [historyPreviewSnapshot, setHistoryPreviewSnapshot] = useState<string | null>(null);
	// Set by an edit that is a change by definition rather than by comparison —
	// loading a template into a workflow. The snapshot diff cannot see that one on
	// its own: the baseline is captured lazily, on the first render after loading
	// settles, so a template applied on a brand-new workflow can *become* the
	// baseline and leave a fully populated graph reading as untouched, with Save
	// greyed out and no way to keep the work.
	const [isForcedDirty, setIsForcedDirty] = useState(false);
	const hasChanges = isForcedDirty
		|| (baselineSnapshot !== null && currentSnapshot !== baselineSnapshot);
	const hasManualChanges = hasChanges && changeSource === 'manual';

	// Setting a baseline explicitly (a save, or the reset when the connection
	// changes) *is* the declaration of a new clean state, so it clears the flag.
	const setBaselineSnapshot = useCallback((snapshot: string | null) => {
		setBaselineSnapshotState(snapshot);
		setIsForcedDirty(false);
	}, []);

	const markDirty = useCallback(() => {
		setIsForcedDirty(true);
		setChangeSource('manual');
	}, []);

	useUnsavedChangesGuard(!readOnly && hasChanges, leaveConfirmMessage);

	useEffect(() => {
		if (isLoading || baselineSnapshot !== null || isForcedDirty) return;
		setBaselineSnapshotState(currentSnapshot);
		setChangeSource('clean');
		setHistoryPreviewSnapshot(null);
	}, [baselineSnapshot, currentSnapshot, isForcedDirty, isLoading]);

	useEffect(() => {
		if (isLoading || baselineSnapshot === null) return;
		if (currentSnapshot === baselineSnapshot) {
			setChangeSource('clean');
			setHistoryPreviewSnapshot(null);
			return;
		}
		if (changeSource === 'history' && currentSnapshot === historyPreviewSnapshot) return;
		setChangeSource('manual');
	}, [baselineSnapshot, changeSource, currentSnapshot, historyPreviewSnapshot, isLoading]);

	return { baselineSnapshot, setBaselineSnapshot, changeSource, setChangeSource,
		historyPreviewSnapshot, setHistoryPreviewSnapshot, hasChanges, hasManualChanges,
		markDirty };
};
