export type WorkflowLogsPanelState = 'minimized' | 'normal' | 'full';

export type WorkflowLogsHeaderProps = {
	panel: WorkflowLogsPanelState;
	isExpanded: boolean;
	hasLogs: boolean;
	isRunning: boolean;
	onToggleMinimized: () => void;
	onToggleFull: () => void;
	onClear: () => void;
};
