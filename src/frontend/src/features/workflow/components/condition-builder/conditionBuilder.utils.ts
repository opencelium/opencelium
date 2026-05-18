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

const isReference = (value?: string) =>
	!!value && (/^#?[A-Fa-f0-9]{6}\.\(response\)\./.test(value) || /^\$\{.*}$/.test(value));

const formatField = (value?: string) => {
	if (!value) return '';
	return isReference(value) ? value : `'${value}'`;
};

export const conditionTreeToExpression = (
	child: ConditionChild,
	operatorType: 'if' | 'loop',
): string => {
	if (child.type === 'rule') {
		const properties = child.properties || {};
		const operator = properties.operator || '';
		const left = formatField(properties.leftField);
		const right = formatField(properties.rightField);
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
	return items
		.map((item) => conditionTreeToExpression(item, operatorType))
		.filter(Boolean)
		.join(` ${conjunction || ''} `);
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
	return items.length > 0 &&
		items.every((child) =>
			child.type === 'group' ? validateConditionTree(child, operatorType) : isRuleValid(child, operatorType),
		);
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
