import { useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
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
	onInvalidInputs: (keys: string[]) => void;
	onSaveSample: (response: SuccessResponse) => void;
};

export type PlaygroundRun = { number: number; connectionTitle: string | null };

export function usePlaygroundSend({ session, values, settings, connectionId, onInvalidInputs, onSaveSample }: Args) {
	const { t } = useI18n('workflow');
	const [trigger, { data, isLoading }] = useSendPlaygroundRequestMutation();
	const [run, setRun] = useState<PlaygroundRun | null>(null);

	const execute = async () => {
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

	return {
		send: () => void execute(),
		result: isLoading ? undefined : data,
		isSending: isLoading,
		run,
	};
}

export type PlaygroundSend = ReturnType<typeof usePlaygroundSend>;
