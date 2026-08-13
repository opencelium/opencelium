import { Alert } from '@shared/ui/primitives/Alert';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTestRun } from '../../test-run/useTestRun';

// A visible reminder, floating over the canvas for the whole time a test run
// (or its post-completion replay) is animating, that the graph's highlight
// pace is deliberately slowed down for clarity — it does not reflect the
// actual backend execution speed (see playbackQueue.ts). Suppressed in live
// mode (the logs panel's "Live" toggle), since there is no slowdown to explain
// there — every line is shown the instant it arrives.
export function TestRunAnimationHint() {
	const { t: tLogs } = useI18n('logs');
	const testRun = useTestRun();
	if (!testRun || testRun.phase === 'idle' || testRun.isLiveAnimation) return null;

	return (
		<div className='canvasAnimationHint'>
			<Alert type='info' showIcon message={tLogs('live.animationSlowedHint')} />
		</div>
	);
}
