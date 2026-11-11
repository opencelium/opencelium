import type { WorkflowUndoOrigin } from '../types/undoHistory.types';

/** A dialog's draft at one moment, and whether the AI or the user brought it there. */
export type AiDialogStep<TDraft> = { draft: TDraft; origin: WorkflowUndoOrigin; at: number };

export type AiDialogSteps<TDraft> = {
	/** Starts a dialog session from what the dialog opened with. */
	start: (baseline: TDraft) => void;
	/** One AI apply inside the dialog; returns a function that forgets it again (its Undo). */
	record: (before: TDraft, after: TDraft) => () => void;
	/** Ends the session and hands over its steps, oldest first. */
	take: () => AiDialogStep<TDraft>[];
};

/**
 * A dialog writes the graph once, on save, so AI applies inside it would vanish into that one history entry. This
 * remembers the draft around each apply: the user's edits up to it (when there were any) and the AI's result, so the
 * save can record them as entries of their own before the final state.
 */
export function createAiDialogSteps<TDraft>(identity: (draft: TDraft) => string): AiDialogSteps<TDraft> {
	let last: string | null = null;
	let steps: AiDialogStep<TDraft>[] = [];

	return {
		start: (baseline) => {
			last = identity(baseline);
			steps = [];
		},
		record: (before, after) => {
			const now = Date.now();
			if (identity(before) !== last) steps.push({ draft: before, origin: 'user', at: now });
			const step: AiDialogStep<TDraft> = { draft: after, origin: 'ai', at: now };
			steps.push(step);
			last = identity(after);
			return () => {
				const index = steps.indexOf(step);
				if (index < 0) return;
				steps.splice(index, 1);
				if (index === steps.length) last = identity(before);
			};
		},
		take: () => {
			const taken = steps;
			steps = [];
			last = null;
			return taken;
		},
	};
}
