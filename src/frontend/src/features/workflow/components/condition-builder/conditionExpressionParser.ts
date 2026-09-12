import type { WorkflowNodeModel } from '../../types/workflow.types';
import { Conjunction, IfOperatorName, LoopOperatorName, type ConditionChild,
	type ConditionGroup, type ConditionRuleProperties, type ConditionTree } from './conditionBuilder.types';
import { createConditionId, createEmptyGroup } from './conditionTreeFactory';

const parseField = (raw: string) => {
	const value = raw.trim();
	const direct = value.match(/^\{%\s*(.*?)\s*%\}$/);
	if (direct) return direct[1];
	return value.startsWith("'") && value.endsWith("'") ? value.slice(1, -1) : value;
};

const scan = (expression: string, onTopLevel: (index: number) => number | void) => {
	let depth = 0;
	let quote = false;
	for (let index = 0; index < expression.length; index += 1) {
		if (expression[index] === "'" && expression[index - 1] !== '\\') quote = !quote;
		if (quote) continue;
		if (expression.startsWith('{%', index)) {
			const end = expression.indexOf('%}', index + 2);
			if (end >= 0) index = end + 1;
			continue;
		}
		if (expression.startsWith('${', index)) {
			const end = expression.indexOf('}', index + 2);
			if (end >= 0) index = end;
			continue;
		}
		if (expression[index] === '(') depth += 1;
		else if (expression[index] === ')') depth -= 1;
		else if (depth === 0) index = onTopLevel(index) ?? index;
	}
	return depth;
};

const isWrapped = (value: string) => {
	if (!value.startsWith('(') || !value.endsWith(')')) return false;
	let depth = 0;
	let quote = false;
	for (let index = 0; index < value.length; index += 1) {
		if (value[index] === "'" && value[index - 1] !== '\\') quote = !quote;
		if (quote) continue;
		if (value.startsWith('{%', index)) {
			const end = value.indexOf('%}', index + 2);
			if (end >= 0) index = end + 1;
			continue;
		}
		if (value.startsWith('${', index)) {
			const end = value.indexOf('}', index + 2);
			if (end >= 0) index = end;
			continue;
		}
		if (value[index] === '(') depth += 1;
		else if (value[index] === ')' && --depth === 0 && index !== value.length - 1) return false;
	}
	return depth === 0;
};

const unwrapGroup = (expression: string) => {
	let value = expression.trim();
	while (isWrapped(value)) value = value.slice(1, -1).trim();
	return value;
};

const splitTopLevel = (expression: string, conjunction: Conjunction) => {
	const parts: string[] = [];
	let start = 0;
	scan(expression, (index) => {
		if (!expression.startsWith(conjunction, index)) return;
		parts.push(expression.slice(start, index).trim());
		start = index + conjunction.length;
		return index + conjunction.length - 1;
	});
	if (!parts.length) return null;
	parts.push(expression.slice(start).trim());
	return parts.every(Boolean) ? parts : null;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const IF_OPERATORS = Object.values(IfOperatorName).sort((a, b) => b.length - a.length)
	.map(escapeRegex).join('|');

const parseIfRule = (expression: string): ConditionChild | null => {
	const match = expression.match(new RegExp(`^(.+?)\\s+(${IF_OPERATORS})(?:\\s+(.+))?$`));
	if (!match) return null;
	const properties: ConditionRuleProperties = {
		leftField: parseField(match[1]), operator: match[2] as IfOperatorName,
	};
	if (match[3]) properties.rightField = parseField(match[3]);
	return { id: createConditionId('rule'), type: 'rule', properties };
};

const parseIfChild = (expression: string): ConditionChild | null => {
	let value = expression.trim();
	let not = false;
	if (value.startsWith('!')) { not = true; value = value.slice(1).trim(); }
	else if (/^NOT\s+/i.test(value)) { not = true; value = value.replace(/^NOT\s+/i, ''); }
	value = unwrapGroup(value);
	for (const conjunction of [Conjunction.OR, Conjunction.AND]) {
		const parts = splitTopLevel(value, conjunction);
		if (!parts) continue;
		const items = parts.map(parseIfChild);
		if (items.some((item) => !item)) return null;
		return { id: createConditionId('group'), type: 'group',
			properties: { not, conjunction }, items: items as ConditionChild[] };
	}
	const rule = parseIfRule(value);
	if (!rule) return null;
	return not
		? { id: createConditionId('group'), type: 'group', properties: { not: true }, items: [rule] }
		: rule;
};

const generateIfTree = (expression: string): ConditionGroup | null => {
	const child = parseIfChild(expression);
	if (!child) return null;
	return child.type === 'group' ? child : {
		id: createConditionId('group'), type: 'group', properties: { not: false }, items: [child],
	};
};

const generateLoopTree = (expression: string): ConditionGroup | null => {
	const value = expression.trim();
	const operand = String.raw`(?:\{%.*?%\}|\$\{.*?\}|'(?:\\'|[^'])*'|\S+)`;
	const prefix = value.match(new RegExp(`^(forin|for)\\s+(${operand})(?:\\s+(${operand}))?$`));
	const split = value.match(new RegExp(`^(${operand})\\s+(SplitString)(?:\\s+(${operand}))?$`));
	const match = prefix ?? split;
	if (!match) return null;
	const properties: ConditionRuleProperties = prefix
		? { operator: match[1] as LoopOperatorName, leftField: parseField(match[2]),
			...(match[3] ? { rightField: parseField(match[3]) } : {}) }
		: { operator: LoopOperatorName.SplitString, leftField: parseField(match[1]),
			...(match[3] ? { rightField: parseField(match[3]) } : {}) };
	return { id: createConditionId('group'), type: 'group', properties: { not: false },
		items: [{ id: createConditionId('rule'), type: 'rule', properties }] };
};

export const generateTreeByExpression = (expression: string | undefined,
	operatorType: 'if' | 'loop'): ConditionGroup | null => {
	if (!expression?.trim()) return null;
	return operatorType === 'loop' ? generateLoopTree(expression) : generateIfTree(expression);
};

export const getInitialTreeFromConfig = (node: WorkflowNodeModel | null,
	operatorType: 'if' | 'loop'): ConditionTree => {
	const config = node?.data.conditionConfig;
	const saved = config?.tree?.type === 'group' && (config.tree.items?.length ?? 0) > 0;
	return saved ? config.tree
		: generateTreeByExpression(config?.expression, operatorType) ?? createEmptyGroup(operatorType);
};
