import type { MethodLabelResolver } from '@features/logs';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';

export type WorkflowLogsPanelState = 'minimized' | 'normal' | 'full';

// Panel state is owned by the parent page (index.tsx), not WorkflowLogs itself:
// 'normal' is rendered inside a Splitter pane sharing height with the canvas,
// so only the parent knows whether to mount the Splitter at all — WorkflowLogs
// stays a controlled component so parent and panel never disagree about which
// container it's currently sitting in.
export type WorkflowLogsProps = {
	panel: WorkflowLogsPanelState;
	onPanelChange: (panel: WorkflowLogsPanelState) => void;
	/** Names the user gave the graph's steps, for the method rows' name view. */
	resolveMethodLabel: MethodLabelResolver;
	/** What Explain / Fix with AI need after a failed run: the graph, and how to save one step's request. */
	runAssist: WorkflowRunAssistProps;
};

export type WorkflowRunAssistProps = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	workflowTitle: string;
	onSaveMethodConfig: (nodeId: string, config: WorkflowMethodConfig) => void;
};

export type WorkflowLogsHeaderProps = {
	panel: WorkflowLogsPanelState;
	isExpanded: boolean;
	hasLogs: boolean;
	isRunning: boolean;
	isStopping: boolean;
	isPaused: boolean;
	isLiveAnimation: boolean;
	/** Draws attention to the Live toggle while the test-run mode dialog explains it. */
	isLiveToggleHighlighted: boolean;
	onToggleLiveAnimation: (value: boolean) => void;
	onToggleMinimized: () => void;
	onToggleFull: () => void;
	onClear: () => void;
};
