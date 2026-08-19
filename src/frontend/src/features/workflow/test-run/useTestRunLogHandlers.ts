import { useCallback, useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
	reduceLiveLog,
	type ExecutionSocketLog,
	type LiveLogTree,
} from '@features/logs';
import type { TestRunResult } from './TestRunContext';

const TIMEOUT_TO_COLLECT_LOGS = 3000;

type Params = {
	initialStartTime: number;
	setLogTree: Dispatch<SetStateAction<LiveLogTree>>;
	setRevealPending: Dispatch<SetStateAction<boolean>>;
	setErrorRevealNonce: Dispatch<SetStateAction<number>>;
	settleResult: (result: TestRunResult) => void;
	finishRun: () => void;
};

export const useTestRunLogHandlers = ({ initialStartTime, setLogTree,
	setRevealPending, setErrorRevealNonce, settleResult, finishRun }: Params) => {
	const startTimeRef = useRef(initialStartTime);
	const revealedErrorRef = useRef(false);
	const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => () => {
		if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
	}, []);

	const handleSocketLog = useCallback((log: ExecutionSocketLog) => {
		setLogTree((tree) => reduceLiveLog(tree, log));
		const executionEnd = log.type === 'EXECUTION' &&
			(log.status === 'COMPLETE' || log.status === 'FAIL');
		const failed = !!log.error?.message || log.type === 'EXECUTION' && log.status === 'FAIL';
		if (failed) {
			settleResult({ kind: 'failed' });
			if (!revealedErrorRef.current) {
				revealedErrorRef.current = true;
				setRevealPending(true);
				revealTimerRef.current = setTimeout(() => {
					setRevealPending(false);
					setErrorRevealNonce((nonce) => nonce + 1);
				}, TIMEOUT_TO_COLLECT_LOGS);
			}
		} else if (log.type === 'EXECUTION' && log.status === 'COMPLETE') {
			settleResult({ kind: 'finished',
				executionTimeMs: Date.now() - startTimeRef.current });
		}
		if (executionEnd || log.error?.message) finishRun();
	}, [finishRun, setErrorRevealNonce, setLogTree, setRevealPending, settleResult]);

	const handleOrphanLog = useCallback((log: ExecutionSocketLog) => {
		const executionEnd = log.type === 'EXECUTION' &&
			(log.status === 'COMPLETE' || log.status === 'FAIL');
		if (executionEnd || log.error?.message) finishRun();
	}, [finishRun]);

	const resetLogHandlers = useCallback((startedAt: number) => {
		revealedErrorRef.current = false;
		if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
		revealTimerRef.current = null;
		startTimeRef.current = startedAt;
	}, []);

	return { handleSocketLog, handleOrphanLog, resetLogHandlers };
};
