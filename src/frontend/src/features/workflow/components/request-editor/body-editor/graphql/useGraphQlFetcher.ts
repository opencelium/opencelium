import { useCallback, useEffect, useRef } from 'react';
import type { Fetcher, FetcherParams } from '@graphiql/toolkit';
import { store } from '@app/store/store';
import { errorBus } from '@shared/errors/api/errorBus';
import { normalizeError } from '@shared/errors/api/normalizeError';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { playgroundApi } from '../../../../request-playground/model/playgroundApi';
import type { MethodWithId } from '../../../../types/connection';
import { buildGraphQlTestRequest, isGraphQlMutation, toGraphQlResult, type GraphQlResult } from './graphQlTestRequest';

/**
 * GraphiQL's requests (schema load and queries) go through the method test, so the backend signs
 * them in with the connector's credentials. A mutation changes the real system and is confirmed first.
 *
 * Dispatched on the app store, not via `useTestMethodMutation`: the editor renders inside the method
 * dialog's own Redux store, which has neither the API reducer nor the auth session, so a hook bound
 * to the nearest store never sends the request.
 */
export function useGraphQlFetcher(method: MethodWithId) {
	const { t } = useI18n('workflow');
	const confirm = useConfirm();
	// GraphiQL reloads the schema whenever the fetcher changes, and `method` changes on every
	// query edit, so the fetcher reads the latest method instead of depending on it.
	const methodRef = useRef(method);
	useEffect(() => { methodRef.current = method; }, [method]);

	return useCallback<Fetcher>(async (params: FetcherParams): Promise<GraphQlResult> => {
		if (isGraphQlMutation(params) && !await confirm({
			title: t('graphqlBody.confirmMutation.title'),
			message: t('graphqlBody.confirmMutation.message'),
		})) return { errors: [{ message: t('graphqlBody.mutationCancelled') }] };

		const response = await store.dispatch(playgroundApi.endpoints.testMethod.initiate(
			buildGraphQlTestRequest(methodRef.current, params), { track: false }));
		if ('data' in response && response.data) return toGraphQlResult(response.data);
		const appError = normalizeError(response.error);
		if (appError.type === 'UNAUTHORIZED' || appError.type === 'FORBIDDEN') errorBus.emit(appError);
		return { errors: [{ message: appError.serverMessage ?? t('graphqlBody.requestFailed') }] };
	}, [confirm, t]);
}
