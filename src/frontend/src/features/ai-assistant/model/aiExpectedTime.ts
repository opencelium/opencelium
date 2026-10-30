export type AiWaitFeature =
	| 'command'
	| 'voice'
	| 'help'
	| 'script'
	| 'condition'
	| 'mapping'
	| 'notification'
	| 'connectorError'
	| 'runExplain'
	| 'runFix'
	| 'workflowExplain'
	| 'invokerDraft';

/**
 * Typical waits with qwen2.5-coder:14b on a local GPU, timed against the gateway (2026-10-30) and widened for larger
 * inputs. Workflow planning and building state their own, longer, ranges in their progress hints.
 */
export const AI_EXPECTED_SECONDS: Record<AiWaitFeature, { min: number; max: number }> = {
	command: { min: 3, max: 10 },
	voice: { min: 1, max: 5 },
	help: { min: 2, max: 10 },
	script: { min: 5, max: 20 },
	condition: { min: 5, max: 15 },
	mapping: { min: 5, max: 20 },
	notification: { min: 5, max: 15 },
	connectorError: { min: 10, max: 20 },
	runExplain: { min: 10, max: 30 },
	runFix: { min: 5, max: 20 },
	workflowExplain: { min: 10, max: 40 },
	invokerDraft: { min: 30, max: 90 },
};
