import { useCallback } from 'react';
import type { Fetcher, FetcherParams } from '@graphiql/toolkit';
import { errorBus } from '@shared/errors/api/errorBus';
import { normalizeError } from '@shared/errors/api/normalizeError';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useTestMethodMutation } from '../../../../request-playground/model/playgroundApi';
import type { MethodWithId } from '../../../../types/connection';
import { buildGraphQlTestRequest, isGraphQlMutation, toGraphQlResult, type GraphQlResult } from './graphQlTestRequest';

/**
 * GraphiQL's requests (schema load and queries) go through the method test, so the backend signs
 * them in with the connector's credentials. A mutation changes the real system and is confirmed first.
 */
export function useGraphQlFetcher(method: MethodWithId) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	const [testMethod] = useTestMethodMutation();

	return useCallback<Fetcher>(async (params: FetcherParams): Promise<GraphQlResult> => {
		if (isGraphQlMutation(params) && !await confirm({
			title: t('graphqlBody.confirmMutation.title'),
			message: t('graphqlBody.confirmMutation.message'),
		})) return { errors: [{ message: t('graphqlBody.mutationCancelled') }] };

		const response = await testMethod(buildGraphQlTestRequest(method, params));
		if ('data' in response && response.data) return toGraphQlResult(response.data);
		const appError = normalizeError(response.error);
		if (appError.type === 'UNAUTHORIZED' || appError.type === 'FORBIDDEN') errorBus.emit(appError);
		return { errors: [{ message: appError.serverMessage ?? t('graphqlBody.requestFailed') }] };
	}, [confirm, method, t, testMethod]);
}
