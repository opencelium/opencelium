import { baseApi } from '@shared/api/baseApi';
import { runtimeConfig } from '@shared/config/runtimeConfig';
import type { AiHealth, GenerateWorkflowRequest, GenerateWorkflowResponse } from '../model/aiGateway.types';

// The panel renders every gateway failure itself; the global error toast would duplicate it.
const quiet = { ignoreError: true };

export const aiApi = baseApi.injectEndpoints({
	endpoints: (b) => ({
		getAiHealth: b.query<AiHealth, void>({
			query: () => ({ url: `${runtimeConfig.aiUrl}/health`, customOptions: quiet }),
			keepUnusedDataFor: 0,
		}),
		generateWorkflow: b.mutation<GenerateWorkflowResponse, GenerateWorkflowRequest>({
			query: (body) => ({
				url: `${runtimeConfig.aiUrl}/workflow/generate`,
				method: 'POST',
				body,
				customOptions: quiet,
			}),
		}),
	}),
});

export const { useGetAiHealthQuery, useGenerateWorkflowMutation } = aiApi;

export const isAiConfigured = (): boolean => Boolean(runtimeConfig.aiUrl);
