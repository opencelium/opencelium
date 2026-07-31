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

const GENERATED_DIRECT_REFERENCE_TOKEN = /^\{%(#?[A-Fa-f0-9]{6}\.\(response\)\.[^%]*)%}$/;
const GENERATED_WEBHOOK_TOKEN = /^\$\{[^{}]*}$/;
const GENERATED_FIELD_SOURCE = String.raw`(?:\{%#?[A-Fa-f0-9]{6}\.\(response\)\.[^%]*%\}|\$\{[^{}]*\}|'[^']*')`;

const parseGeneratedField = (raw: string): string => {
	const direct = raw.match(GENERATED_DIRECT_REFERENCE_TOKEN);
	if (direct) return direct[1];
	if (GENERATED_WEBHOOK_TOKEN.test(raw)) return raw;
	if (raw.startsWith(`'`) && raw.endsWith(`'`)) return raw.slice(1, -1);
	return raw;
};

// 'if' expressions are always saved wrapped in a single outer paren pair (see wrapIfExpression
// in connectionPayload.ts) — strip it before matching the flat left/operator/right shape below.
const stripOuterParens = (expression: string): string => {
	const trimmed = expression.trim();
	if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) return trimmed;
	let depth = 0;
	for (let index = 0; index < trimmed.length; index += 1) {
		if (trimmed[index] === '(') depth += 1;
		else if (trimmed[index] === ')') {
			depth -= 1;
			if (depth === 0) return index === trimmed.length - 1 ? trimmed.slice(1, -1).trim() : trimmed;
		}
	}
	return trimmed;
};

const wrapGeneratedRule = (properties: ConditionRuleProperties): ConditionGroup => ({
	id: createConditionId('group'),
	type: 'group',
	properties: { not: false },
	items: [{ id: createConditionId('rule'), type: 'rule', properties }],
});

// Reconstructs a flat single-rule tree from an operator's raw expression string, mirroring
// OperatorsConfigGenerator.generateTreeByExpression from src/old_condition_builder. Only used
// as a fallback when no UI tree was persisted for this operator (no matching ui.workflowNodes
// entry, the equivalent of the old "operator.uiId missing" case) — nested AND/OR groups built
// through the tree UI are never round-tripped through here, same limitation as the old version.
const generateIfTreeByExpression = (expression: string): ConditionGroup | null => {
	const operators = Object.values(IfOperatorName).join('|');
	const regex = new RegExp(`^(${GENERATED_FIELD_SOURCE})\\s+(${operators})(?:\\s+(${GENERATED_FIELD_SOURCE}))?$`);
	const match = stripOuterParens(expression).match(regex);
	if (!match) return null;
	const properties: ConditionRuleProperties = {
		leftField: parseGeneratedField(match[1]),
		operator: match[2] as IfOperatorName,
	};
	if (match[3]) properties.rightField = parseGeneratedField(match[3]);
	return wrapGeneratedRule(properties);
};

const generateLoopTreeByExpression = (expression: string): ConditionGroup | null => {
	const trimmed = expression.trim();
	const binaryRegex = new RegExp(
		`^(${GENERATED_FIELD_SOURCE})\\s+(${LoopOperatorName.SplitString})\\s+(${GENERATED_FIELD_SOURCE})$`,
	);
	const binaryMatch = trimmed.match(binaryRegex);
	if (binaryMatch) {
		return wrapGeneratedRule({
			leftField: parseGeneratedField(binaryMatch[1]),
			operator: LoopOperatorName.SplitString,
			rightField: parseGeneratedField(binaryMatch[3]),
		});
	}
	const unaryRegex = new RegExp(
		`^(${LoopOperatorName.For}|${LoopOperatorName.ForIn})\\s+(${GENERATED_FIELD_SOURCE})(?:\\s+(${GENERATED_FIELD_SOURCE}))?$`,
	);
	const unaryMatch = trimmed.match(unaryRegex);
	if (!unaryMatch) return null;
	const properties: ConditionRuleProperties = {
		operator: unaryMatch[1] as LoopOperatorName,
		leftField: parseGeneratedField(unaryMatch[2]),
	};
	if (unaryMatch[3]) properties.rightField = parseGeneratedField(unaryMatch[3]);
	return wrapGeneratedRule(properties);
};

export const generateTreeByExpression = (
	expression: string | undefined,
	operatorType: 'if' | 'loop',
): ConditionGroup | null => {
	if (!expression?.trim()) return null;
	return operatorType === 'loop'
		? generateLoopTreeByExpression(expression)
		: generateIfTreeByExpression(expression);
};

export const getInitialTreeFromConfig = (
	node: WorkflowNodeModel | null,
	operatorType: 'if' | 'loop',
): ConditionTree => {
	const config = node?.data.conditionConfig;
	const hasSavedTree = config?.tree?.type === 'group' && (config.tree.items?.length ?? 0) > 0;
	if (hasSavedTree) return config.tree;
	return generateTreeByExpression(config?.expression, operatorType) ?? createEmptyGroup(operatorType);
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

const cloneConditionRule = (rule: ConditionRule): ConditionRule => ({
	...rule,
	id: createConditionId('rule'),
	properties: rule.properties ? { ...rule.properties } : undefined,
});

export const duplicateRuleById = (group: ConditionGroup, ruleId: string): ConditionGroup => ({
	...group,
	items: (group.items || []).flatMap((child) => {
		if (child.type === 'rule') {
			return child.id === ruleId ? [child, cloneConditionRule(child)] : [child];
		}
		return [duplicateRuleById(child, ruleId)];
	}),
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
