import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { message } from 'antd';
import type { IMessage } from '@stomp/stompjs';
import { useSocket } from '@shared/api/socket/useSocket';
import { useStompSubscription } from '@shared/api/socket/useStompSubscription';
import { apiExecutor } from '@shared/api/apiExecutor';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import {
	EMPTY_LIVE_LOG_TREE,
	failPendingNodes,
	reduceLiveLog,
	type ExecutionSocketLog,
} from '@features/logs';
import { apiFetchWithHeaders } from '@shared/api/apiFetch';
import { testConnectionExecution } from '../api/connectionApi';
import {
	TestRunContext,
	type TestRunContextValue,
	type TestRunPhase,
	type TestRunResult,
} from './TestRunContext';
import { clearActiveTestRun, getActiveTestRun, saveActiveTestRun } from './testRunStorage';
import { useTestRunLeaveGuard } from './useTestRunLeaveGuard';
import {createId} from "@shared/lib/createId.ts";

// Backend names every temporary test scheduler "!*test_schedule_<millis>_<title>"
// (ConnectionController.test). The running-jobs feed lists them while they run,
// which is how we detect that a test is in progress anywhere in the system.
const TEST_SCHEDULE_TITLE_PREFIX = '!*test_schedule_';

type RunningJob = { schedulerId: number; title?: string };

const hasRunningTest = (jobs: unknown): boolean =>
	Array.isArray(jobs) &&
	jobs.some(
		(job) =>
			typeof (job as RunningJob)?.title === 'string' &&
			(job as RunningJob).title!.startsWith(TEST_SCHEDULE_TITLE_PREFIX),
	);

type Props = {
	connectionId?: string;
	// Returns the save-shaped connection body, or null when the graph is not
	// testable (the builder is responsible for surfacing the reason).
	buildTestPayload: () => unknown | null;
	children: ReactNode;
};

