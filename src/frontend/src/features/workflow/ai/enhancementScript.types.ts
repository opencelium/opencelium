/**
 * Wire contract for the enhancement-script assistant.
 *
 * Like the mapping suggester, the payload is metadata only: argument names and the
 * reference *paths* they read, never the values at those paths. The model is told the
 * shape of the transform, not the customer's data.
 *
 * An enhancement's contract is unusually tight, which is what makes it a good fit: inputs
 * arrive as `VAR_0`…`VAR_n`, the output is assigned to `RESULT_VAR`, and the body is a
 * single expression. A generated script is therefore checkable before a user accepts it.
 */
import type { Language } from '../types/connection';

/** One input the script receives, with the reference it was bound to. */
export type EnhancementScriptArg = {
	/** `VAR_0`, `VAR_1`, … — the identifier the script uses. */
	name: string;
	/** Where the value comes from, e.g. `body.$.customer.email`. */
	path: string;
	/** The method that produces it, named the way the editor names it. */
	methodName: string;
};

type EnhancementScriptBase = {
	language: Language;
	/** The field the script writes into, for context on what shape is expected. */
	resultPath: string;
	args: EnhancementScriptArg[];
};

/**
 * `generate` writes a script from a plain-language instruction; `repair` is handed a
 * script that still names an input which no longer exists (the VARIABLE_NOT_EXIST marker
 * left by dropEnhancementArgs) and rewrites it against the arguments that remain.
 */
export type EnhancementScriptRequest =
	| (EnhancementScriptBase & { intent: 'generate'; instruction: string })
	| (EnhancementScriptBase & { intent: 'repair'; script: string });

export type EnhancementScriptResponse = {
	script: string;
	/** One line on what the script does, shown before the user accepts it. */
	summary: string;
};
