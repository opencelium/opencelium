export type WorkflowLogsPanelState = 'minimized' | 'normal' | 'full';

export type WorkflowLogsHeaderProps = {
	panel: WorkflowLogsPanelState;
	isExpanded: boolean;
	hasLogs: boolean;
	isRunning: boolean;
	isStopping: boolean;
	isLiveAnimation: boolean;
	onToggleLiveAnimation: (value: boolean) => void;
	onToggleMinimized: () => void;
	onToggleFull: () => void;
	onClear: () => void;
};
