import type { Enhancement } from '../types/connection';

/** What a script says where an input it used to receive is gone. The user sees it
 *  in the enhancement editor and fixes the script; nothing else recognizes it, so
 *  a script carrying it is deliberately broken rather than quietly wrong. */
export const NOT_EXIST_ARG = 'VARIABLE_NOT_EXIST';

const isVarKey = (key: string) => /^VAR_\d+$/.test(key);

/**
 * Drops arguments from an enhancement and keeps its script honest: wherever the
 * script used one of them it now says VARIABLE_NOT_EXIST, instead of naming a
 * variable that is no longer passed to it.
 *
 * The word boundary is what keeps VAR_1 out of VAR_10 (`_` counts as a word
 * character, so `\bVAR_1\b` cannot match inside it).
 */
export const dropEnhancementArgs = (
	enhancement: Enhancement,
	argKeys: Iterable<string>,
): Enhancement => {
	const dropped = [...argKeys].filter((key) => key !== 'RESULT_VAR' && key in enhancement.args);
	if (dropped.length === 0) return enhancement;

	const args = { ...enhancement.args };
	dropped.forEach((key) => delete args[key]);
	const script = dropped.reduce((current, key) =>
		current.replace(new RegExp(`\\b${key}\\b`, 'g'), NOT_EXIST_ARG),
	String(enhancement.script ?? ''));

	return { ...enhancement, args, script };
};

/** Whether an enhancement still has an input to compute from. */
export const hasEnhancementArgs = (enhancement: Pick<Enhancement, 'args'>) =>
	Object.keys(enhancement.args ?? {}).some(isVarKey);
