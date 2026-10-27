import type { WorkflowDsl } from './workflowDsl.schema';

/** Mirrors `src/ai-gateway/src/routes/*` responses. */
export type AiHealth = {
	status: 'ok' | 'degraded';
	ollama: { reachable: boolean; models: string[] };
	workflowModel: { name: string; available: boolean };
	invokerCount: number;
};

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
};

export type PlanPattern = 'sync' | 'custom';

export type PlanStep = { text: string; depth: number };

export type PlanWorkflowResponse = {
	pattern: PlanPattern;
	steps: PlanStep[];
	durationMs: number;
	model: string;
};

export type GenerateWorkflowResponse = {
	dsl: WorkflowDsl;
	issues: AiWorkflowIssue[];
	attempts: AiGenerationAttempt[];
	model: string;
};

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
export type RouteCommandResponse = {
	commandId: string | null;
	argument: string;
	reply: string;
	durationMs: number;
	model: string;
};

export type AiGatewayErrorType = 'BAD_REQUEST' | 'UNKNOWN_INVOKER' | 'GENERATION_FAILED';

export type AiGatewayErrorBody = {
	error: { type: AiGatewayErrorType; message: string; details?: unknown };
};