export function TestRunProvider({ connectionId, buildTestPayload, children }: Props) {
	const { client, status } = useSocket();
	const { t: tEntities } = useI18n('entities');
	const confirm = useConfirm();
	// Resume a run started in a previous page session that may still be executing
	// on the backend. Read once on first render, keyed by connectionId (which is
	// the STOMP channelId for a saved connection — see startTest). Seeds the
	// state and refs below so the stop button is shown without replaying logs.
	const [resumedRun] = useState(() => (connectionId ? getActiveTestRun(connectionId) : null));
	const [phase, setPhase] = useState<TestRunPhase>(resumedRun ? 'running' : 'idle');
	const [logTree, setLogTree] = useState(EMPTY_LIVE_LOG_TREE);
	const [result, setResult] = useState<TestRunResult | null>(null);
	const [isOrphaned, setIsOrphaned] = useState(!!resumedRun);
	// Whether any test run is executing system-wide (this workflow's or another's).
	const [isAnyTestRunning, setIsAnyTestRunning] = useState(false);
	// Bumped once per failed run so the logs panel reveals the failing element.
	const [errorRevealNonce, setErrorRevealNonce] = useState(0);
	const hasRevealedErrorRef = useRef(false);
	const schedulerIdRef = useRef<number | null>(resumedRun?.schedulerId ?? null);
	const channelIdRef = useRef<string | null>(resumedRun?.channelId ?? null);
	const unsubscribeRef = useRef<(() => void) | null>(null);
	const startTimeRef = useRef(resumedRun?.startedAt ?? 0);

	// The first outcome wins: a specific error line must not be overwritten by
	// the generic EXECUTION FAIL line that follows it.
	const settleResult = useCallback((next: TestRunResult) => {
		setResult((current) => current ?? next);
	}, []);

	const finishRun = useCallback(() => {
		unsubscribeRef.current?.();
		unsubscribeRef.current = null;
		if (channelIdRef.current) clearActiveTestRun(channelIdRef.current);
		channelIdRef.current = null;
		schedulerIdRef.current = null;
		setIsOrphaned(false);
		setPhase('idle');
		// No more lines will arrive — turn leftover spinners into red dots so
		// the user can see where an interrupted/failed run stopped.
		setLogTree(failPendingNodes);
	}, []);

	useEffect(() => () => unsubscribeRef.current?.(), []);

	// If the transport drops mid-run the backend can no longer reach this
	// channel — reset so the button doesn't stay stuck on "stop". The phase
	// reset is a render-phase adjustment; the subscription teardown stays in
	// an effect because it touches the external STOMP client. Orphaned runs are
	// exempt: their backend run outlives this page session, so we keep the stop
	// button while the socket (re)connects.
	if (status !== 'connected' && phase !== 'idle' && !isOrphaned) {
		setPhase('idle');
		// The run died with the connection — mark in-flight rows as failed.
		setLogTree(failPendingNodes);
		settleResult({ kind: 'stopped' });
	}
	useEffect(() => {
		if (status === 'connected') return;
		// Transport down: drop the now-dead subscription so it is re-created on
		// reconnect (the orphan-resume effect re-subscribes). A normal run also
		// forgets its schedulerId; an orphaned run keeps it so the user can still
		// terminate the backend execution after the socket comes back.
		unsubscribeRef.current?.();
		unsubscribeRef.current = null;
		if (!isOrphaned) schedulerIdRef.current = null;
	}, [status, isOrphaned]);

	const handleSocketLog = useCallback(
		(log: ExecutionSocketLog) => {
			console.log(log)
			setLogTree((tree) => reduceLiveLog(tree, log));

			const isExecutionEnd =
				log.type === 'EXECUTION' && (log.status === 'COMPLETE' || log.status === 'FAIL');
			if (log.error?.message || (log.type === 'EXECUTION' && log.status === 'FAIL')) {
				settleResult({ kind: 'failed' });
				// First failure of the run drives the panel to expand to the error.
				// The tree (with the error node) is updated in the same batch above.
				if (!hasRevealedErrorRef.current) {
					hasRevealedErrorRef.current = true;
					setErrorRevealNonce((n) => n + 1);
				}
			} else if (log.type === 'EXECUTION' && log.status === 'COMPLETE') {
				settleResult({
					kind: 'finished',
					executionTimeMs: Date.now() - startTimeRef.current,
				});
			}
			if (isExecutionEnd || log.error?.message) finishRun();
		},
		[settleResult, finishRun],
	);

	// Orphaned runs can't replay the logs they already emitted, so we don't
	// rebuild the tree — we only watch for the end line to clear the stop button.
	const handleOrphanLog = useCallback(
		(log: ExecutionSocketLog) => {
			const isExecutionEnd =
				log.type === 'EXECUTION' && (log.status === 'COMPLETE' || log.status === 'FAIL');
			if (isExecutionEnd || log.error?.message) finishRun();
		},
		[finishRun],
	);

	// A run that finished while the page was closed leaves a stale localStorage
	// record: its end line went to a topic nobody was subscribed to, so the
	// orphan subscription above will never receive it and the stop button would
	// hang forever. Verify liveness once on resume against the backend's
	// running-jobs list (the debug test scheduler is listed there while it runs)
	// and clear the stale state when the run is already gone.
	useEffect(() => {
		if (!isOrphaned) return;
		let cancelled = false;
		void (async () => {
			const schedulerId = schedulerIdRef.current;
			// No schedulerId means the run was never confirmed started — treat as done.
			if (schedulerId == null) {
				finishRun();
				return;
			}
			const running = (await apiExecutor({
				url: '/scheduler/running/all',
				method: 'GET',
				options: { ignoreError: true },
			})) as { schedulerId: number }[] | { status?: number; error?: unknown };
			if (cancelled) return;
			// On a failed request, keep the stop button rather than guess.
			if (!Array.isArray(running)) return;
			if (!running.some((job) => job?.schedulerId === schedulerId)) finishRun();
		})();
		return () => {
			cancelled = true;
		};
	}, [isOrphaned, finishRun]);

	// Subscribe an orphaned run once the socket is up so a still-running backend
	// execution can clear the stop button when it finishes.
	useEffect(() => {
		if (!isOrphaned || status !== 'connected' || !client) return;
		if (unsubscribeRef.current) return;
		const channelId = channelIdRef.current;
		if (!channelId) return;
		const subscription = client.subscribe(`/execution/logs/${channelId}`, (frame: IMessage) => {
			try {
				handleOrphanLog(JSON.parse(frame.body) as ExecutionSocketLog);
			} catch (err) {
				console.error('[test-run] failed to parse execution log', err);
			}
		});
		unsubscribeRef.current = () => subscription.unsubscribe();
	}, [isOrphaned, status, client, handleOrphanLog]);

	// Only one workflow test may run at a time system-wide. Track the global set
	// of running test schedulers: live via the running-jobs feed, plus an initial
	// REST snapshot (the feed only pushes on job start/finish, so a test already
	// running at page load wouldn't be seen otherwise). Re-snapshot whenever our
	// own run settles so the block lifts promptly.
	const handleRunningJobs = useCallback((jobs: RunningJob[]) => {
		setIsAnyTestRunning(hasRunningTest(jobs));
	}, []);
	useStompSubscription<RunningJob[]>(
		client,
		status === 'connected',
		'/scheduler/running/all',
		handleRunningJobs,
	);
	useEffect(() => {
		if (status !== 'connected' || phase !== 'idle') return;
		let cancelled = false;
		void (async () => {
			const jobs = await apiExecutor({
				url: '/scheduler/running/all',
				method: 'GET',
				options: { ignoreError: true },
			});
			if (!cancelled) setIsAnyTestRunning(hasRunningTest(jobs));
		})();
		return () => {
			cancelled = true;
		};
	}, [status, phase]);

	const startTest = useCallback(async () => {
		if (phase !== 'idle' || !client || status !== 'connected') return;
		// Enforce the system-wide single-test rule (the button is also disabled,
		// this guards against a race where another test started moments ago).
		if (isAnyTestRunning) {
			message.error(tEntities('connection.test.otherTestRunning'));
			return;
		}
		const payload = buildTestPayload();
		if (!payload) return;

		const channelId = connectionId || createId();
		channelIdRef.current = channelId;
		const startedAt = Date.now();
		setLogTree(EMPTY_LIVE_LOG_TREE);
		setResult(null);
		setIsOrphaned(false);
		hasRevealedErrorRef.current = false;
		startTimeRef.current = startedAt;
		setPhase('starting');
		// Persist before the run is triggered so a page reload mid-test can still
		// detect the active run. The schedulerId is filled in once the POST returns.
		saveActiveTestRun({ channelId, schedulerId: null, startedAt });

		// Subscribe before triggering the run so the first PENDING lines are not lost.
		const subscription = client.subscribe(`/execution/logs/${channelId}`, (frame: IMessage) => {
			try {
				handleSocketLog(JSON.parse(frame.body) as ExecutionSocketLog);
			} catch (err) {
				console.error('[test-run] failed to parse execution log', err);
			}
		});
		unsubscribeRef.current = () => subscription.unsubscribe();

		try {
			const response = await testConnectionExecution(payload, channelId);
			schedulerIdRef.current = response.data?.schedulerId ?? null;
			// The run may have finished (and cleared the record) while the POST was
			// in flight — only persist the schedulerId if this run is still active.
			if (channelIdRef.current === channelId) {
				saveActiveTestRun({ channelId, schedulerId: schedulerIdRef.current, startedAt });
			}
			// The run may already have finished while the POST was in flight.
			if (unsubscribeRef.current) setPhase('running');
		} catch (err) {
			console.error(err);
			message.error(tEntities('connection.test.startFailed'));
			finishRun();
		}
	}, [phase, client, status, isAnyTestRunning, buildTestPayload, connectionId, handleSocketLog, finishRun, tEntities]);

	const stopTest = useCallback(async () => {
		if (phase !== 'running' && phase !== 'starting') return;
		const schedulerId = schedulerIdRef.current;
		setPhase('stopping');
		if (schedulerId != null) {
			const response = await apiExecutor({
				url: `/scheduler/terminate/${schedulerId}`,
				method: 'GET',
				options: { ignoreError: true },
			});
			// apiExecutor returns the RTK error object instead of throwing.
			const isTerminateFailed =
				!!response && typeof response === 'object' &&
				('status' in response || 'error' in response);
			if (isTerminateFailed) {
				// The run is still alive on the backend — keep the subscription
				// and the stop button so the user can retry.
				message.error(tEntities('connection.test.stopFailed'));
				setPhase('running');
				return;
			}
		}
		message.info(tEntities('connection.test.terminated'));
		settleResult({ kind: 'stopped' });
		finishRun(); // unsubscribes from the socket
	}, [phase, settleResult, finishRun, tEntities]);

	const clearLogs = useCallback(() => {
		if (phase !== 'idle') return;
		setLogTree(EMPTY_LIVE_LOG_TREE);
		setResult(null);
	}, [phase]);

	// Leaving the page mid-test: confirm, then terminate the backend run before
	// the navigation proceeds. Returns whether the navigation should continue.
	const confirmLeaveDuringTest = useCallback(async () => {
		const ok = await confirm({
			title: tEntities('connection.test.leaveConfirm.title'),
			message: tEntities('connection.test.leaveConfirm.message'),
		});
		if (!ok) return false;
		// Best-effort terminate — the user has chosen to leave regardless of the
		// outcome; a survivor is picked up by the orphan-resume on return.
		const schedulerId = schedulerIdRef.current;
		if (schedulerId != null) {
			await apiExecutor({
				url: `/scheduler/terminate/${schedulerId}`,
				method: 'GET',
				options: { ignoreError: true },
			});
		}
		finishRun();
		return true;
	}, [confirm, tEntities, finishRun]);

	// Tab close / reload: the document is unloading and React state is gone, so
	// fire a best-effort keepalive terminate (outlives the page) and drop the
	// stored record so the run isn't resumed as an orphan on reopen. No await —
	// the request is sent and the page is free to die.
	const terminateOnUnload = useCallback(() => {
		const schedulerId = schedulerIdRef.current;
		if (schedulerId != null) {
			void apiFetchWithHeaders(`/scheduler/terminate/${schedulerId}`, {
				method: 'GET',
				keepalive: true,
				timeoutMs: null,
			});
		}
		if (channelIdRef.current) clearActiveTestRun(channelIdRef.current);
	}, []);

	useTestRunLeaveGuard(phase !== 'idle', confirmLeaveDuringTest, terminateOnUnload);

	// Another workflow's test is blocking us only when we have no run of our own.
	const isOtherTestRunning = phase === 'idle' && isAnyTestRunning;

	const value = useMemo<TestRunContextValue>(
		() => ({
			socketStatus: status,
			phase,
			logTree,
			result,
			isOrphaned,
			isOtherTestRunning,
			errorRevealNonce,
			startTest,
			stopTest,
			clearLogs,
		}),
		[status, phase, logTree, result, isOrphaned, isOtherTestRunning, errorRevealNonce, startTest, stopTest, clearLogs],
	);

	return <TestRunContext.Provider value={value}>{children}</TestRunContext.Provider>;
}
