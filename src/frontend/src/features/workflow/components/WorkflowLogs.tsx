import { ChevronUp, Loader2, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { Icon } from '@shared/ui/primitives/Icon';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { EMPTY_LIVE_LOG_TREE, LiveExecutionLogTree, MethodViewModeProvider, useMethodViewMode } from '@features/logs';
import { useTestRun } from '../test-run/useTestRun';
import type { TestRunResult } from '../test-run/TestRunContext';

type PanelState = 'minimized' | 'normal' | 'full';

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

// Header toggle between the URL and method-name views, styled to match the
// panel's clear/maximize icon buttons. Lives inside MethodViewModeProvider.
function MethodViewButton() {
	const { t: tLogs } = useI18n('logs');
	const { mode, setMode } = useMethodViewMode();
	const active = mode === 'name';
	return (
		<Tooltip content={tLogs('methodView.tooltip')}>
			<button
				className={`logsHeaderIconButton ${active ? 'logsHeaderIconButton--active' : ''}`}
				type='button'
				onClick={() => setMode(active ? 'url' : 'name')}
				aria-label={tLogs('methodView.tooltip')}
			>
				<Icon name='arrow-switch' size={15} color='inherit' />
			</button>
		</Tooltip>
	);
}

export function WorkflowLogs() {
	const [panel, setPanel] = useState<PanelState>('minimized');
	const { t: tLogs } = useI18n('logs');
	const { t: tCommon } = useI18n('common');
	const testRun = useTestRun();

	const phase = testRun?.phase ?? 'idle';
	const logTree = testRun?.logTree ?? EMPTY_LIVE_LOG_TREE;
	const result = testRun?.result ?? null;
	const isRunning = phase !== 'idle';
	const hasLogs = logTree.rootKeys.length > 0;
	const isExpanded = panel !== 'minimized';

	// Render-phase adjustment: open the panel when a test run starts.
	const [wasRunning, setWasRunning] = useState(false);
	if (isRunning !== wasRunning) {
		setWasRunning(isRunning);
		if (isRunning && panel === 'minimized') setPanel('normal');
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
			<div className='logsHeaderRow'>
				<button
					className='logsHeader'
					type='button'
					onClick={toggleMinimized}
					aria-label={tLogs(isExpanded ? 'live.collapse' : 'live.expand')}
				>
					<span className='logsHeaderTitle'>
						<span>{tLogs('live.title')}</span>
						{isRunning && (
							<span className='logsRunning'>
								<Loader2 size={13} className='logsRunningSpinner' />
								{tLogs('live.running')}
							</span>
						)}
					</span>
				</button>
				{isExpanded && hasLogs && <MethodViewButton />}
				{isExpanded && hasLogs && !isRunning && (
					<Tooltip content={tLogs('live.clear')}>
						<button
							className='logsHeaderIconButton'
							type='button'
							onClick={() => testRun?.clearLogs()}
							aria-label={tLogs('live.clear')}
						>
							<Trash2 size={15} />
						</button>
					</Tooltip>
				)}
				{isExpanded && (
					<Tooltip
						content={tCommon(panel === 'full' ? 'dialog.restore' : 'dialog.maximize')}
					>
						<button
							className='logsHeaderIconButton'
							type='button'
							onClick={toggleFull}
							aria-label={tCommon(panel === 'full' ? 'dialog.restore' : 'dialog.maximize')}
						>
							{panel === 'full' ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
						</button>
					</Tooltip>
				)}
				<button
					className='logsHeaderIconButton'
					type='button'
					onClick={toggleMinimized}
					aria-label={tLogs(isExpanded ? 'live.collapse' : 'live.expand')}
				>
					<ChevronUp
						size={18}
						className={`logsCaret ${isExpanded ? 'logsCaretExpanded' : ''}`}
					/>
				</button>
			</div>

			{isExpanded && (
				<div className={`logsBody ${hasLogs ? 'logsBodyTree' : ''}`}>
					{hasLogs ? <LiveExecutionLogTree tree={logTree} fill /> : tLogs('live.empty')}
					{result && <TestRunResultLine result={result} />}
				</div>
			)}
		</div>
		</MethodViewModeProvider>
	);
}
