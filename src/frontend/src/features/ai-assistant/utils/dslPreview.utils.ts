import type { AiWorkflowIssue } from '../model/aiGateway.types';
import {
	type CompatibilityIssue, checkNashornCompatibility,
} from '@features/workflow/script-sandbox/checkNashornCompatibility';
import type { DslValue, FieldValue, LoopStep, StepRef, WorkflowDsl, WorkflowStep } from '../model/workflowDsl.schema';

export type PreviewRef = { kind: 'ref'; source: string; path: string };

export type PreviewValue =
	| { kind: 'literal'; text: string }
	| PreviewRef
	| { kind: 'script'; description: string; code: string; inputs: PreviewRef[]; problems: CompatibilityIssue[] };

type StepIndex = Map<string, WorkflowStep>;

function indexSteps(steps: WorkflowStep[], index: StepIndex = new Map()): StepIndex {
	for (const step of steps) {
		index.set(step.id, step);
		if (step.kind === 'if') indexSteps(step.then, index);
		if (step.kind === 'loop') indexSteps(step.body, index);
	}
	return index;
}

function joinPath(prefix: string, path: string): string {
	return prefix && path ? `${prefix}.${path}` : prefix || path;
}

/** A loop element reads as the array it iterates, e.g. `GetIssues › issues[]`. */
function resolveRef(index: StepIndex, ref: StepRef, seen: Set<string> = new Set()): { source: string; path: string } {
	const target = index.get(ref.step);
	if (target?.kind === 'method') return { source: target.operation, path: ref.path };
	if (target?.kind === 'loop' && !seen.has(target.id)) {
		const array = resolveLoopArray(index, target, new Set([...seen, target.id]));
		return { source: array.source, path: joinPath(array.path, ref.path) };
	}
	return { source: ref.step, path: ref.path };
}

function resolveLoopArray(index: StepIndex, loop: LoopStep, seen: Set<string>): { source: string; path: string } {
	const over = resolveRef(index, loop.over, seen);
	return { source: over.source, path: `${over.path}[]` };
}

export type DslPreview = {
	stepCount: number;
	describeValue: (value: DslValue | FieldValue) => PreviewValue;
	describeLoopSource: (loop: LoopStep) => PreviewValue;
	/** Display name of a step for issue titles: the operation, or the loop/if kind. */
	stepLabel: (stepId: string) => string | undefined;
};

export function buildDslPreview(dsl: WorkflowDsl): DslPreview {
	const index = indexSteps(dsl.steps);
	return {
		stepCount: index.size,
		describeValue: (value) => {
			if ('literal' in value) return { kind: 'literal', text: value.literal };
			if ('ref' in value) return { kind: 'ref', ...resolveRef(index, value.ref) };
			const { inputs, code, description } = value.script;
			return {
				kind: 'script', description, code,
				inputs: inputs.map((input) => ({ kind: 'ref', ...resolveRef(index, input) })),
				// The editor's own check, so the preview flags what the transformation editor would.
				problems: checkNashornCompatibility(code),
			};
		},
		describeLoopSource: (loop) => ({ kind: 'ref', ...resolveLoopArray(index, loop, new Set([loop.id])) }),
		stepLabel: (stepId) => {
			const step = index.get(stepId);
			return step?.kind === 'method' ? step.operation : step?.kind;
		},
	};
}

/** Gateway issues name the assignment they concern (`Field "x" …`, `Param "x" …`); others belong to the step. */
export function issuesForAssignment(issues: AiWorkflowIssue[], stepId: string, name: string): AiWorkflowIssue[] {
	return issues.filter((issue) => issue.stepId === stepId
		&& (issue.message.startsWith(`Field "${name}"`) || issue.message.startsWith(`Param "${name}"`)));
}
