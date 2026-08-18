import { useState } from 'react';
import { Alert } from '@shared/ui/primitives/Alert';
import { Checkbox } from '@shared/ui/primitives/Checkbox';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTestRun } from '../../test-run/useTestRun';
import { dismissAnimationHint, isAnimationHintDismissed } from '../../test-run/animationHintStorage';

// A visible reminder, floating over the canvas for the whole time a test run
// (or its post-completion replay) is animating, that the graph's highlight
// pace is deliberately slowed down for clarity — it does not reflect the
// actual backend execution speed (see playbackQueue.ts). Suppressed in live
// mode (the logs panel's "Live" toggle), since there is no slowdown to explain
// there — every line is shown the instant it arrives. Also permanently
// dismissible via its own checkbox (see animationHintStorage.ts) for users who
// already know this.
export function TestRunAnimationHint() {
	const { t: tLogs } = useI18n('logs');
	const testRun = useTestRun();
	const [dismissed, setDismissed] = useState(isAnimationHintDismissed);

	if (!testRun || testRun.phase === 'idle' || testRun.isLiveAnimation || dismissed) return null;

	return (
		<div className='canvasAnimationHint'>
			<Alert
				type='info'
				showIcon
				className='canvasAnimationHintAlert'
				message={tLogs('live.animationSlowedHint')}
				description={
					<Checkbox
						label={tLogs('live.dontShowAgain')}
						checked={false}
						onChange={(checked) => {
							if (!checked) return;
							dismissAnimationHint();
							setDismissed(true);
						}}
						testId='workflow-animation-hint-dont-show-again'
					/>
				}
			/>
		</div>
	);
}
