export type WorkflowLogsPanelState = 'minimized' | 'normal' | 'full';

// Panel state is owned by the parent page (index.tsx), not WorkflowLogs itself:
// 'normal' is rendered inside a Splitter pane sharing height with the canvas,
// so only the parent knows whether to mount the Splitter at all — WorkflowLogs
// stays a controlled component so parent and panel never disagree about which
// container it's currently sitting in.
export type WorkflowLogsProps = {
	panel: WorkflowLogsPanelState;
	onPanelChange: (panel: WorkflowLogsPanelState) => void;
};

export type WorkflowLogsHeaderProps = {
	panel: WorkflowLogsPanelState;
	isExpanded: boolean;
	hasLogs: boolean;
	isRunning: boolean;
	isStopping: boolean;
	isPaused: boolean;
	isLiveAnimation: boolean;
	onToggleLiveAnimation: (value: boolean) => void;
	onToggleMinimized: () => void;
	onToggleFull: () => void;
	onClear: () => void;
};
