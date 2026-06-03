import type { WorkflowNodeModel } from '../../types/workflow.types';
import { createShortId } from '@shared/lib/createId';
import {
	Conjunction,
	IfOperatorName,
	LoopOperatorName,
	type ConditionChild,
	type ConditionConfig,
	type ConditionGroup,
	type ConditionRule,
	type ConditionRuleProperties,
	type ConditionTree,
} from './conditionBuilder.types';

export const createConditionId = (prefix: string) =>
	createShortId(prefix);

export const createEmptyRule = (): ConditionRule => ({
	id: createConditionId('rule'),
	type: 'rule',
});

export const createEmptyGroup = (operatorType: 'if' | 'loop'): ConditionGroup => ({
	id: createConditionId('group'),
	type: 'group',
	properties: {
		not: false,
	},
	items: operatorType === 'loop' ? [createEmptyRule()] : undefined,
});

export const getInitialTreeFromConfig = (
	node: WorkflowNodeModel | null,
	operatorType: 'if' | 'loop',
): ConditionTree => {
	const config = node?.data.conditionConfig;
	if (config?.tree?.type === 'group') return config.tree;
	return createEmptyGroup(operatorType);
};

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
	properties:
		group.id === groupId
			? { ...(group.properties || {}), conjunction }
			: group.properties,
	error: group.id === groupId ? undefined : group.error,
	items: (group.items || []).map((child) =>
		child.type === 'group' ? updateGroupConjunction(child, groupId, conjunction) : child,
	),
});

export const appendChildToGroup = (
	group: ConditionGroup,
	groupId: string,
	child: ConditionChild,
): ConditionGroup => ({
	...group,
	items:
		group.id === groupId
			? [...(group.items || []), child]
			: (group.items || []).map((item) =>
					item.type === 'group' ? appendChildToGroup(item, groupId, child) : item,
				),
});

export const removeChildById = (group: ConditionGroup, childId: string): ConditionGroup => ({
	...group,
	items: (group.items || [])
		.filter((child) => child.id !== childId)
		.map((child) => (child.type === 'group' ? removeChildById(child, childId) : child)),
});

const DIRECT_REFERENCE_PATTERN = /^#?[A-Fa-f0-9]{6}\.\(response\)\./;
const WRAPPED_DIRECT_REFERENCE_PATTERN = /^\{%#?[A-Fa-f0-9]{6}\.\(response\)\..*%}$/;

const isDirectReference = (value?: string) =>
	!!value && DIRECT_REFERENCE_PATTERN.test(value);

const isReference = (value?: string) =>
	!!value && (isDirectReference(value) || WRAPPED_DIRECT_REFERENCE_PATTERN.test(value) || /^\$\{.*}$/.test(value));

const wrapDirectReference = (value: string) =>
	WRAPPED_DIRECT_REFERENCE_PATTERN.test(value) ? value : `{%${value.startsWith('#') ? value : `#${value}`}%}`;

const formatField = (value?: string, wrapReference = false) => {
	if (!value) return '';
	if (wrapReference && isDirectReference(value)) return wrapDirectReference(value);
	return isReference(value) ? value : `'${value}'`;
};

export const conditionTreeToExpression = (
	child: ConditionChild,
	operatorType: 'if' | 'loop',
): string => {
	if (child.type === 'rule') {
		const properties = child.properties || {};
		const operator = properties.operator || '';
		const wrapReference = true;
		const left = formatField(properties.leftField, wrapReference);
		const right = formatField(properties.rightField, wrapReference);
		if (operatorType === 'loop') {
			if (operator === LoopOperatorName.SplitString) {
				return right ? `${left} ${operator} ${right}` : `${left} ${operator}`;
			}
			return right ? `${operator} ${left} ${right}` : `${operator} ${left}`;
		}
		return right && !UNARY_OPERATORS.has(String(operator))
			? `${left} ${operator} ${right}`
			: `${left} ${operator}`;
	}
	const items = child.items || [];
	const conjunction = child.properties?.conjunction;
	const expression = items
		.map((item) => conditionTreeToExpression(item, operatorType))
		.filter(Boolean)
		.join(` ${conjunction || ''} `);
	return operatorType === 'if' ? `(${expression})` : expression;
};

const isRuleValid = (rule: ConditionRule, operatorType: 'if' | 'loop') => {
	const { operator, leftField, rightField } = rule.properties || {};
	if (!operator || !leftField) return false;
	if (operatorType === 'loop') {
		return operator !== LoopOperatorName.SplitString || !!rightField;
	}
	return UNARY_OPERATORS.has(String(operator)) || !!rightField;
};

const UNARY_OPERATORS = new Set<string>([
	IfOperatorName.IsEmpty,
	IfOperatorName.IsNotEmpty,
	IfOperatorName.IsNull,
	IfOperatorName.IsNotNull,
]);

export const validateConditionTree = (group: ConditionGroup, operatorType: 'if' | 'loop'): boolean => {
	const items = group.items || [];
	if (operatorType === 'if') {
		if (items.length === 1 && group.properties?.conjunction !== undefined) return false;
		if (items.length > 1 && group.properties?.conjunction === undefined) return false;
	}
	return items.length > 0 &&
		items.every((child) =>
			child.type === 'group' ? validateConditionTree(child, operatorType) : isRuleValid(child, operatorType),
		);
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
	return undefined;
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
		const ruleValid = isRuleValid(child, operatorType);
		if (!ruleValid) isValid = false;
		return child;
	});

	return {
		tree: {
			...group,
			error: groupError,
			items,
		},
		isValid,
	};
};

export const buildConditionConfig = (
	operatorType: 'if' | 'loop',
	tree: ConditionTree,
	iterator?: string,
): ConditionConfig => ({
	operatorType,
	tree,
	expression: conditionTreeToExpression(tree, operatorType),
	...(operatorType === 'loop' && iterator ? { iterator } : {}),
});
