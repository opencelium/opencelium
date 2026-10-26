import type { PlanStep } from '../model/aiGateway.types';

const INDENT = '  ';

/** The plan as the user edits it: one step per line, two spaces per nesting level. The gateway reads the same format. */
export function planToText(steps: PlanStep[]): string {
	return steps.map((step) => `${INDENT.repeat(Math.max(0, step.depth))}- ${step.text}`).join('\n');
}

export function hasPlanSteps(text: string): boolean {
	return text.split('\n').some((line) => line.replace(/^\s*[-*]?\s*/, '').trim() !== '');
}
