import type { WorkflowNodeModel } from '../../types/workflow.types';
import { IfOperatorName, LoopOperatorName, type ConditionGroup,
	type ConditionRuleProperties, type ConditionTree } from './conditionBuilder.types';
import { createConditionId, createEmptyGroup } from './conditionTreeFactory';

const DIRECT_TOKEN = /^\{%(#?[A-Fa-f0-9]{6}\.\(response\)\.[^%]*)%}$/;
const WEBHOOK_TOKEN = /^\$\{[^{}]*}$/;
const FIELD_SOURCE = String.raw`(?:\{%#?[A-Fa-f0-9]{6}\.\(response\)\.[^%]*%\}|\$\{[^{}]*\}|'[^']*')`;

const parseField = (raw: string) => {
	const direct = raw.match(DIRECT_TOKEN);
	if (direct) return direct[1];
	if (WEBHOOK_TOKEN.test(raw)) return raw;
	return raw.startsWith("'") && raw.endsWith("'") ? raw.slice(1, -1) : raw;
};

const stripOuterParens = (expression: string) => {
	const trimmed = expression.trim();
	if (!trimmed.startsWith('(') || !trimmed.endsWith(')')) return trimmed;
	let depth = 0;
	for (let index = 0; index < trimmed.length; index += 1) {
		if (trimmed[index] === '(') depth += 1;
		else if (trimmed[index] === ')') {
			depth -= 1;
			if (depth === 0) return index === trimmed.length - 1
				? trimmed.slice(1, -1).trim() : trimmed;
		}
	}
	return trimmed;
};

const wrapRule = (properties: ConditionRuleProperties): ConditionGroup => ({
	id: createConditionId('group'),
	type: 'group',
	properties: { not: false },
	items: [{ id: createConditionId('rule'), type: 'rule', properties }],
});

const generateIfTree = (expression: string) => {
	const operators = Object.values(IfOperatorName).join('|');
	const regex = new RegExp(`^(${FIELD_SOURCE})\\s+(${operators})(?:\\s+(${FIELD_SOURCE}))?$`);
	const match = stripOuterParens(expression).match(regex);
	if (!match) return null;
	const properties: ConditionRuleProperties = {
		leftField: parseField(match[1]),
		operator: match[2] as IfOperatorName,
	};
	if (match[3]) properties.rightField = parseField(match[3]);
	return wrapRule(properties);
};

const generateLoopTree = (expression: string) => {
	const binary = expression.trim().match(new RegExp(
		`^(${FIELD_SOURCE})\\s+(${LoopOperatorName.SplitString})\\s+(${FIELD_SOURCE})$`));
	if (binary) return wrapRule({ leftField: parseField(binary[1]),
		operator: LoopOperatorName.SplitString, rightField: parseField(binary[3]) });
	const unary = expression.trim().match(new RegExp(
		`^(${LoopOperatorName.For}|${LoopOperatorName.ForIn})\\s+(${FIELD_SOURCE})(?:\\s+(${FIELD_SOURCE}))?$`));
	if (!unary) return null;
	const properties: ConditionRuleProperties = {
		operator: unary[1] as LoopOperatorName,
		leftField: parseField(unary[2]),
	};
	if (unary[3]) properties.rightField = parseField(unary[3]);
	return wrapRule(properties);
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
