import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { notifyError } from '@shared/ui/feedback/notifyError';
import { buildPlaygroundRequest, findInvalidJsonInputKeys } from '../model/buildPlaygroundRequest';
import type { PlaygroundResponse, PlaygroundSettings } from '../model/playground.types';
import { useSendPlaygroundRequestMutation } from '../model/playgroundApi';
import { isWriteConfirmedForSession, setWriteConfirmedForSession } from '../model/playgroundStorage';
import type { PlaygroundSession } from './usePlaygroundSession';
import type { PlaygroundValues } from './usePlaygroundValues';

const READ_ONLY_VERBS = new Set(['GET', 'HEAD', 'OPTIONS']);

type SuccessResponse = Extract<PlaygroundResponse, { kind: 'success' }>;

type Args = {
	session: PlaygroundSession;
	values: PlaygroundValues;
	settings: PlaygroundSettings;
	connectionId: number | null;
	onInvalidInputs: (keys: string[]) => void;
	onSaveSample: (response: SuccessResponse) => void;
};

export type PlaygroundRun = { number: number; connectionTitle: string | null };

export function usePlaygroundSend({ session, values, settings, connectionId, onInvalidInputs, onSaveSample }: Args) {
	const { t } = useI18n('workflow');
	const [trigger, { data, isLoading }] = useSendPlaygroundRequestMutation();
	const [isWarningVisible, setIsWarningVisible] = useState(false);
	const [run, setRun] = useState<PlaygroundRun | null>(null);
	const verb = (session.draft.request.method || 'GET').toUpperCase();

	const execute = async () => {
		setIsWarningVisible(false);
		const invalidKeys = findInvalidJsonInputKeys(session.inputs, values.values);
		if (invalidKeys.length) {
			onInvalidInputs(invalidKeys);
			notifyError(t('requestPlayground.values.invalidJsonSend', { count: invalidKeys.length }));
			return;
		}
		values.persist();
		setRun((current) => ({ number: (current?.number ?? 0) + 1, connectionTitle: session.connector?.title ?? null }));
		// Transport failures surface through errorBus like every other API call.
		const result = await trigger(buildPlaygroundRequest({
			connectionId,
			connectorId: session.connectorId,
			draft: session.draft,
			fieldBindings: session.fieldBindings,
			inputs: session.inputs,
			values: values.values,
			prefillSource: values.prefillSource,
			requestData: values.requestData,
			settings,
		}));
		if (result.data?.kind === 'success' && settings.saveResponseAsSample) onSaveSample(result.data);
	};

	// Testing is not a dry run: a POST or DELETE really changes the remote system.
	const send = () => {
		if (!READ_ONLY_VERBS.has(verb) && !isWriteConfirmedForSession()) {
			setIsWarningVisible(true);
			return;
		}
		void execute();
	};

	const sendAnyway = (isConfirmedForSession: boolean) => {
		if (isConfirmedForSession) setWriteConfirmedForSession(true);
		void execute();
	};

	return {
		send,
		sendAnyway,
		cancelWarning: () => setIsWarningVisible(false),
		isWarningVisible,
		verb,
		result: isLoading ? undefined : data,
		isSending: isLoading,
		run,
	};
}

export type PlaygroundSend = ReturnType<typeof usePlaygroundSend>;
