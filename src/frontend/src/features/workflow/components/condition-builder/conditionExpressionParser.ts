import type { WorkflowNodeModel } from '../../types/workflow.types';
import { Conjunction, IfOperatorName, LoopOperatorName, type ConditionChild,
	type ConditionGroup, type ConditionRuleProperties, type ConditionTree } from './conditionBuilder.types';
import { createConditionId, createEmptyGroup } from './conditionTreeFactory';

const DIRECT_TOKEN = /^\{%\s*(#?[A-Fa-f0-9]{6}\.\((?:request|response)\)\.[^%]*)\s*%}$/;
const WEBHOOK_TOKEN = /^\$\{[^{}]*}$/;
const OPERAND = String.raw`(?:\{%\s*#?[A-Fa-f0-9]{6}\.\((?:request|response)\)\.[^%]*\s*%\}|\$\{[^{}]*\}|'(?:\\.|[^'])*'|[^\s()]+)`;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const UNARY_IF_OPERATORS = new Set<string>([
	IfOperatorName.IsEmpty, IfOperatorName.IsNotEmpty,
	IfOperatorName.IsNull, IfOperatorName.IsNotNull,
]);

const parseField = (raw: string) => {
	const trimmed = raw.trim();
	const direct = trimmed.match(DIRECT_TOKEN);
	if (direct) return direct[1];
	if (WEBHOOK_TOKEN.test(trimmed)) return trimmed;
	return trimmed.startsWith("'") && trimmed.endsWith("'")
		? trimmed.slice(1, -1).replace(/\\'/g, "'") : trimmed;
};

const hasOuterParens = (value: string) => {
	if (!value.startsWith('(') || !value.endsWith(')')) return false;
	let depth = 0;
	let quote = false;
	for (let index = 0; index < value.length; index += 1) {
		const char = value[index];
		if (char === "'" && value[index - 1] !== '\\') quote = !quote;
		if (quote) continue;
		if (value.startsWith('{%', index)) {
			const end = value.indexOf('%}', index + 2);
			if (end < 0) return false;
			index = end + 1;
			continue;
		}
		if (value.startsWith('${', index)) {
			const end = value.indexOf('}', index + 2);
			if (end < 0) return false;
			index = end;
			continue;
		}
		if (char === '(') depth += 1;
		if (char === ')') depth -= 1;
		if (depth === 0 && index < value.length - 1) return false;
		if (depth < 0) return false;
	}
	return depth === 0 && !quote;
};

const splitTopLevel = (value: string, conjunction: '&&' | '||') => {
	const parts: string[] = [];
	let start = 0;
	let depth = 0;
	let quote = false;
	for (let index = 0; index < value.length; index += 1) {
		const char = value[index];
		if (char === "'" && value[index - 1] !== '\\') quote = !quote;
		if (quote) continue;
		if (value.startsWith('{%', index)) {
			const end = value.indexOf('%}', index + 2);
			if (end < 0) return null;
			index = end + 1;
			continue;
		}
		if (value.startsWith('${', index)) {
			const end = value.indexOf('}', index + 2);
			if (end < 0) return null;
			index = end;
			continue;
		}
		if (char === '(') depth += 1;
		else if (char === ')') depth -= 1;
		if (depth < 0) return null;
		if (depth === 0 && value.startsWith(conjunction, index)) {
			parts.push(value.slice(start, index).trim());
			start = index + conjunction.length;
			index += conjunction.length - 1;
		}
	}
	if (depth !== 0 || quote) return null;
	if (!parts.length) return [];
	parts.push(value.slice(start).trim());
	return parts.every(Boolean) ? parts : null;
};

const rule = (properties: ConditionRuleProperties): ConditionChild => ({
	id: createConditionId('rule'), type: 'rule', properties,
});

const parseIfRule = (expression: string): ConditionChild | null => {
	const operators = Object.values(IfOperatorName)
		.sort((left, right) => right.length - left.length).map(escapeRegex).join('|');
	const match = expression.match(new RegExp(`^(${OPERAND})\\s+(${operators})(?:\\s+(${OPERAND}))?$`));
	if (!match) return null;
	const unary = UNARY_IF_OPERATORS.has(match[2]);
	if ((unary && match[3]) || (!unary && !match[3])) return null;
	const properties: ConditionRuleProperties = {
		leftField: parseField(match[1]), operator: match[2] as IfOperatorName,
	};
	if (match[3]) properties.rightField = parseField(match[3]);
	return rule(properties);
};

const parseIfChild = (raw: string): ConditionChild | null => {
	let expression = raw.trim();
	let not = false;
	while (expression.startsWith('!') && !expression.startsWith('!=')) {
		not = !not;
		expression = expression.slice(1).trim();
	}
	while (hasOuterParens(expression)) expression = expression.slice(1, -1).trim();
	for (const conjunction of [Conjunction.OR, Conjunction.AND] as const) {
		const parts = splitTopLevel(expression, conjunction);
		if (parts === null) return null;
		if (parts.length) {
			const items = parts.map(parseIfChild);
			if (items.some((item) => !item)) return null;
			return { id: createConditionId('group'), type: 'group',
				properties: { conjunction, not }, items: items as ConditionChild[] };
		}
	}
	const parsedRule = parseIfRule(expression);
	if (!parsedRule) return null;
	return not ? { id: createConditionId('group'), type: 'group', properties: { not: true },
		items: [parsedRule] } : parsedRule;
};

const generateIfTree = (expression: string): ConditionGroup | null => {
	const parsed = parseIfChild(expression);
	if (!parsed) return null;
	return parsed.type === 'group' ? parsed : {
		id: createConditionId('group'), type: 'group', properties: { not: false }, items: [parsed],
	};
};

const generateLoopTree = (expression: string): ConditionGroup | null => {
	const binary = expression.trim().match(new RegExp(
		`^(${OPERAND})\\s+(${LoopOperatorName.SplitString})\\s+(${OPERAND})$`));
	if (binary) return { id: createConditionId('group'), type: 'group', properties: { not: false },
		items: [rule({ leftField: parseField(binary[1]), operator: LoopOperatorName.SplitString,
			rightField: parseField(binary[3]) })] };
	const unary = expression.trim().match(new RegExp(
		`^(${LoopOperatorName.For}|${LoopOperatorName.ForIn})\\s+(${OPERAND})(?:\\s+(${OPERAND}))?$`));
	if (!unary) return null;
	return { id: createConditionId('group'), type: 'group', properties: { not: false },
		items: [rule({ operator: unary[1] as LoopOperatorName, leftField: parseField(unary[2]),
			...(unary[3] ? { rightField: parseField(unary[3]) } : {}) })] };
};

export const generateTreeByExpression = (
	expression: string | undefined,
	operatorType: 'if' | 'loop',
): ConditionGroup | null => {
	if (!expression?.trim()) return null;
	return operatorType === 'loop' ? generateLoopTree(expression) : generateIfTree(expression);
};

export const getInitialTreeFromConfig = (
	node: WorkflowNodeModel | null,
	operatorType: 'if' | 'loop',
): ConditionTree => {
	const config = node?.data.conditionConfig;
	const saved = config?.tree?.type === 'group' && (config.tree.items?.length ?? 0) > 0;
	return saved ? config.tree
		: generateTreeByExpression(config?.expression, operatorType) ?? createEmptyGroup(operatorType);
};
