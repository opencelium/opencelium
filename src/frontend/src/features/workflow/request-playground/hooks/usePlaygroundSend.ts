import { useEffect, useRef, useState } from 'react';
import type { LoggedExecution } from '@features/logs';
import { addRecordedEnhancementOutputs } from '../model/recordedEnhancementOutputs';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useSocket } from '@shared/api/socket/useSocket';
import { sendExecutionRequest } from '../model/sendExecutionRequest';
import { notifyError } from '@shared/ui/feedback/notifyError';
import { buildPlaygroundRequest, findInvalidJsonInputKeys } from '../model/buildPlaygroundRequest';
import type { PlaygroundResponse, PlaygroundSettings } from '../model/playground.types';
import { useSendPlaygroundRequestMutation } from '../model/playgroundApi';
import type { PlaygroundSession } from './usePlaygroundSession';
import type { PlaygroundValues } from './usePlaygroundValues';

type SuccessResponse = Extract<PlaygroundResponse, { kind: 'success' }>;

type Args = {
	session: PlaygroundSession;
	values: PlaygroundValues;
	settings: PlaygroundSettings;
	connectionId: number | null;
	execution?: LoggedExecution;
	onInvalidInputs: (keys: string[]) => void;
	onSaveSample: (response: SuccessResponse) => void;
};

export type PlaygroundRun = { number: number; connectionTitle: string | null };

export function usePlaygroundSend({ session, values, settings, connectionId, execution, onInvalidInputs, onSaveSample }: Args) {
	const { t } = useI18n('workflow');
	const [trigger, { data, isLoading }] = useSendPlaygroundRequestMutation();
	const { client, status } = useSocket();
	const [replay, setReplay] = useState<{ pending: boolean; result?: PlaygroundResponse }>();
	const activeReplay = useRef<AbortController | null>(null);
	useEffect(() => () => activeReplay.current?.abort(), []);
	const [run, setRun] = useState<PlaygroundRun | null>(null);

	const execute = async () => {
		if (activeReplay.current || isLoading) return;
		if (values.prefillSource === 'execution') {
			if (values.resolvingKeys.length) return;
			const unavailable = Object.keys(values.values).filter((key) => values.values[key].source === 'empty');
			if (unavailable.length) {
				onInvalidInputs(unavailable);
				notifyError(t('requestPlayground.execution.valuesUnavailable'));
				return;
			}
		}
		const invalidKeys = findInvalidJsonInputKeys(session.inputs, values.values);
		if (invalidKeys.length) {
			onInvalidInputs(invalidKeys);
			notifyError(t('requestPlayground.values.invalidJsonSend', { count: invalidKeys.length }));
			return;
		}
		values.persist();
		setRun((current) => ({ number: (current?.number ?? 0) + 1, connectionTitle: session.connector?.title ?? null }));
		// Transport failures surface through errorBus like every other API call.
		const request = buildPlaygroundRequest({
			connectionId,
			connectorId: session.connectorId,
			draft: session.draft,
			fieldBindings: session.fieldBindings,
			inputs: session.inputs,
			values: values.values,
			prefillSource: values.prefillSource,
			requestData: values.requestData,
			settings,
		});
		if (values.prefillSource === 'execution') {
			if (!client || status !== 'connected') {
				setReplay({ pending: false, result: { kind: 'error', stage: 'connect',
					message: t('requestPlayground.execution.replayFailed') } });
				return;
			}
			const controller = new AbortController();
			activeReplay.current = controller;
			setReplay({ pending: true });
			try {
				if (request.fieldBindings.length && (!execution || !await addRecordedEnhancementOutputs(request, execution.method, controller.signal))) {
					setReplay({ pending: false, result: { kind: 'error', stage: 'enhancement',
						message: t('requestPlayground.execution.scriptReplayUnavailable') } });
					return;
				}
				const result = await sendExecutionRequest(client, request, controller.signal);
				if (controller.signal.aborted) return;
				setReplay({ pending: false, result });
				if (result.kind === 'success' && settings.saveResponseAsSample) onSaveSample(result);
			} catch {
				if (!controller.signal.aborted) setReplay({ pending: false, result: { kind: 'error', stage: 'connect',
					message: t('requestPlayground.execution.replayFailed') } });
			} finally {
				activeReplay.current = null;
			}
			return;
		}
		setReplay(undefined);
		const result = await trigger(request);
		if (result.data?.kind === 'success' && settings.saveResponseAsSample) onSaveSample(result.data);
	};

	return {
		send: () => void execute(),
		result: replay ? replay.result : isLoading ? undefined : data,
		isSending: isLoading || !!replay?.pending,
		run,
	};
}

export type PlaygroundSend = ReturnType<typeof usePlaygroundSend>;
