import { useCallback, useMemo } from 'react';
import { useSocket } from '@shared/api/socket/useSocket';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import {
	TestRunContext,
	type TestRunContextValue,
} from './TestRunContext';
import type { TestRunProviderProps } from './TestRunProvider.types';
import { useTestRunLogHandlers } from './useTestRunLogHandlers';
import { useOrphanedTestRun } from './useOrphanedTestRun';
import { useConflictingTestRun } from './useConflictingTestRun';
import { useStartTestRun } from './useStartTestRun';
import { useTestRunTermination } from './useTestRunTermination';
import { useTestRunTransport } from './useTestRunTransport';
import { useTestRunState } from './useTestRunState';
export function TestRunProvider({ connectionId, connectionTitle = '', buildTestPayload,
	onResolveStartError, children }: TestRunProviderProps) {
	const { client, status } = useSocket();
	const { t: tEntities } = useI18n('entities');
	// Resume a run started in a previous page session that may still be executing
	// on the backend. Read once on first render, keyed by connectionId (which is
	// the STOMP channelId for a saved connection — see startTest). Seeds the
	// state and refs below so the stop button is shown without replaying logs.
	const run = useTestRunState(connectionId);
	const { resumedRun, phase, setPhase, logTree, setLogTree, result, isOrphaned,
		errorRevealNonce, setErrorRevealNonce, revealPending, setRevealPending,
		schedulerIdRef, ownSchedulerIdRef, channelIdRef, unsubscribeRef,
		settleResult, clearLogs } = run;
	const [isConflictingTestRunning, setIsConflictingTestRunning] = useConflictingTestRun(
		client, status, phase, connectionTitle, ownSchedulerIdRef,
	);

	// The first outcome wins: a specific error line must not be overwritten by
	// the generic EXECUTION FAIL line that follows it.
	const finishRun = useCallback(() => run.finishRun(
		() => setIsConflictingTestRunning(false),
	), [run.finishRun, setIsConflictingTestRunning]);

	const { handleSocketLog, handleOrphanLog, resetLogHandlers } = useTestRunLogHandlers({
		initialStartTime: resumedRun?.startedAt ?? 0,
		setLogTree,
		setRevealPending,
		setErrorRevealNonce,
		settleResult,
		finishRun,
	});

	useTestRunTransport({ status, phase, isOrphaned, setPhase, setLogTree,
		settleResult, schedulerIdRef, unsubscribeRef });
	useOrphanedTestRun({ isOrphaned, status, client, schedulerIdRef,
		channelIdRef, unsubscribeRef, finishRun, handleOrphanLog });

	const prepareRun = useCallback((startedAt: number) =>
		run.prepareRun(startedAt, resetLogHandlers), [run.prepareRun, resetLogHandlers]);
	const markRunAsRunning = useCallback(() => setPhase('running'), []);
	const startTest = useStartTestRun({ phase, client, status,
		isConflicting: isConflictingTestRunning, connectionId, buildPayload: buildTestPayload,
		resolveError: onResolveStartError,
		conflictMessage: tEntities('connection.test.otherTestRunning'),
		startFailedMessage: tEntities('connection.test.startFailed'), schedulerIdRef,
		ownSchedulerIdRef, channelIdRef, unsubscribeRef, prepareRun, markRunning: markRunAsRunning,
		handleLog: handleSocketLog, finishRun });

	const stopTest = useTestRunTermination({ phase, setPhase, schedulerIdRef,
		channelIdRef, settleResult, finishRun });

	// A test for this connection running elsewhere blocks us only when we have no
	// run of our own.
	const isOtherTestRunning = phase === 'idle' && isConflictingTestRunning;

	const value = useMemo<TestRunContextValue>(
		() => ({
			socketStatus: status,
			phase,
			logTree,
			result,
			isOrphaned,
			isOtherTestRunning,
			errorRevealNonce,
			revealPending,
			startTest,
			stopTest,
			clearLogs,
		}),
		[status, phase, logTree, result, isOrphaned, isOtherTestRunning, errorRevealNonce, revealPending, startTest, stopTest, clearLogs],
	);

	return <TestRunContext.Provider value={value}>{children}</TestRunContext.Provider>;
}
