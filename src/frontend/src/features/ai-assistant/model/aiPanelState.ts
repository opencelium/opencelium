import type { GenerateWorkflowResponse } from './aiGateway.types';

export type AiGenerationFailure = 'generation-failed' | 'unknown-invoker' | 'unreachable';

export type AiGenerationState =
	| { status: 'idle' }
	| { status: 'generating'; startedAt: number }
	| { status: 'result'; prompt: string; response: GenerateWorkflowResponse }
	| { status: 'error'; failure: AiGenerationFailure; message?: string };

/** What the drawer body shows. `unavailable` comes from the health check, not from a generation. */
export type AiPanelView = AiGenerationState['status'] | 'unavailable';

export const AI_PROMPT_MAX_LENGTH = 2000;
