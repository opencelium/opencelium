import { useState } from 'react';
import type { WorkflowLogsPanelState } from './WorkflowLogs.types';

export function useWorkflowLogsPanel(isActive: boolean) {
	const [panel, setPanel] = useState<WorkflowLogsPanelState>('minimized');
	const [wasActive, setWasActive] = useState(false);

	if (isActive !== wasActive) {
		setWasActive(isActive);
		if (isActive && panel === 'minimized') setPanel('normal');
	}

	return {
		panel,
		isExpanded: panel !== 'minimized',
		toggleMinimized: () => setPanel((current) =>
			current === 'minimized' ? 'normal' : 'minimized'),
		toggleFull: () => setPanel((current) => current === 'full' ? 'normal' : 'full'),
	};
}
