import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { Client } from '@stomp/stompjs';
import { apiExecutor } from '@shared/api/apiExecutor';
import { useStompSubscription } from '@shared/api/socket/useStompSubscription';
import type { SocketStatus } from '@shared/api/socket/types';
import type { TestRunPhase } from './TestRunContext';
import {
	hasConflictingTest,
	isOwnJobListed,
	type RunningJob,
} from './testRunJobs.utils';

type Result = [boolean, Dispatch<SetStateAction<boolean>>];

export const useConflictingTestRun = (client: Client | null, status: SocketStatus,
	phase: TestRunPhase, connectionTitle: string,
	ownSchedulerIdRef: RefObject<number | null>): Result => {
	const [isConflicting, setIsConflicting] = useState(false);
	const connectionTitleRef = useRef(connectionTitle);
	// Keep the original synchronous semantics: feed callbacks must see the title
	// from the current render before effects are flushed.
	// eslint-disable-next-line react-hooks/refs
	connectionTitleRef.current = connectionTitle;

	const handleRunningJobs = useCallback((jobs: RunningJob[]) => {
		if (ownSchedulerIdRef.current != null &&
			!isOwnJobListed(jobs, ownSchedulerIdRef.current)) ownSchedulerIdRef.current = null;
		setIsConflicting(
			hasConflictingTest(jobs, connectionTitleRef.current, ownSchedulerIdRef.current),
		);
	}, [ownSchedulerIdRef]);

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
			if (!cancelled) setIsConflicting(
				hasConflictingTest(jobs, connectionTitleRef.current, ownSchedulerIdRef.current),
			);
		})();
		return () => {
			cancelled = true;
		};
	}, [status, phase, ownSchedulerIdRef]);

	return [isConflicting, setIsConflicting];
};
