import type { WorkflowDsl } from './workflowDsl.schema';

/** Mirrors `src/ai-gateway/src/routes/*` responses. */
export type AiHealth = {
	status: 'ok' | 'degraded';
	ollama: { reachable: boolean; models: string[] };
	workflowModel: { name: string; available: boolean };
	invokerCount: number;
	/** Missing from gateways older than voice input. */
	speech?: { available: boolean };
};

export type TranscribeSpeechResponse = { text: string; language: string | null; durationMs: number };

export type AiWorkflowIssue = {
	stepId: string;
	severity: 'error' | 'warning';
	message: string;
};

export type AiGenerationAttempt = {
	promptTokens: number;
	outputTokens: number;
	durationMs: number;
	errorCount: number;
};

export type GenerateWorkflowRequest = {
	prompt: string;
	from: string;
	to?: string;
	/** The reviewed plan, one step per line, two spaces of indentation per level; the gateway builds it step by step. */
	plan?: string;
	/** False plans and builds without the installation's templates as examples; the gateway defaults to true. */
	useTemplates?: boolean;
};

/** A stored template the gateway showed the model as a worked example. */
export type AiTemplateRef = { id: string; name: string };

export type PlanPattern = 'sync' | 'custom';

export type PlanStep = { text: string; depth: number };

export type PlanWorkflowResponse = {
	pattern: PlanPattern;
	steps: PlanStep[];
	durationMs: number;
	model: string;
	/** Missing from gateways older than template-guided planning. */
	templates?: AiTemplateRef[];
};

export type GenerateWorkflowResponse = {
	dsl: WorkflowDsl;
	issues: AiWorkflowIssue[];
	attempts: AiGenerationAttempt[];
	model: string;
	/** Distinct template scripts shown to the model as examples; missing from gateways older than the switch. */
	templateExampleCount?: number;
	/** Templates whose flow the build followed; missing from gateways older than template-guided planning. */
	templates?: AiTemplateRef[];
	/** Operations shown with how templates call them; missing from gateways older than operation usage examples. */
	operationExampleCount?: number;
};

/** A request header as the AI reads it: references written out, not as the editor's tokens. */
export type RunHeader = { name: string; value: string };

/** Mirrors `runFailureSchema` in `src/ai-gateway/src/run/runFailure.ts`: what a failed test run tells the AI. */
export type RunFailureRequest = {
	language: 'en' | 'de';
	workflowTitle: string;
	failure: {
		kind: 'method' | 'loop' | 'if' | 'execution';
		message: string;
		stepName: string;
		system: string;
		operation: string;
		/** Loops and ifs around the failing element, outermost first. */
		context: string[];
		request?: { method: string; url: string; body?: string };
		response?: { status: string; body?: string };
	};
	/** The failing method as configured, references unresolved. */
	step?: { url: string; body: string; headers: RunHeader[] };
	earlierSteps: { color: string; name: string; operation: string; system: string }[];
	/** The explanation the user sees, sent with a fix so the fix follows it. */
	diagnosis?: { cause: string; fix: string[] };
};

export type RunExplanation = {
	summary: string;
	cause: string;
	fix: string[];
	/** True when a corrected request body is likely enough: "Fix with AI" is offered only then. */
	isRequestFixable: boolean;
	durationMs: number;
	model: string;
};

export type RunFix = {
	/** The corrected request body as text (JSON for JSON bodies). */
	body: string;
	/** All the step's headers after the fix; missing from gateways older than header fixes. */
	headers?: RunHeader[];
	changes: string[];
	/** Rule violations the gateway could not repair; shown beside the proposal. */
	problems: string[];
	durationMs: number;
	model: string;
};

/** Mirrors `src/ai-gateway/src/invokerDraft/invokerDraft.schema.ts`: an invoker described from API docs. */
export type InvokerDraftField = { name: string; type: 'string' | 'number' | 'boolean' | 'object' | 'array'; children: InvokerDraftField[] };

export type InvokerDraftBody = { type: 'object' | 'array'; fields: InvokerDraftField[] };

export type InvokerDraftOperation = {
	name: string;
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	/** After the base URL; {name} placeholders become workflow params. */
	path: string;
	summary: string;
	group: string;
	request: InvokerDraftBody | null;
	response: InvokerDraftBody & { status: string };
};

export type InvokerDraftAuthKind = 'none' | 'basic' | 'bearer' | 'apikeyHeader' | 'apikeyQuery';

export type InvokerDraft = {
	name: string;
	description: string;
	hint: string;
	category: string;
	auth: { kind: InvokerDraftAuthKind; keyName: string };
	baseUrl: string;
	operations: InvokerDraftOperation[];
	testOperation: string;
};

export type InvokerDraftRequest = { docs: string; name: string };

export type InvokerDraftResponse = {
	draft: InvokerDraft;
	/** `openapi`: converted exactly from the spec; `ai`: read from the docs by the model, to be checked. */
	source: 'openapi' | 'ai';
	/** The docs were longer than the model reads; later parts are missing from the draft. */
	isTruncated: boolean;
	durationMs: number;
};

/** Mirrors `src/ai-gateway/src/mapping/suggestMapping.ts`: which earlier value fills each body field of a step. */
export type SuggestMappingRequest = {
	language: 'en' | 'de';
	instruction: string;
	target: { step: string; operation: string; system: string; fields: { path: string; current: string }[] };
	sources: { id: string; step: string; system: string; path: string }[];
};

