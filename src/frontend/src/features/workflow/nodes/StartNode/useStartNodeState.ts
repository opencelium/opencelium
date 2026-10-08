import { useSubscriptionIssue } from '@entities/subscription/model/useSubscriptionIssue';
import { useTestRun } from '../../test-run/useTestRun';
import { useTestRunStartPrompt } from '../../test-run/useTestRunStartPrompt';

export function useStartNodeState() {
	const testRun = useTestRun();
	const promptStart = useTestRunStartPrompt();
	const { issue: subscriptionIssue } = useSubscriptionIssue();
	const socketStatus = testRun?.socketStatus ?? 'idle';
	const phase = testRun?.phase ?? 'idle';
	// A simulated run is played locally (see simulatedTestRun.ts), so the transport,
	// the subscription and the one-test-at-a-time rule are all beside the point —
	// reporting them would leave the button disabled under a warning about a socket
	// the run never touches.
	const isSimulated = testRun?.isSimulated ?? false;
	const isSocketConnected = isSimulated || socketStatus === 'connected';
	const isSocketConnecting = !isSimulated && (socketStatus === 'idle' || socketStatus === 'connecting');
	const isRunning = phase === 'starting' || phase === 'running';
	const isBusy = phase === 'starting' || phase === 'stopping';
	const isSubscriptionBlocked = !isSimulated && subscriptionIssue !== null && !isRunning;
	const isOtherTestRunning = !isSimulated && (testRun?.isOtherTestRunning ?? false);
	const isStartUnavailable = !isSocketConnected || isSubscriptionBlocked || isOtherTestRunning;
	// The backend already finished (completed, failed or terminated) but the
	// paced animation is still playing. The main button still LOOKS like a
	// stop button, but clicking it must not fire a backend terminate — there
	// is nothing running anymore; it just ends the playback instead.
	const isReplaying = isRunning && (testRun?.isBackendDone ?? false);
	const isPlaybackBehind = testRun?.isPlaybackBehind ?? false;

	const skipToLive = () => testRun?.skipToLive();

	const toggleTestRun = () => {
		if (!testRun || isBusy) return;
		if (isReplaying) {
			testRun.skipToLive();
			return;
		}
		if (isStartUnavailable) return;
		if (isRunning) void testRun.stopTest();
		else promptStart();
	};

	return {
		isBusy,
		isOtherTestRunning,
		isPlaybackBehind,
		isReplaying,
		isRunning,
		isSocketConnected,
		isSocketConnecting,
		isStartUnavailable,
		isSubscriptionBlocked,
		skipToLive,
		subscriptionIssue,
		testRun,
		toggleTestRun,
	};
}
