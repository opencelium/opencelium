import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { message } from 'antd';
import { apiExecutor } from '@shared/api/apiExecutor';
import { apiFetchWithHeaders } from '@shared/api/apiFetch';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { TestRunPhase, TestRunResult } from './TestRunContext';
import { clearActiveTestRun } from './testRunStorage';
import { useTestRunLeaveGuard } from './useTestRunLeaveGuard';
import { notifyError } from '@shared/ui/feedback/notifyError';

type Params = {
	phase: TestRunPhase;
	setPhase: Dispatch<SetStateAction<TestRunPhase>>;
	schedulerIdRef: MutableRefObject<number | null>;
	channelIdRef: MutableRefObject<string | null>;
	settleResult: (result: TestRunResult) => void;
	finishRun: () => void;
};

const terminateScheduler = (schedulerId: number) => apiExecutor({
	url: `/scheduler/terminate/${schedulerId}`,
	method: 'GET',
	options: { ignoreError: true },
});

export const useTestRunTermination = ({ phase, setPhase, schedulerIdRef,
	channelIdRef, settleResult, finishRun }: Params) => {
	const confirm = useConfirm();
	const { t } = useI18n('entities');

	const stopTest = useCallback(async () => {
		if (phase !== 'running' && phase !== 'starting') return;
		const schedulerId = schedulerIdRef.current;
		setPhase('stopping');
		if (schedulerId != null) {
			const response = await terminateScheduler(schedulerId);
			const failed = !!response && typeof response === 'object' &&
				('status' in response || 'error' in response);
			if (failed) {
				notifyError(t('connection.test.stopFailed'));
				setPhase('running');
				return;
			}
		}
		message.info(t('connection.test.terminated'));
		settleResult({ kind: 'stopped' });
		finishRun();
	}, [phase, schedulerIdRef, setPhase, settleResult, finishRun, t]);

	const confirmLeave = useCallback(async () => {
		const approved = await confirm({
			title: t('connection.test.leaveConfirm.title'),
			message: t('connection.test.leaveConfirm.message'),
		});
		if (!approved) return false;
		const schedulerId = schedulerIdRef.current;
		if (schedulerId != null) await terminateScheduler(schedulerId);
		finishRun();
		return true;
	}, [confirm, t, schedulerIdRef, finishRun]);

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
	}, [schedulerIdRef, channelIdRef]);

	useTestRunLeaveGuard(phase !== 'idle', confirmLeave, terminateOnUnload);
	return stopTest;
};
