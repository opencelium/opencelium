import type { MethodWithId } from '../../types/connection';
import { createShortId } from '@shared/lib/createId';
import { parseEnhancementArg, type ParsedArg } from '../request-editor/utils/parseEnhancementArg';
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
	type ConditionValueSource,
} from './conditionBuilder.types';
import type { ResponseType } from '../request-editor/body-editor/requestReferenceOptions';
export { generateTreeByExpression, getInitialTreeFromConfig } from './conditionExpressionParser';

// Strips the `{% ... %}` enhancement-style wrapper a condition operand's
// reference can arrive in (round-tripped through the expression string) —
// shared by every reader of `leftField`/`rightField` below, so the dialog's
// own parsing (ConditionBuilder.tsx) and the live-value debug panel agree on
// exactly the same grammar.
export const unwrapConditionReference = (value?: string) =>
	value
		?.trim()
		.replace(/^\{%\s*/, '')
		.replace(/\s*%}$/, '');

export const parseMethodFromReference = (methods: MethodWithId[], value?: string) => {
	const reference = unwrapConditionReference(value);
	if (!reference) return undefined;
	const color = reference.match(/^#?([A-Fa-f0-9]{6})\.\((?:response|request)\)\./)?.[1];
	return color
		? methods.find((method) => method.color.replace('#', '').toLowerCase() === color.toLowerCase())
		: undefined;
};

// Anchored at the head of the reference, because the message property is only
// ever the segment right after `(response)` — a substring test reads the
// `status` leaf of a body path (`…body.$.issues[i].fields.status`) as a status
// reference and flips the dialog's B/H/S switcher. The path tail is matched by
// the same expression so a bare path (what LegacyResponseFieldSelect emits)
// falls through untouched instead of being cut at its own `.body.`/`.header.`.
const REFERENCE_HEAD = /^#?[A-Fa-f0-9]{6}\.\((?:response|request)\)\.(body|header|status)\b\.?(.*)$/;

export const parseResponseTypeFromReference = (value?: string): ResponseType | undefined =>
	unwrapConditionReference(value)?.match(REFERENCE_HEAD)?.[1] as ResponseType | undefined;

export const parsePathFromReference = (value?: string) => {
	const reference = unwrapConditionReference(value);
	if (!reference) return undefined;
	if (reference === '$' || reference === '$.') return '$';
	const match = reference.match(REFERENCE_HEAD);
	if (!match) return reference;
	if (match[1] === 'status') return 'status';
	return match[2].replace(/^\$\.?/, '') || '$';
};

export const getSourceFromField = (field?: string): ConditionValueSource => {
	const reference = unwrapConditionReference(field);
	if (!reference) return 'direct';
	if (reference.startsWith('${') && reference.endsWith('}')) return 'webhook';
	if (/^#?[A-Fa-f0-9]{6}\.\((?:response|request)\)\./.test(reference)) return 'direct';
	return 'constant';
};

// A condition operand only ever resolves live when it's a method reference
// (`direct`) — `constant` is already a literal (nothing to fetch), and
// `webhook` has no existing resolution path (no captured trigger payload in
// the execution log). `unwrapConditionReference` + `parseEnhancementArg`
// reuses the exact same `#COLOR.(response).messageProperty.path` grammar
// `buildReferenceValue` (requestReferenceOptions.ts) produces when the dialog
// saves a `direct` operand — no new reference format to parse.
export const parseConditionOperand = (value?: string): ParsedArg | null => {
	if (getSourceFromField(value) !== 'direct') return null;
	const reference = unwrapConditionReference(value);
	return reference ? parseEnhancementArg(reference) : null;
};

export const getMethodLabel = (method: MethodWithId) =>
	method.label || method.name || method.index || method.id;

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

const DIRECT_REFERENCE_PATTERN = /^#?[A-Fa-f0-9]{6}\.\((?:response|request)\)\./;
const WRAPPED_DIRECT_REFERENCE_PATTERN = /^\{%#?[A-Fa-f0-9]{6}\.\((?:response|request)\)\..*%}$/;

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
	return operatorType === 'if'
		? `${child.properties?.not ? '!' : ''}(${expression})`
		: expression;
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
	originalExpression?: string,
): ConditionConfig => {
	const hasRules = (tree.items?.length ?? 0) > 0;
	return {
		operatorType,
		tree,
		expression: hasRules ? conditionTreeToExpression(tree, operatorType) : originalExpression || '',
		...(operatorType === 'loop' && iterator ? { iterator } : {}),
	};
};
