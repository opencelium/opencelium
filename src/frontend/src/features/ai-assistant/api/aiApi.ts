import { baseApi } from '@shared/api/baseApi';
import { runtimeConfig } from '@shared/config/runtimeConfig';
import type {
	AiHealth, ConditionSuggestion, SuggestConditionRequest, LoopSuggestion, SuggestLoopRequest, ConnectorErrorExplanation, DraftNotificationRequest, NotificationDraft, ExplainConnectorErrorRequest, ExplainWorkflowRequest, WorkflowExplanation, GenerateWorkflowRequest, InvokerDraft, SuggestMappingRequest, SuggestMappingResponse, InvokerDraftRequest, InvokerDraftResponse, RunExplanation, RunFailureRequest, RunFix, GenerateWorkflowResponse, PlanWorkflowResponse,
	RouteCommandRequest, RouteCommandResponse, RouteGuideRequest, RouteGuideResponse, AddMethodIntentRequest, AddMethodIntentResponse, AddOperatorIntentRequest, AddOperatorIntentResponse, MappingIntentRequest, MappingIntentResponse, TransformationIntentRequest, TransformationIntentResponse, SearchCommandsRequest, SearchCommandsResponse, TranscribeSpeechResponse, AiGatewaySettings, AiSettingsResponse,
} from '../model/aiGateway.types';

// The panel renders every gateway failure itself; the global error toast would duplicate it.
const quiet = { ignoreError: true };

const speechQuery = (params: Record<string, string | undefined>) => {
	const query = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])));
	return query.size ? `?${query}` : '';
};

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
		getAiSettings: b.query<AiSettingsResponse, void>({
			query: () => ({ url: `${runtimeConfig.aiUrl}/settings`, customOptions: quiet }),
			keepUnusedDataFor: 0,
		}),
		updateAiSettings: b.mutation<AiSettingsResponse, AiGatewaySettings>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/settings`, method: 'PUT', body, customOptions: quiet }),
		}),
		transcribeSpeech: b.mutation<TranscribeSpeechResponse, { wav: Blob; vocabulary?: string; language?: 'en' | 'de' }>({
			query: ({ wav, vocabulary, language }) => ({
				url: `${runtimeConfig.aiUrl}/speech/transcribe${speechQuery({ vocabulary, language })}`,
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
		draftNotification: b.mutation<NotificationDraft, DraftNotificationRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/notification/draft`, method: 'POST', body, customOptions: quiet }),
		}),
		suggestCondition: b.mutation<ConditionSuggestion, SuggestConditionRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/condition/suggest`, method: 'POST', body, customOptions: quiet }),
		}),
		suggestLoop: b.mutation<LoopSuggestion, SuggestLoopRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/condition/loop`, method: 'POST', body, customOptions: quiet }),
		}),
		routeGuide: b.mutation<RouteGuideResponse, RouteGuideRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/guide/intent`, method: 'POST', body, customOptions: quiet }),
		}),
		readAddMethod: b.mutation<AddMethodIntentResponse, AddMethodIntentRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/workflow/add-method/intent`, method: 'POST', body, customOptions: quiet }),
		}),
		readAddOperator: b.mutation<AddOperatorIntentResponse, AddOperatorIntentRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/workflow/add-operator/intent`, method: 'POST', body, customOptions: quiet }),
		}),
		readMapping: b.mutation<MappingIntentResponse, MappingIntentRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/workflow/mapping/intent`, method: 'POST', body, customOptions: quiet }),
		}),
		readTransformation: b.mutation<TransformationIntentResponse, TransformationIntentRequest>({
			query: (body) => ({ url: `${runtimeConfig.aiUrl}/workflow/transformation/intent`, method: 'POST', body, customOptions: quiet }),
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
	useGetAiHealthQuery, useGetAiSettingsQuery, useUpdateAiSettingsMutation, usePlanWorkflowMutation, useGenerateWorkflowMutation, useSearchCommandsMutation, useRouteCommandMutation,
	useTranscribeSpeechMutation, useExplainRunMutation, useFixRunMutation, useDraftInvokerMutation, useBuildInvokerXmlMutation, useExplainWorkflowMutation, useExplainConnectorErrorMutation, useDraftNotificationMutation,
} = aiApi;

export const isAiConfigured = (): boolean => Boolean(runtimeConfig.aiUrl);
