import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { message } from 'antd';
import type { IMessage } from '@stomp/stompjs';
import { useSocket } from '@shared/api/socket/useSocket';
import { apiExecutor } from '@shared/api/apiExecutor';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import {
	EMPTY_LIVE_LOG_TREE,
	failPendingNodes,
	reduceLiveLog,
	type ExecutionSocketLog,
} from '@features/logs';
import { testConnectionExecution } from '../api/connectionApi';
import {
	TestRunContext,
	type TestRunContextValue,
	type TestRunPhase,
	type TestRunResult,
} from './TestRunContext';

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
	const [phase, setPhase] = useState<TestRunPhase>('idle');
	const [logTree, setLogTree] = useState(EMPTY_LIVE_LOG_TREE);
	const [result, setResult] = useState<TestRunResult | null>(null);
	const schedulerIdRef = useRef<number | null>(null);
	const unsubscribeRef = useRef<(() => void) | null>(null);
	const startTimeRef = useRef(0);

	// The first outcome wins: a specific error line must not be overwritten by
	// the generic EXECUTION FAIL line that follows it.
	const settleResult = useCallback((next: TestRunResult) => {
		setResult((current) => current ?? next);
	}, []);

	const finishRun = useCallback(() => {
		unsubscribeRef.current?.();
		unsubscribeRef.current = null;
		schedulerIdRef.current = null;
		setPhase('idle');
		// No more lines will arrive — turn leftover spinners into red dots so
		// the user can see where an interrupted/failed run stopped.
		setLogTree(failPendingNodes);
	}, []);

	useEffect(() => () => unsubscribeRef.current?.(), []);

	// If the transport drops mid-run the backend can no longer reach this
	// channel — reset so the button doesn't stay stuck on "stop". The phase
	// reset is a render-phase adjustment; the subscription teardown stays in
	// an effect because it touches the external STOMP client.
	if (status !== 'connected' && phase !== 'idle') {
		setPhase('idle');
		// The run died with the connection — mark in-flight rows as failed.
		setLogTree(failPendingNodes);
		settleResult({ kind: 'stopped' });
	}
	useEffect(() => {
		if (status !== 'connected') {
			unsubscribeRef.current?.();
			unsubscribeRef.current = null;
			schedulerIdRef.current = null;
		}
	}, [status]);

	const handleSocketLog = useCallback(
		(log: ExecutionSocketLog) => {
			console.log(log)
			setLogTree((tree) => reduceLiveLog(tree, log));

			const isExecutionEnd =
				log.type === 'EXECUTION' && (log.status === 'COMPLETE' || log.status === 'FAIL');
			if (log.error?.message || (log.type === 'EXECUTION' && log.status === 'FAIL')) {
				settleResult({ kind: 'failed' });
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

	const startTest = useCallback(async () => {
		if (phase !== 'idle' || !client || status !== 'connected') return;
		const payload = buildTestPayload();
		if (!payload) return;

		const channelId = connectionId || crypto.randomUUID();
		setLogTree(EMPTY_LIVE_LOG_TREE);
		setResult(null);
		startTimeRef.current = Date.now();
		setPhase('starting');

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
			// The run may already have finished while the POST was in flight.
			if (unsubscribeRef.current) setPhase('running');
		} catch (err) {
			console.error(err);
			message.error(tEntities('connection.test.startFailed'));
			finishRun();
		}
	}, [phase, client, status, buildTestPayload, connectionId, handleSocketLog, finishRun, tEntities]);

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

	const value = useMemo<TestRunContextValue>(
		() => ({
			socketStatus: status,
			phase,
			logTree,
			result,
			startTest,
			stopTest,
			clearLogs,
		}),
		[status, phase, logTree, result, startTest, stopTest, clearLogs],
	);

	return <TestRunContext.Provider value={value}>{children}</TestRunContext.Provider>;
}
