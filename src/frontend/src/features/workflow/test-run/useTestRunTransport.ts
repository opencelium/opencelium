import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { SocketStatus } from '@shared/api/socket/types';
import { failPendingNodes, type LiveLogTree } from '@features/logs';
import type { TestRunPhase, TestRunResult } from './TestRunContext';

type Params = {
	status: SocketStatus;
	phase: TestRunPhase;
	isOrphaned: boolean;
	setPhase: Dispatch<SetStateAction<TestRunPhase>>;
	setLogTree: Dispatch<SetStateAction<LiveLogTree>>;
	settleResult: (result: TestRunResult) => void;
	schedulerIdRef: MutableRefObject<number | null>;
	unsubscribeRef: MutableRefObject<(() => void) | null>;
};

export const useTestRunTransport = ({ status, phase, isOrphaned, setPhase,
	setLogTree, settleResult, schedulerIdRef, unsubscribeRef }: Params) => {
	if (status !== 'connected' && phase !== 'idle' && !isOrphaned) {
		setPhase('idle');
		setLogTree(failPendingNodes);
		settleResult({ kind: 'stopped' });
	}

	useEffect(() => () => {
		unsubscribeRef.current?.();
	}, [unsubscribeRef]);

	useEffect(() => {
		if (status === 'connected') return;
		unsubscribeRef.current?.();
		unsubscribeRef.current = null;
		if (!isOrphaned) schedulerIdRef.current = null;
	}, [status, isOrphaned, schedulerIdRef, unsubscribeRef]);
};
