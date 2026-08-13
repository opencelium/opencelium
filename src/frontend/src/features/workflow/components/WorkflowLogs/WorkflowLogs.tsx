import { useI18n } from '@shared/i18n/hooks/useI18n';
import { LoadingOverlay } from '@shared/ui/primitives/Loading/LoadingOverlay';
import { EMPTY_LIVE_LOG_TREE, LiveExecutionLogTree, MethodViewModeProvider } from '@features/logs';
import { useTestRun } from '../../test-run/useTestRun';
import type { TestRunResult } from '../../test-run/TestRunContext';
import { WorkflowLogsHeader } from './WorkflowLogsHeader';
import type { WorkflowLogsProps } from './WorkflowLogs.types';


const formatDuration = (ms: number) => {
	if (ms < 1000) return `${ms}ms`;
	const totalSeconds = ms / 1000;
	if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.round(totalSeconds % 60);
	return `${minutes}m ${seconds}s`;
};

function TestRunResultLine({ result }: { result: TestRunResult }) {
	const { t: tLogs } = useI18n('logs');

	switch (result.kind) {
		case 'finished':
			return (
				<div className='logsResult logsResult--finished'>
					{tLogs('live.finished', { time: formatDuration(result.executionTimeMs) })}
				</div>
			);
		case 'stopped':
			return <div className='logsResult logsResult--stopped'>{tLogs('live.stopped')}</div>;
		case 'failed':
			return <div className='logsResult logsResult--failed'>{tLogs('live.failed')}</div>;
		default: {
			const _exhaustive: never = result;
			return _exhaustive;
		}
	}
}

// Panel state lives in the parent page (index.tsx): while `panel === 'normal'`
// the parent mounts this inside a Splitter pane sharing height with the
// canvas (drag-resizable — logsCardSplitPane in base.css fills whatever
// height the pane gives it instead of the fixed-height overlay used for
// 'minimized'/'full'). Minimized/full stay the original absolute overlay,
// rendered as a plain sibling of the canvas, unchanged.
export function WorkflowLogs({ panel, onPanelChange }: WorkflowLogsProps) {
	const { t: tLogs } = useI18n('logs');
	const testRun = useTestRun();

	const phase = testRun?.phase ?? 'idle';
	const logTree = testRun?.logTree ?? EMPTY_LIVE_LOG_TREE;
	const result = testRun?.result ?? null;
	const isOrphaned = testRun?.isOrphaned ?? false;
	const isBackendDone = testRun?.isBackendDone ?? false;
	const errorRevealNonce = testRun?.errorRevealNonce ?? 0;
	const revealPending = testRun?.revealPending ?? false;
	const isLiveAnimation = testRun?.isLiveAnimation ?? false;
	const isRunning = phase !== 'idle';
	// The user already knows the run failed (an error line arrived), but the
	// backend is still streaming the trailing lines — every enclosing loop/
	// operator closing out on the way back up the tree — up to the final
	// EXECUTION line the reveal cascade waits for (see TestRunProvider). A
	// manual stop (phase 'stopping') is the same idea from the other
	// direction. Either way "Running…" is no longer accurate.
	const isStopping = phase === 'stopping' || (result?.kind === 'failed' && !isBackendDone);
	const hasLogs = !isOrphaned && logTree.rootKeys.length > 0;
	const isExpanded = panel !== 'minimized';

	const toggleMinimized = () => onPanelChange(panel === 'minimized' ? 'normal' : 'minimized');
	const toggleFull = () => onPanelChange(panel === 'full' ? 'normal' : 'full');

	return (
		<MethodViewModeProvider>
		<div
			className={`logsCard ${isExpanded ? 'logsCardExpanded' : ''} ${
				panel === 'full' ? 'logsCardFull' : ''
			} ${panel === 'normal' ? 'logsCardSplitPane' : ''}`}
		>
			<WorkflowLogsHeader
				panel={panel}
				isExpanded={isExpanded}
				hasLogs={hasLogs}
				isRunning={isRunning}
				isStopping={isStopping}
				isLiveAnimation={isLiveAnimation}
				onToggleLiveAnimation={(value) => testRun?.setLiveAnimation(value)}
				onToggleMinimized={toggleMinimized}
				onToggleFull={toggleFull}
				onClear={() => testRun?.clearLogs()}
			/>

			{isExpanded && (
				<div className={`logsBody ${hasLogs ? 'logsBodyTree' : ''}`}>
					{isOrphaned ? (
						<div className='logsOrphanNotice'>{tLogs('live.orphaned')}</div>
					) : hasLogs ? (
						// Frozen + centered loading while the reveal is pending: the tree
						// stays visible but dimmed and non-interactive, since everything
						// the eventual expand-down cascade needs is being silently
						// prefetched behind the scenes (see TestRunProvider) rather than
						// fetched live per row.
						<LoadingOverlay loading={revealPending} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
							<LiveExecutionLogTree tree={logTree} fill revealNonce={errorRevealNonce} />
						</LoadingOverlay>
					) : (
						tLogs('live.empty')
					)}
					{!isOrphaned && !revealPending && result && (
						<TestRunResultLine result={result} />
					)}
				</div>
			)}
		</div>
		</MethodViewModeProvider>
	);
}
