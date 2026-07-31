import { useSubscriptionIssue } from '@entities/subscription/model/useSubscriptionIssue';
import { useTestRun } from '../../test-run/useTestRun';

export function useStartNodeState() {
	const testRun = useTestRun();
	const { issue: subscriptionIssue } = useSubscriptionIssue();
	const socketStatus = testRun?.socketStatus ?? 'idle';
	const phase = testRun?.phase ?? 'idle';
	const isSocketConnected = socketStatus === 'connected';
	const isSocketConnecting = socketStatus === 'idle' || socketStatus === 'connecting';
	const isRunning = phase === 'starting' || phase === 'running';
	const isBusy = phase === 'starting' || phase === 'stopping';
	const isSubscriptionBlocked = subscriptionIssue !== null && !isRunning;
	const isOtherTestRunning = testRun?.isOtherTestRunning ?? false;
	const isStartUnavailable = !isSocketConnected || isSubscriptionBlocked || isOtherTestRunning;

	const toggleTestRun = () => {
		if (!testRun || isStartUnavailable || isBusy) return;
		if (isRunning) void testRun.stopTest();
		else void testRun.startTest();
	};

	return {
		isBusy,
		isOtherTestRunning,
		isRunning,
		isSocketConnected,
		isSocketConnecting,
		isStartUnavailable,
		isSubscriptionBlocked,
		subscriptionIssue,
		testRun,
		toggleTestRun,
	};
}
