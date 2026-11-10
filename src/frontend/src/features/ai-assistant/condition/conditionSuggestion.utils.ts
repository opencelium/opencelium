import {
	Conjunction, type ConditionGroup, type ConditionRule, type IfOperatorName, LoopOperatorName,
} from '@features/workflow/components/condition-builder/conditionBuilder.types';
import { createConditionId } from '@features/workflow/components/condition-builder/conditionTreeFactory';
import type { MappingSource } from '../mapping/mappingCandidates';
import type { ConditionSuggestion, LoopSuggestion } from '../model/aiGateway.types';
import type { LoopSource } from './loopSources';

/**
 * The suggestion as the condition dialog's own tree: each side is the reference the dialog's pickers would write, or
 * the fixed text, so the result is edited, validated and saved like a hand-built condition. Undefined when a rule
 * names a source that was not offered.
 */
export function suggestionToTree(suggestion: ConditionSuggestion, sources: MappingSource[]): ConditionGroup | undefined {
	const byId = new Map(sources.map((source) => [source.id, source.reference]));
	const rules: ConditionRule[] = [];
	for (const rule of suggestion.rules) {
		const leftField = byId.get(rule.left);
		const rightField = rule.right.kind === 'value' ? rule.right.value
			: rule.right.kind === 'source' ? byId.get(rule.right.source) : '';
		if (!leftField || rightField === undefined) return undefined;
		rules.push({ id: createConditionId('rule'), type: 'rule',
			properties: { leftField, operator: rule.operator as IfOperatorName, ...(rule.right.kind === 'none' ? {} : { rightField }) } });
	}
	return {
		id: createConditionId('group'),
		type: 'group',
		properties: { conjunction: suggestion.conjunction === 'or' ? Conjunction.OR : Conjunction.AND, not: suggestion.not },
		items: rules,
	};
}

const LOOP_OPERATORS: Record<LoopSuggestion['operator'], LoopOperatorName> = {
	for: LoopOperatorName.For,
	forin: LoopOperatorName.ForIn,
	SplitString: LoopOperatorName.SplitString,
};

/** A loop's one rule, as the dialog's pickers would write it; undefined when it names a value that was not offered. */
export function loopSuggestionToTree(suggestion: LoopSuggestion, sources: LoopSource[]): ConditionGroup | undefined {
	const source = sources.find((candidate) => candidate.id === suggestion.source);
	if (!source) return undefined;
	const operator = LOOP_OPERATORS[suggestion.operator];
	const isSplit = operator === LoopOperatorName.SplitString;
	return {
		id: createConditionId('group'),
		type: 'group',
		properties: { not: false },
		items: [{ id: createConditionId('rule'), type: 'rule',
			properties: { operator, leftField: source.reference, ...(isSplit ? { rightField: suggestion.delimiter || ',' } : {}) } }],
	};
}
