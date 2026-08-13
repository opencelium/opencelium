import { Slider } from '@shared/ui/primitives/Slider';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTestRun } from '../../test-run/useTestRun';
import { ANIMATION_SPEED_STEP, MAX_ANIMATION_SPEED, MIN_ANIMATION_SPEED } from '../../test-run/animationSpeed';

const formatSpeed = (value?: number) => `${(value ?? 1).toFixed(2).replace(/\.?0+$/, '')}x`;

// Lets the user speed up or slow down the paced test-run animation (see
// playbackQueue.ts) while it's playing — same visibility as
// TestRunAnimationHint, which explains the pacing this control adjusts:
// hidden while idle (nothing playing) and in live mode (no pacing to tune,
// every line already shows the instant it arrives). Rendered as a plain flex
// item, not its own Panel — WorkflowCanvas docks it inside the same top-left
// Panel as the zoom Controls so it sits to their right instead of needing its
// own absolute-position bookkeeping.
export function TestRunSpeedControl() {
	const { t: tLogs } = useI18n('logs');
	const testRun = useTestRun();
	if (!testRun || testRun.phase === 'idle' || testRun.isLiveAnimation) return null;

	return (
		<Tooltip content={tLogs('live.speedTooltip')}>
			<div className="canvasSpeedControl" data-testid="workflow-test-speed-control">
				<span className="canvasSpeedControlLabel">{tLogs('live.speedLabel')}</span>
				<Slider
					value={testRun.animationSpeed}
					min={MIN_ANIMATION_SPEED}
					max={MAX_ANIMATION_SPEED}
					step={ANIMATION_SPEED_STEP}
					onChange={testRun.setAnimationSpeed}
					tooltipFormatter={formatSpeed}
					testId="workflow-test-speed-slider"
					style={{ width: 90 }}
				/>
				<span className="canvasSpeedControlValue">{formatSpeed(testRun.animationSpeed)}</span>
			</div>
		</Tooltip>
	);
}
