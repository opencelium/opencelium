import { useState } from 'react';
import { errorBus } from '@shared/errors/api/errorBus';
import { normalizeError } from '@shared/errors/api/normalizeError';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { notifyError } from '@shared/ui/feedback/notifyError';
import { buildStaticValues, findInvalidJsonInputKeys, isWriteMethod, listStaticInputKeys } from '../model/methodTestRefs';
import type { MethodTestResult, PlaygroundResult } from '../model/playground.types';
import { useTestMethodMutation } from '../model/playgroundApi';
import type { PlaygroundSession } from './usePlaygroundSession';
import type { PlaygroundValues } from './usePlaygroundValues';

type Args = {
	session: PlaygroundSession;
	values: PlaygroundValues;
	onInvalidInputs: (keys: string[]) => void;
};

export type PlaygroundRun = { number: number; connectionTitle: string | null };

const toResult = ({ request, response, durationMs, connectorErrors }: MethodTestResult): PlaygroundResult => {
	if (connectorErrors.length || !request || !response) return { kind: 'connectorErrors', errors: connectorErrors };
	return { kind: 'sent', request, response, durationMs: durationMs ?? 0 };
};

export function usePlaygroundSend({ session, values, onInvalidInputs }: Args) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const [trigger, { isLoading }] = useTestMethodMutation();
	const [result, setResult] = useState<PlaygroundResult | undefined>(undefined);
	const [run, setRun] = useState<PlaygroundRun | null>(null);
	const { draft, refs } = session;

	const execute = async () => {
		if (!refs.refs) return;
		const invalidKeys = findInvalidJsonInputKeys(listStaticInputKeys(refs.refs), values.values);
		if (invalidKeys.length) {
			onInvalidInputs(invalidKeys);
			notifyError(t('requestPlayground.values.invalidJsonSend', { count: invalidKeys.length }));
			return;
		}
		const httpMethod = (draft.request.method || 'GET').toUpperCase();
		const confirmWrite = isWriteMethod(httpMethod);
		if (confirmWrite && !await confirm({
			title: t('requestPlayground.confirmWrite.title'),
			message: t('requestPlayground.confirmWrite.message', { method: httpMethod }),
		})) return;

		values.persist();
		setRun((current) => ({ number: (current?.number ?? 0) + 1, connectionTitle: session.connector?.title ?? null }));
		const response = await trigger({
			method: draft,
			staticValues: buildStaticValues({ refs: refs.refs, values: values.values, connectorOverrides: values.requestData }),
			confirmWrite,
		});
		if ('data' in response && response.data) {
			setResult(toResult(response.data));
			return;
		}
		const appError = normalizeError(response.error);
		if (appError.type === 'UNAUTHORIZED' || appError.type === 'FORBIDDEN') {
			errorBus.emit(appError);
			setResult(undefined);
			return;
		}
		setResult({ kind: 'failed', message: appError.serverMessage ?? null });
		// Most failures (a missing static value above all) mean the reference list is stale.
		refs.refetch();
	};

	return {
		send: () => void execute(),
		result: isLoading ? undefined : result,
		isSending: isLoading,
		canSend: !!refs.refs && !refs.isLoading,
		run,
	};
}

export type PlaygroundSend = ReturnType<typeof usePlaygroundSend>;
