import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { Client, IMessage } from '@stomp/stompjs';
import { apiExecutor } from '@shared/api/apiExecutor';
import type { SocketStatus } from '@shared/api/socket/types';
import type { ExecutionSocketLog } from '@features/logs';

type Params = {
	isOrphaned: boolean;
	status: SocketStatus;
	client: Client | null;
	schedulerIdRef: RefObject<number | null>;
	channelIdRef: RefObject<string | null>;
	unsubscribeRef: RefObject<(() => void) | null>;
	finishRun: () => void;
	handleOrphanLog: (log: ExecutionSocketLog) => void;
};

export const useOrphanedTestRun = ({ isOrphaned, status, client,
	schedulerIdRef, channelIdRef, unsubscribeRef, finishRun, handleOrphanLog }: Params) => {
	useEffect(() => {
		if (!isOrphaned) return;
		let cancelled = false;
		void (async () => {
			const schedulerId = schedulerIdRef.current;
			if (schedulerId == null) {
				finishRun();
				return;
			}
			const running = (await apiExecutor({
				url: '/scheduler/running/all',
				method: 'GET',
				options: { ignoreError: true },
			})) as { schedulerId: number }[] | { status?: number; error?: unknown };
			if (!cancelled && Array.isArray(running) &&
				!running.some((job) => job?.schedulerId === schedulerId)) finishRun();
		})();
		return () => {
			cancelled = true;
		};
	}, [isOrphaned, schedulerIdRef, finishRun]);

	useEffect(() => {
		if (!isOrphaned || status !== 'connected' || !client || unsubscribeRef.current) return;
		const channelId = channelIdRef.current;
		if (!channelId) return;
		const subscription = client.subscribe(`/execution/logs/${channelId}`, (frame: IMessage) => {
			try {
				handleOrphanLog(JSON.parse(frame.body) as ExecutionSocketLog);
			} catch (error) {
				console.error('[test-run] failed to parse execution log', error);
			}
		});
		unsubscribeRef.current = () => subscription.unsubscribe();
	}, [isOrphaned, status, client, channelIdRef, unsubscribeRef, handleOrphanLog]);
};
