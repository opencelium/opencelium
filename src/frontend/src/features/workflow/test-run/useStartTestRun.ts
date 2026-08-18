import { useCallback } from 'react';
import type { RefObject } from 'react';
import { message } from 'antd';
import type { Client, IMessage } from '@stomp/stompjs';
import type { SocketStatus } from '@shared/api/socket/types';
import { createId } from '@shared/lib/createId';
import type { ExecutionSocketLog } from '@features/logs';
import { testConnectionExecution } from '../api/connectionApi';
import { RESOLVED_WORKFLOW_ERROR_MESSAGE_DURATION_SEC } from '../utils/workflowApiErrors';
import type { TestRunPhase } from './TestRunContext';
import { saveActiveTestRun } from './testRunStorage';

type Params = {
	phase: TestRunPhase;
	client: Client | null;
	status: SocketStatus;
	isConflicting: boolean;
	connectionId?: string;
	buildPayload: () => unknown | null;
	resolveError?: (error: unknown) => string | null;
	conflictMessage: string;
	startFailedMessage: string;
	schedulerIdRef: RefObject<number | null>;
	ownSchedulerIdRef: RefObject<number | null>;
	channelIdRef: RefObject<string | null>;
	unsubscribeRef: RefObject<(() => void) | null>;
	prepareRun: (startedAt: number) => void;
	markRunning: () => void;
	handleLog: (log: ExecutionSocketLog) => void;
	finishRun: () => void;
};

const hasActiveSubscription = (ref: RefObject<(() => void) | null>) =>
	ref.current !== null;

export const useStartTestRun = ({ phase, client, status, isConflicting,
	connectionId, buildPayload, resolveError, conflictMessage, startFailedMessage,
	schedulerIdRef, ownSchedulerIdRef, channelIdRef, unsubscribeRef,
	prepareRun, markRunning, handleLog, finishRun }: Params) => useCallback(async () => {
	if (phase !== 'idle' || !client || status !== 'connected') return;
	if (isConflicting) {
		message.error(conflictMessage);
		return;
	}
	const payload = buildPayload();
	if (!payload) return;

	const channelId = connectionId || createId();
	const startedAt = Date.now();
	channelIdRef.current = channelId;
	prepareRun(startedAt);
	saveActiveTestRun({ channelId, schedulerId: null, startedAt });

	const subscription = client.subscribe(`/execution/logs/${channelId}`, (frame: IMessage) => {
		try {
			handleLog(JSON.parse(frame.body) as ExecutionSocketLog);
		} catch (error) {
			console.error('[test-run] failed to parse execution log', error);
		}
	});
	unsubscribeRef.current = () => subscription.unsubscribe();

	try {
		const response = await testConnectionExecution(payload, channelId);
		schedulerIdRef.current = response.data?.schedulerId ?? null;
		ownSchedulerIdRef.current = schedulerIdRef.current;
		if (channelIdRef.current === channelId) {
			saveActiveTestRun({ channelId, schedulerId: schedulerIdRef.current, startedAt });
		}
		if (hasActiveSubscription(unsubscribeRef)) markRunning();
	} catch (error) {
		console.error(error);
		const specificMessage = resolveError?.(error);
		message.error(
			specificMessage ?? startFailedMessage,
			specificMessage ? RESOLVED_WORKFLOW_ERROR_MESSAGE_DURATION_SEC : undefined,
		);
		finishRun();
	}
}, [phase, client, status, isConflicting, connectionId, buildPayload, resolveError,
	conflictMessage, startFailedMessage, schedulerIdRef, ownSchedulerIdRef, channelIdRef,
	unsubscribeRef, prepareRun, markRunning, handleLog, finishRun]);
