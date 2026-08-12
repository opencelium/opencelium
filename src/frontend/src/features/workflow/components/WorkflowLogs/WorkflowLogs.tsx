import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { EMPTY_LIVE_LOG_TREE, LiveExecutionLogTree, MethodViewModeProvider } from '@features/logs';
import { useTestRun } from '../../test-run/useTestRun';
import type { TestRunResult } from '../../test-run/TestRunContext';
import { WorkflowLogsHeader } from './WorkflowLogsHeader';
import type { WorkflowLogsPanelState } from './WorkflowLogs.types';


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

export function WorkflowLogs() {
	const [panel, setPanel] = useState<WorkflowLogsPanelState>('minimized');
	const { t: tLogs } = useI18n('logs');
	const testRun = useTestRun();

	const phase = testRun?.phase ?? 'idle';
	const logTree = testRun?.logTree ?? EMPTY_LIVE_LOG_TREE;
	const result = testRun?.result ?? null;
	const isOrphaned = testRun?.isOrphaned ?? false;
	const errorRevealNonce = testRun?.errorRevealNonce ?? 0;
	const revealPending = testRun?.revealPending ?? false;
	const isLiveAnimation = testRun?.isLiveAnimation ?? false;
	const isRunning = phase !== 'idle';
	const hasLogs = !isOrphaned && logTree.rootKeys.length > 0;
	const isExpanded = panel !== 'minimized';

	const isActive = isRunning || revealPending;
	const [wasActive, setWasActive] = useState(false);
	if (isActive !== wasActive) {
		setWasActive(isActive);
		if (isActive && panel === 'minimized') setPanel('normal');
	}

	const toggleMinimized = () =>
		setPanel((current) => (current === 'minimized' ? 'normal' : 'minimized'));
	const toggleFull = () =>
		setPanel((current) => (current === 'full' ? 'normal' : 'full'));

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
						<LiveExecutionLogTree tree={logTree} fill revealNonce={errorRevealNonce} />
					) : (
						tLogs('live.empty')
					)}
					{!isOrphaned && revealPending && (
						<div className='logsRunning'>
							<Loader2 size={13} className='logsRunningSpinner' />
							{tLogs('live.collecting')}
						</div>
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
