import { getInitialTreeFromConfig, unwrapConditionReference }
	from '../components/condition-builder/conditionBuilder.utils';
import type { ConditionChild, ConditionGroup }
	from '../components/condition-builder/conditionBuilder.types';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { normalizeReferenceColor } from './graph.referenceColors';

/** One rule of an operator's condition, as a line to read. */
export type ConditionTerm = {
	id: string;
	text: string;
	/** True when this rule is one of the ones holding the reference in question —
	 *  what makes a condition of a dozen rules answer "where exactly". */
	holdsReference: boolean;
};

const normalize = (value: string) => value.trim().toLowerCase()
	.replace(/#[A-Fa-f0-9]{6}/g, (color) => normalizeReferenceColor(color));

/** Quotes and `{%…%}` wrappers are how a term is stored, not how it reads. */
const readOperand = (value?: string) => {
	const unwrapped = unwrapConditionReference(value) ?? '';
	return unwrapped.startsWith("'") && unwrapped.endsWith("'")
		? unwrapped.slice(1, -1)
		: unwrapped;
};

const flatten = (group: ConditionGroup): ConditionChild[] =>
	(group.items ?? []).flatMap((child) =>
		(child.type === 'group' ? flatten(child) : [child]));

/**
 * An operator's condition as a list of readable rules, with the ones holding a
 * given reference marked.
 *
 * A method's request has a field per reference, so "where is it used" answers
 * itself. A condition does not: the same reference can appear in any number of
 * its rules, and the operator's name — all the dialog could say until now — is
 * the same answer for every one of them. Groups are flattened away: which
 * bracket a rule sits in matters when authoring the condition and not when
 * asking which rules mention a method.
 */
export const describeConditionTerms = (
	node: WorkflowNodeModel | undefined,
	reference: string,
): ConditionTerm[] => {
	const operatorType = node?.data.conditionConfig?.operatorType
		?? (node?.type === 'loop' ? 'loop' : 'if');
	const tree = getInitialTreeFromConfig(node ?? null, operatorType);
	const needle = normalize(reference);

	return flatten(tree).map((child) => {
		const { leftField, operator, rightField } = (child as { properties?: {
			leftField?: string; operator?: string; rightField?: string } }).properties ?? {};
		return {
			id: child.id,
			text: [readOperand(leftField), operator, readOperand(rightField)]
				.filter(Boolean).join(' '),
			holdsReference: [leftField, rightField]
				.some((field) => !!field && normalize(field).includes(needle)),
		};
	});
};
