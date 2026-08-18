import { IconButton } from '@shared/ui/primitives/IconButton';
import { Slider } from '@shared/ui/primitives/Slider';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useTestRun } from '../../test-run/useTestRun';
import { ANIMATION_SPEED_STEP, MAX_ANIMATION_SPEED, MIN_ANIMATION_SPEED } from '../../test-run/animationSpeed';

const formatSpeed = (value?: number) => `${(value ?? 1).toFixed(2).replace(/\.?0+$/, '')}x`;

// Pause/play and the speed slider are two controls over the SAME thing — the
// paced test-run replay — so they live in one card instead of as two
// separate floating pieces that happen to sit next to each other. Reads as
// one "debug the replay" feature: pause it, then dial the pace once resumed.
// Same visibility as TestRunAnimationHint: hidden while idle (nothing
// playing) or in Live mode (no pacing to pause or tune).
export function TestRunDebugControls() {
	const { t: tLogs } = useI18n('logs');
	const testRun = useTestRun();
	if (!testRun || testRun.phase === 'idle' || testRun.isLiveAnimation) return null;

	const pauseTooltip = tLogs(testRun.isPaused ? 'live.resumeTooltip' : 'live.pauseTooltip');
	// Stepping only makes sense once frozen, and only as far as what has
	// actually been buffered — isPlaybackBehind is exactly "is there a next
	// line waiting" (see TestRunContextValue).
	const canStepForward = testRun.isPaused && testRun.isPlaybackBehind;

	return (
		<div className="testRunDebugPanel" data-testid="workflow-test-debug-panel">
			<Tooltip content={pauseTooltip}>
				<IconButton
					iconProps={{ name: testRun.isPaused ? 'play' : 'pause', color: 'primary' }}
					onClick={() => (testRun.isPaused ? testRun.resumeAnimation() : testRun.pauseAnimation())}
					testId="workflow-test-pause-button"
				/>
			</Tooltip>
			<Tooltip content={tLogs('live.stepForwardTooltip')}>
				{/* span keeps the tooltip reachable on hover even while the button itself is disabled */}
				<span style={{ display: 'inline-flex' }}>
					<IconButton
						iconProps={{ name: 'step-forward', color: 'primary' }}
						onClick={() => testRun.stepForward()}
						disabled={!canStepForward}
						testId="workflow-test-step-forward-button"
					/>
				</span>
			</Tooltip>
			<span className="testRunDebugDivider" aria-hidden />
			<Tooltip content={tLogs('live.speedTooltip')}>
				<div className="testRunDebugSpeed" data-testid="workflow-test-speed-control">
					<span className="testRunDebugSpeedLabel">{tLogs('live.speedLabel')}</span>
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
					<span className="testRunDebugSpeedValue">{formatSpeed(testRun.animationSpeed)}</span>
				</div>
			</Tooltip>
		</div>
	);
}
