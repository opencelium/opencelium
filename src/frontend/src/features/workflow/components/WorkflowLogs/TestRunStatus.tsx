import type { LiveLogTree } from '@features/logs';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { TestRunResult } from '../../test-run/TestRunContext';
import { countSteps } from './testRunSteps';

const formatDuration = (ms: number) => {
	if (ms < 1000) return `${ms}ms`;
	const totalSeconds = ms / 1000;
	if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = Math.round(totalSeconds % 60);
	return `${minutes}m ${seconds}s`;
};

/** The run's outcome in the log tree's top row. */
export function TestRunStatus({ result, tree }: { result: TestRunResult; tree: LiveLogTree }) {
	const { t } = useI18n('logs');
	switch (result.kind) {
		case 'finished':
			return <span className='logsStatusBadge logsStatusBadge--finished' data-testid='test-run-status'>
				{t('live.finished', { time: formatDuration(result.executionTimeMs) })}</span>;
		case 'stopped':
			return <span className='logsStatusBadge logsStatusBadge--stopped' data-testid='test-run-status'>{t('live.stopped')}</span>;
		case 'failed': {
			const steps = countSteps(tree);
			return <>
				<span className='logsStatusBadge logsStatusBadge--failed' data-testid='test-run-status'>{t('live.failed')}</span>
				{steps.failed > 0 && <span className='logsStatusSteps'>{t('live.failedSteps', { failed: steps.failed, count: steps.total })}</span>}
			</>;
		}
		default: {
			const _exhaustive: never = result;
			return _exhaustive;
		}
	}
}
