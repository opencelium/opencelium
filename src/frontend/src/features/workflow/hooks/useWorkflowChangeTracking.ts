import { useEffect, useState } from 'react';
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
	const [baselineSnapshot, setBaselineSnapshot] = useState<string | null>(null);
	const [changeSource, setChangeSource] = useState<WorkflowChangeSource>('clean');
	const [historyPreviewSnapshot, setHistoryPreviewSnapshot] = useState<string | null>(null);
	const hasChanges = baselineSnapshot !== null && currentSnapshot !== baselineSnapshot;
	const hasManualChanges = hasChanges && changeSource === 'manual';

	useUnsavedChangesGuard(!readOnly && hasChanges, leaveConfirmMessage);

	useEffect(() => {
		if (isLoading || baselineSnapshot !== null) return;
		setBaselineSnapshot(currentSnapshot);
		setChangeSource('clean');
		setHistoryPreviewSnapshot(null);
	}, [baselineSnapshot, currentSnapshot, isLoading]);

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
		historyPreviewSnapshot, setHistoryPreviewSnapshot, hasChanges, hasManualChanges };
};
