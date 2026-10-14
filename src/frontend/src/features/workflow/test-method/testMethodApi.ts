import { baseApi } from '@shared/api/baseApi';
import type { TestMethodRequest, TestMethodResponse } from './testMethod.types';

export const TEST_METHOD_URL = '/connection/method/test';

export const testMethodApi = baseApi.injectEndpoints({
	endpoints: (b) => ({
		testMethod: b.mutation<TestMethodResponse, TestMethodRequest>({
			query: (body) => ({ url: TEST_METHOD_URL, method: 'POST', body }),
		}),
	}),
});

export const { useTestMethodMutation } = testMethodApi;
