import { useCallback } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import type { TestMethodRequest } from './testMethod.types';
import { useTestMethodMutation } from './testMethodApi';

const READ_ONLY_VERBS = new Set(['GET', 'HEAD', 'OPTIONS']);

type Args = {
	verb: string;
	buildRequest: () => TestMethodRequest;
	onBeforeSend: () => void;
};

export function useTestMethodSend({ verb, buildRequest, onBeforeSend }: Args) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const [trigger, { data, isLoading }] = useTestMethodMutation();

	const send = useCallback(async () => {
		const normalizedVerb = verb.toUpperCase();
		// Testing is not a dry run: a POST or DELETE really changes the remote system.
		if (!READ_ONLY_VERBS.has(normalizedVerb)) {
			const isConfirmed = await confirm({
				title: t('testMethod.confirmWrite.title'),
				message: t('testMethod.confirmWrite.message', { method: normalizedVerb }),
			});
			if (!isConfirmed) return;
		}
		onBeforeSend();
		// Transport failures surface through errorBus like every other API call.
		await trigger(buildRequest());
	}, [buildRequest, confirm, onBeforeSend, t, trigger, verb]);

	return { send, result: data, isSending: isLoading };
}
