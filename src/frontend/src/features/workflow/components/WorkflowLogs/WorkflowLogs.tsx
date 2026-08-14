import { EMPTY_LIVE_LOG_TREE, MethodViewModeProvider } from '@features/logs';
import { useTestRun } from '../../test-run/useTestRun';
import { WorkflowLogsHeader } from './WorkflowLogsHeader';
import { WorkflowLogsBody } from './WorkflowLogsBody';
import { useWorkflowLogsPanel } from './useWorkflowLogsPanel';

export function WorkflowLogs() {
	const testRun = useTestRun();

	const phase = testRun?.phase ?? 'idle';
	const logTree = testRun?.logTree ?? EMPTY_LIVE_LOG_TREE;
	const result = testRun?.result ?? null;
	const isOrphaned = testRun?.isOrphaned ?? false;
	const errorRevealNonce = testRun?.errorRevealNonce ?? 0;
	const revealPending = testRun?.revealPending ?? false;
	const isRunning = phase !== 'idle';
	const hasLogs = !isOrphaned && logTree.rootKeys.length > 0;
	const isActive = isRunning || revealPending;
	const { panel, isExpanded, toggleMinimized, toggleFull } = useWorkflowLogsPanel(isActive);

	return (
		<MethodViewModeProvider>
		<div
			className={`logsCard ${isExpanded ? 'logsCardExpanded' : ''} ${
				panel === 'full' ? 'logsCardFull' : ''
			}`}
		>
			<WorkflowLogsHeader
				panel={panel}
				isExpanded={isExpanded}
				hasLogs={hasLogs}
				isRunning={isRunning}
				onToggleMinimized={toggleMinimized}
				onToggleFull={toggleFull}
				onClear={() => testRun?.clearLogs()}
			/>

			{isExpanded && <WorkflowLogsBody tree={logTree} hasLogs={hasLogs}
				isOrphaned={isOrphaned} revealPending={revealPending}
				revealNonce={errorRevealNonce} result={result} />}
		</div>
		</MethodViewModeProvider>
	);
}
