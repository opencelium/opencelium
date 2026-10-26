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

export type AiGatewayErrorType = 'BAD_REQUEST' | 'UNKNOWN_INVOKER' | 'GENERATION_FAILED';

export type AiGatewayErrorBody = {
	error: { type: AiGatewayErrorType; message: string; details?: unknown };
};
