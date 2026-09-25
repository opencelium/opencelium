import {
	IfOperatorName,
	LoopOperatorName,
	type ConditionGroup,
	type ConditionRule,
} from './conditionBuilder.types';

const UNARY_OPERATORS = new Set<string>([
	IfOperatorName.IsEmpty,
	IfOperatorName.IsNotEmpty,
	IfOperatorName.IsNull,
	IfOperatorName.IsNotNull,
]);

const isRuleValid = (rule: ConditionRule, operatorType: 'if' | 'loop') => {
	const { operator, leftField, rightField } = rule.properties || {};
	if (!operator || !leftField) return false;
	if (operatorType === 'loop') {
		return operator !== LoopOperatorName.SplitString || !!rightField;
	}
	return UNARY_OPERATORS.has(String(operator)) || !!rightField;
};

export const validateConditionTree = (
	group: ConditionGroup,
	operatorType: 'if' | 'loop',
): boolean => {
	const items = group.items || [];
	if (operatorType === 'if') {
		if (items.length === 1 && group.properties?.conjunction !== undefined) return false;
		if (items.length > 1 && group.properties?.conjunction === undefined) return false;
	}
	return items.length > 0 && items.every((child) => child.type === 'group'
		? validateConditionTree(child, operatorType)
		: isRuleValid(child, operatorType));
};

const getGroupError = (group: ConditionGroup, operatorType: 'if' | 'loop') => {
	const items = group.items || [];
	if (items.length === 0) return 'There are no rules in this group.';
	if (operatorType === 'if') {
		if (items.length === 1 && group.properties?.conjunction !== undefined) {
			return `Group with one item must not have conjunction. Conjunction: ${group.properties.conjunction}`;
		}
		if (items.length > 1 && group.properties?.conjunction === undefined) {
			return 'Group with multiple conditions must have a conjunction. Conjunction is missing.';
		}
	}
};

export const validateConditionTreeWithErrors = (
	group: ConditionGroup,
	operatorType: 'if' | 'loop',
): { tree: ConditionGroup; isValid: boolean } => {
	const groupError = getGroupError(group, operatorType);
	let isValid = !groupError;
	const items = (group.items || []).map((child) => {
		if (child.type === 'group') {
			const result = validateConditionTreeWithErrors(child, operatorType);
			if (!result.isValid) isValid = false;
			return result.tree;
		}
		if (!isRuleValid(child, operatorType)) isValid = false;
		return child;
	});
	return { tree: { ...group, error: groupError, items }, isValid };
};
