import { baseApi } from '@shared/api/baseApi';
import type { MethodTestRefs, MethodTestRequest, MethodTestResult, PlaygroundDraft } from './playground.types';

const METHOD_TEST_URL = '/connection/method/test';

// Errors are handled by the playground itself: /refs runs while the user edits the
// request, and a failed /test is a test result shown in the response panel.
export const playgroundApi = baseApi.injectEndpoints({
	endpoints: (b) => ({
		getMethodTestRefs: b.query<MethodTestRefs, PlaygroundDraft>({
			query: (method) => ({ url: `${METHOD_TEST_URL}/refs`, method: 'POST', body: method,
				customOptions: { ignoreError: true } }),
			keepUnusedDataFor: 0,
		}),
		testMethod: b.mutation<MethodTestResult, MethodTestRequest>({
			query: (body) => ({ url: METHOD_TEST_URL, method: 'POST', body, customOptions: { ignoreError: true } }),
		}),
	}),
});

export const { useGetMethodTestRefsQuery, useTestMethodMutation } = playgroundApi;
