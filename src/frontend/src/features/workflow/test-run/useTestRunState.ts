import { useCallback, useRef, useState } from 'react';
import { EMPTY_LIVE_LOG_TREE, failPendingNodes } from '@features/logs';
import type { TestRunPhase, TestRunResult } from './TestRunContext';
import { clearActiveTestRun, getActiveTestRun } from './testRunStorage';

export const useTestRunState = (connectionId?: string) => {
	const [resumedRun] = useState(() => connectionId ? getActiveTestRun(connectionId) : null);
	const [phase, setPhase] = useState<TestRunPhase>(resumedRun ? 'running' : 'idle');
	const [logTree, setLogTree] = useState(EMPTY_LIVE_LOG_TREE);
	const [result, setResult] = useState<TestRunResult | null>(null);
	const [isOrphaned, setIsOrphaned] = useState(!!resumedRun);
	const [errorRevealNonce, setErrorRevealNonce] = useState(0);
	const [revealPending, setRevealPending] = useState(false);
	const schedulerIdRef = useRef<number | null>(resumedRun?.schedulerId ?? null);
	const ownSchedulerIdRef = useRef<number | null>(resumedRun?.schedulerId ?? null);
	const channelIdRef = useRef<string | null>(resumedRun?.channelId ?? null);
	const unsubscribeRef = useRef<(() => void) | null>(null);

	const settleResult = useCallback((next: TestRunResult) => {
		setResult((current) => current ?? next);
	}, []);
	const finishRun = useCallback((clearConflict: () => void) => {
		unsubscribeRef.current?.();
		unsubscribeRef.current = null;
		if (channelIdRef.current) clearActiveTestRun(channelIdRef.current);
		channelIdRef.current = null;
		schedulerIdRef.current = null;
		setIsOrphaned(false);
		setPhase('idle');
		clearConflict();
		setLogTree(failPendingNodes);
	}, []);
	const prepareRun = useCallback((startedAt: number, resetHandlers: (time: number) => void) => {
		setLogTree(EMPTY_LIVE_LOG_TREE);
		setResult(null);
		setIsOrphaned(false);
		setRevealPending(false);
		resetHandlers(startedAt);
		setPhase('starting');
	}, []);
	const clearLogs = useCallback(() => {
		if (phase !== 'idle') return;
		setLogTree(EMPTY_LIVE_LOG_TREE);
		setResult(null);
	}, [phase]);

	return { resumedRun, phase, setPhase, logTree, setLogTree, result,
		isOrphaned, setIsOrphaned, errorRevealNonce, setErrorRevealNonce,
		revealPending, setRevealPending, schedulerIdRef, ownSchedulerIdRef,
		channelIdRef, unsubscribeRef, settleResult, finishRun, prepareRun, clearLogs };
};
