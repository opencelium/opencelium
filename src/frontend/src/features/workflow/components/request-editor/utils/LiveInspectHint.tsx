import { Hint } from '@shared/ui/primitives/Hint';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTestRun } from '../../../test-run/useTestRun';

// Says out loud what the ring on an inspectable reference invites — the
// highlight makes it noticeable, this makes it understandable. Renders nothing
// unless a test run is actually paused, which is the only state where any
// reference can be inspected at all.
export function LiveInspectHint() {
	const { t } = useI18n('workflow');
	const isPaused = useTestRun()?.isPaused ?? false;
	if (!isPaused) return null;

	return (
		<div className='wfLiveInspectHint' data-testid='workflow-live-inspect-hint'>
			<Hint noPrefix>{t('references.pausedHint')}</Hint>
		</div>
	);
}
