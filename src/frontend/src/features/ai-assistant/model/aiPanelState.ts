import type { GenerateWorkflowResponse, PlanPattern } from './aiGateway.types';

export type AiGenerationFailure = 'generation-failed' | 'unknown-invoker' | 'unreachable';

/** Which request a failure came from, so "Try again" repeats that one. */
export type AiGenerationStage = 'plan' | 'build';

/** Prompt → plan (reviewed, editable) → built workflow. The plan text itself lives beside this state. */
export type AiGenerationState =
	| { status: 'idle' }
	| { status: 'planning'; startedAt: number }
	| { status: 'plan'; pattern: PlanPattern }
	| { status: 'generating'; startedAt: number }
	| { status: 'result'; prompt: string; response: GenerateWorkflowResponse }
	| { status: 'error'; stage: AiGenerationStage; failure: AiGenerationFailure; message?: string };

/** What the drawer shows. A failure stays on the stage it came from; `unavailable` comes from the health check. */
export type AiPanelView = 'prompt' | 'planning' | 'plan' | 'building' | 'result' | 'unavailable';

export function toPanelView(state: AiGenerationState): Exclude<AiPanelView, 'unavailable'> {
	switch (state.status) {
		case 'idle': return 'prompt';
		case 'planning': return 'planning';
		case 'plan': return 'plan';
		case 'generating': return 'building';
		case 'result': return 'result';
		case 'error': return state.stage === 'plan' ? 'prompt' : 'plan';
		default: {
			const _exhaustive: never = state;
			return _exhaustive;
		}
	}
}

export const AI_PROMPT_MAX_LENGTH = 2000;

/** The gateway accepts up to 6000; the plan editor keeps a margin for its indentation. */
export const AI_PLAN_MAX_LENGTH = 5000;

/** Why Apply is unavailable for the current result, if it is. */
export type AiApplyBlock = 'errors' | 'locked' | null;
