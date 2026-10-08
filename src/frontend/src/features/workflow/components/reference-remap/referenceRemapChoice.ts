import type { ConditionConfig } from '../condition-builder/conditionBuilder.types';
import type { ReferenceRemapPlan } from '../../utils/graph.referenceRemap';
import { buildReference } from '../../utils/graph.referenceRemap';
import type { ReferenceRemapSource, ReferenceRemapTarget }
	from '../../utils/graph.referenceRemapTargets';
import { CLEAR } from './referenceRemap.constants';

/** What the user has answered about one method that is going away. */
export type ReferenceRemapChoice = {
	/** The method every field of it moves to, unless a field says otherwise. */
	replacement: string;
	/** Per source reference: the whole reference it should become, as the
	 *  generator built it — method, response part and path in one string. */
	fields: Record<string, string>;
	/** Counts answers to the method above, not changes of it: re-picking the
	 *  method already chosen is an answer the select reports as nothing, and the
	 *  field rows below still have to start over. */
	seedVersion: number;
};

export const emptyChoice = (): ReferenceRemapChoice =>
	({ replacement: CLEAR, fields: {}, seedVersion: 0 });

/**
 * Only what the user actually chose.
 *
 * The two levels answer different questions and compose: `replacement` is one
 * decision for however many fields read the method; a field answered on its own
 * becomes a whole reference — its own method, response part and path — and
 * overrides it for that field alone. A field nobody answered, under a method
 * nobody replaced, is cleared as before.
 *
 * How `replacement` is applied depends on whether every field can take it. The
 * method-wide list is the union of the fields' own, so a pick from it may be
 * legal for some fields and not others — a field read from inside a loop can
 * see things its siblings cannot. Where every field can take it, one colour
 * substitution says so, and it reaches even the references this pass could not
 * enumerate. Where only some can, it is written out per field instead, and the
 * fields that cannot read it are left to be answered on their own or cleared —
 * anything else would re-point a reference onto a method the step holding it
 * cannot see, which is the breakage this dialog exists to avoid.
 */
export const buildRemapPlan = (
	targets: ReferenceRemapTarget[],
	choices: Record<string, ReferenceRemapChoice>,
	/** Conditions rewritten by hand, by operator node id — the answer for a
	 *  condition that substitution cannot express. */
	conditions: Record<string, ConditionConfig> = {},
): ReferenceRemapPlan => {
	const colors = new Map<string, string>();
	const references = new Map<string, string>();
	targets.forEach((target) => {
		const choice = choices[target.color];
		if (!choice) return;
		const canTakeReplacement = (source: ReferenceRemapSource) =>
			source.candidates.some((candidate) => candidate.color === choice.replacement);
		const isLegalEverywhere = choice.replacement !== CLEAR
			&& target.sources.length > 0
			&& target.sources.every(canTakeReplacement);
		if (choice.replacement !== CLEAR && (isLegalEverywhere || target.sources.length === 0)) {
			colors.set(target.color, choice.replacement);
		}
		target.sources.forEach((source) => {
			const answered = choice.fields[source.key];
			if (answered) {
				references.set(source.key, answered);
				return;
			}
			if (isLegalEverywhere || choice.replacement === CLEAR) return;
			if (!canTakeReplacement(source)) return;
			references.set(source.key, buildReference({
				color: choice.replacement,
				direction: 'response',
				messageProperty: source.messageProperty,
				path: source.path,
			}));
		});
	});
	return { colors, references, conditionConfigs: new Map(Object.entries(conditions)) };
};