export type MappingSuggestion = { field: string; source: string; reason: string };

export type SuggestMappingResponse = { suggestions: MappingSuggestion[]; durationMs: number; model: string };

/** Mirrors `src/ai-gateway/src/explain/explainWorkflow.ts`. */
export type ExplainWorkflowRequest = { language: 'en' | 'de'; title: string; outline: string };

export type WorkflowExplanation = { description: string; explanation: string[]; durationMs: number; model: string };

/** Mirrors `src/ai-gateway/src/connectorError/explainConnectorError.ts`. */
export type ExplainConnectorErrorRequest = {
	language: 'en' | 'de';
	connector: string;
	invoker: string;
	status: 'DOWN' | 'AUTH_FAILED' | 'UNKNOWN';
	error: string;
};

export type ConnectorErrorExplanation = {
	summary: string;
	cause: string;
	checks: string[];
	/** Where the fix is; the UI offers the connector's settings only for `connector`. */
	fixIn: 'connector' | 'remoteSystem' | 'network';
	kind: string;
	durationMs: number;
	model: string;
};

/** Mirrors `src/ai-gateway/src/notification/draftNotification.ts`. */
export type DraftNotificationRequest = {
	language: 'en' | 'de';
	type: string;
	templateName: string;
	instruction: string;
	placeholders: { token: string; description: string }[];
	current: { subject: string; body: string };
};

export type NotificationDraft = {
	subject: string;
	body: string;
	/** Placeholders the model invented; removed from the text. */
	removedPlaceholders: string[];
	durationMs: number;
	model: string;
};

/** Mirrors `src/ai-gateway/src/condition/suggestCondition.ts`. */
export type SuggestConditionRequest = {
	language: 'en' | 'de';
	instruction: string;
	sources: { id: string; step: string; system: string; path: string }[];
};

export type SuggestedConditionRule = {
	left: string;
	operator: string;
	right: { kind: 'none' } | { kind: 'value'; value: string } | { kind: 'source'; source: string };
};

export type ConditionSuggestion = {
	conjunction: 'and' | 'or';
	not: boolean;
	rules: SuggestedConditionRule[];
	explanation: string;
	durationMs: number;
	model: string;
};

/** Mirrors `src/ai-gateway/src/help/answerHelp.ts`. */
export type HelpMessage = { role: 'user' | 'assistant'; content: string };

export type HelpRequest = {
	language: 'en' | 'de';
	messages: HelpMessage[];
	page: string;
	commands: CommandCatalogItem[];
};

export type HelpSource = { n: number; title: string; url: string };

/** What `/help/ask` streams, one JSON object per line. */
export type HelpEvent =
	| { type: 'sources'; question: string; sources: HelpSource[] }
	| { type: 'delta'; text: string }
	| { type: 'done'; commands: string[] }
	| { type: 'error'; message: string };

/** Mirrors `src/ai-gateway/src/script/generateScript.ts`. */
export type GenerateScriptRequest = {
	prompt: string;
	target: string;
	inputs: { name: string; source: string; sample?: string }[];
	currentScript: string;
};

export type GenerateScriptResponse = {
	code: string;
	description: string;
	/** Rule violations still left after the gateway's repair attempt; the editor's own check shows them too. */
	problems: string[];
	durationMs: number;
	model: string;
};

/** Mirrors `src/ai-gateway/src/command/commandRequest.schema.ts`. */
export type CommandCatalogItem = { id: string; phrase: string; description: string };

export type SearchCommandsRequest = { query: string; commands: CommandCatalogItem[]; limit?: number };
export type SearchCommandsResponse = { matches: { id: string; score: number }[] };

export type RouteCommandRequest = { prompt: string; commands: CommandCatalogItem[]; page: string; language: 'en' | 'de' };
/** Mirrors `CommandIntent` in `src/ai-gateway/src/command/extractIntent.ts`: values for a create command's form. */
export type CommandIntent =
	| { kind: 'schedule'; workflow: string; title: string; cronExp: string }
	| { kind: 'connector'; system: string; title: string; description: string }
	| { kind: 'workflow'; source: 'template' | 'ai' | 'empty'; template: string; from: string; to: string; title: string; task: string };

export type RouteCommandResponse = {
	commandId: string | null;
	argument: string;
	reply: string;
	/** Present for create commands the gateway can fill (schedule, connector, workflow). */
	intent?: CommandIntent | null;
	/** The request asks how, why or what; missing from gateways older than the help assistant. */
	isQuestion?: boolean;
	durationMs: number;
	model: string;
};

/** Mirrors `routeGuideRequestSchema` in `src/ai-gateway/src/guide/guideRequest.schema.ts`. */
export type RouteGuideRequest = {
	prompt: string;
	guides: { id: string; description: string }[];
	/** Method names in the open workflow; the answer names one of these or none. */
	methods: string[];
};

export type RouteGuideResponse = {
	guideId: string | null;
	/** Empty when the request names no method. */
	method: string;
	durationMs: number;
	model: string;
};

export type AiGatewayErrorType = 'BAD_REQUEST' | 'UNKNOWN_INVOKER' | 'GENERATION_FAILED';

export type AiGatewayErrorBody = {
	error: { type: AiGatewayErrorType; message: string; details?: unknown };
};
