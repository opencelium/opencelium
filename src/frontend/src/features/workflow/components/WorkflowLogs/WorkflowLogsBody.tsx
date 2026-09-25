import { Loader2 } from 'lucide-react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { LiveExecutionLogTree, type LiveLogTree } from '@features/logs';
import type { TestRunResult } from '../../test-run/TestRunContext';

const formatDuration = (ms: number) => {
	if (ms < 1000) return `${ms}ms`;
	const seconds = ms / 1000;
	if (seconds < 60) return `${seconds.toFixed(1)}s`;
	return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
};

function ResultLine({ result }: { result: TestRunResult }) {
	const { t } = useI18n('logs');
	if (result.kind === 'finished') return <div className='logsResult logsResult--finished'>
		{t('live.finished', { time: formatDuration(result.executionTimeMs) })}</div>;
	if (result.kind === 'stopped') return <div className='logsResult logsResult--stopped'>
		{t('live.stopped')}</div>;
	return <div className='logsResult logsResult--failed'>{t('live.failed')}</div>;
}

type Props = {
	tree: LiveLogTree;
	hasLogs: boolean;
	isOrphaned: boolean;
	revealPending: boolean;
	revealNonce: number;
	result: TestRunResult | null;
};

export function WorkflowLogsBody({ tree, hasLogs, isOrphaned, revealPending,
	revealNonce, result }: Props) {
	const { t } = useI18n('logs');
	return <div className={`logsBody ${hasLogs ? 'logsBodyTree' : ''}`}>
		{isOrphaned ? <div className='logsOrphanNotice'>{t('live.orphaned')}</div>
			: hasLogs ? <LiveExecutionLogTree tree={tree} fill revealNonce={revealNonce} />
				: t('live.empty')}
		{!isOrphaned && revealPending && <div className='logsRunning'>
			<Loader2 size={13} className='logsRunningSpinner' />{t('live.collecting')}
		</div>}
		{!isOrphaned && !revealPending && result && <ResultLine result={result} />}
	</div>;
}
