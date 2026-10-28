import { baseApi } from '@shared/api/baseApi';
import { runtimeConfig } from '@shared/config/runtimeConfig';
import type {
	AiHealth, ConnectorErrorExplanation, ExplainConnectorErrorRequest, ExplainWorkflowRequest, WorkflowExplanation, GenerateWorkflowRequest, InvokerDraft, SuggestMappingRequest, SuggestMappingResponse, InvokerDraftRequest, InvokerDraftResponse, RunExplanation, RunFailureRequest, RunFix, GenerateWorkflowResponse, PlanWorkflowResponse,
	RouteCommandRequest, RouteCommandResponse, SearchCommandsRequest, SearchCommandsResponse, TranscribeSpeechResponse,
} from '../model/aiGateway.types';

// The panel renders every gateway failure itself; the global error toast would duplicate it.
const quiet = { ignoreError: true };

export const aiApi = baseApi.injectEndpoints({
	endpoints: (b) => ({
		getAiHealth: b.query<AiHealth, void>({
			query: () => ({ url: `${runtimeConfig.aiUrl}/health`, customOptions: quiet }),
			keepUnusedDataFor: 0,
		}),
		planWorkflow: b.mutation<PlanWorkflowResponse, Omit<GenerateWorkflowRequest, 'plan'>>({
			query: (body) => ({
				url: `${runtimeConfig.aiUrl}/workflow/plan`,
				method: 'POST',
				body,
				customOptions: quiet,
			}),
		}),
		generateWorkflow: b.mutation<GenerateWorkflowResponse, GenerateWorkflowRequest>({
			query: (body) => ({
				url: `${runtimeConfig.aiUrl}/workflow/generate`,
				method: 'POST',
				body,
				customOptions: quiet,
			}),
		}),
		searchCommands: b.mutation<SearchCommandsResponse, SearchCommandsRequest>({
			query: (body) => ({
				url: `${runtimeConfig.aiUrl}/command/search`,
				method: 'POST',
				body,
				customOptions: quiet,
			}),
		}),
		transcribeSpeech: b.mutation<TranscribeSpeechResponse, Blob>({
			query: (wav) => ({
				url: `${runtimeConfig.aiUrl}/speech/transcribe`,
				method: 'POST',
				body: wav,
				headers: { 'Content-Type': 'audio/wav' },
				customOptions: quiet,
			}),
		}),
		explainRun: b.mutation<RunExplanation, RunFailureRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/run/explain`, method: 'POST', body, customOptions: quiet }),
		}),
		fixRun: b.mutation<RunFix, RunFailureRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/run/fix`, method: 'POST', body, customOptions: quiet }),
		}),
		draftInvoker: b.mutation<InvokerDraftResponse, InvokerDraftRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/invoker/draft`, method: 'POST', body, customOptions: quiet }),
		}),
		buildInvokerXml: b.mutation<{ xml: string }, { draft: InvokerDraft }>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/invoker/xml`, method: 'POST', body, customOptions: quiet }),
		}),
		suggestMapping: b.mutation<SuggestMappingResponse, SuggestMappingRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/mapping/suggest`, method: 'POST', body, customOptions: quiet }),
		}),
		explainWorkflow: b.mutation<WorkflowExplanation, ExplainWorkflowRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/workflow/explain`, method: 'POST', body, customOptions: quiet }),
		}),
		explainConnectorError: b.mutation<ConnectorErrorExplanation, ExplainConnectorErrorRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/connector/explain-error`, method: 'POST', body, customOptions: quiet }),
		}),
		routeCommand: b.mutation<RouteCommandResponse, RouteCommandRequest>({
			query: (body) => ({
				url: `${runtimeConfig.aiUrl}/command/route`,
				method: 'POST',
				body,
				customOptions: quiet,
			}),
		}),
	}),
});

export const {
	useGetAiHealthQuery, usePlanWorkflowMutation, useGenerateWorkflowMutation, useSearchCommandsMutation, useRouteCommandMutation,
	useTranscribeSpeechMutation, useExplainRunMutation, useFixRunMutation, useDraftInvokerMutation, useBuildInvokerXmlMutation, useExplainWorkflowMutation, useExplainConnectorErrorMutation,
} = aiApi;

export const isAiConfigured = (): boolean => Boolean(runtimeConfig.aiUrl);
