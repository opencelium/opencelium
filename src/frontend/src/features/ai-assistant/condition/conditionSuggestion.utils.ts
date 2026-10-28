import {
	Conjunction, type ConditionGroup, type ConditionRule, type IfOperatorName,
} from '@features/workflow/components/condition-builder/conditionBuilder.types';
import { createConditionId } from '@features/workflow/components/condition-builder/conditionTreeFactory';
import type { MappingSource } from '../mapping/mappingCandidates';
import type { ConditionSuggestion } from '../model/aiGateway.types';

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
