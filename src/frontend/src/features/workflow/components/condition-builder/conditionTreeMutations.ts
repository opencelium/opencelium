import {
	Conjunction,
	type ConditionChild,
	type ConditionGroup,
	type ConditionRule,
	type ConditionRuleProperties,
} from './conditionBuilder.types';
import { createConditionId } from './conditionTreeFactory';

export const updateRuleProperties = (
	group: ConditionGroup,
	ruleId: string,
	patch: Partial<ConditionRuleProperties>,
): ConditionGroup => ({
	...group,
	items: (group.items || []).map((child) => {
		if (child.type === 'rule') {
			return child.id === ruleId
				? { ...child, properties: { ...(child.properties || {}), ...patch } }
				: child;
		}
		return updateRuleProperties(child, ruleId, patch);
	}),
});

export const updateGroupConjunction = (
	group: ConditionGroup,
	groupId: string,
	conjunction: Conjunction | undefined,
): ConditionGroup => ({
	...group,
	properties: group.id === groupId
		? { ...(group.properties || {}), conjunction }
		: group.properties,
	error: group.id === groupId ? undefined : group.error,
	items: (group.items || []).map((child) => child.type === 'group'
		? updateGroupConjunction(child, groupId, conjunction) : child),
});

export const appendChildToGroup = (
	group: ConditionGroup,
	groupId: string,
	child: ConditionChild,
): ConditionGroup => ({
	...group,
	items: group.id === groupId
		? [...(group.items || []), child]
		: (group.items || []).map((item) => item.type === 'group'
			? appendChildToGroup(item, groupId, child) : item),
});

export const removeChildById = (group: ConditionGroup, childId: string): ConditionGroup => ({
	...group,
	items: (group.items || []).filter((child) => child.id !== childId)
		.map((child) => child.type === 'group' ? removeChildById(child, childId) : child),
});

const cloneRule = (rule: ConditionRule): ConditionRule => ({
	...rule,
	id: createConditionId('rule'),
	properties: rule.properties ? { ...rule.properties } : undefined,
});

export const duplicateRuleById = (group: ConditionGroup, ruleId: string): ConditionGroup => ({
	...group,
	items: (group.items || []).flatMap<ConditionChild>((child) => {
		if (child.type === 'rule') return child.id === ruleId ? [child, cloneRule(child)] : [child];
		return [duplicateRuleById(child, ruleId)];
	}),
});
