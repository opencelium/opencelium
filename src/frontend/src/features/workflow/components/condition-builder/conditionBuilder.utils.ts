import {
	IfOperatorName,
	LoopOperatorName,
	type ConditionChild,
	type ConditionConfig,
	type ConditionTree,
} from './conditionBuilder.types';

export { createConditionId, createEmptyGroup, createEmptyRule } from './conditionTreeFactory';
export { generateTreeByExpression, getInitialTreeFromConfig } from './conditionExpressionParser';
export {
	appendChildToGroup,
	duplicateRuleById,
	removeChildById,
	updateGroupConjunction,
	updateRuleProperties,
} from './conditionTreeMutations';
export {
	validateConditionTree,
	validateConditionTreeWithErrors,
} from './conditionTreeValidation';


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

const UNARY_OPERATORS = new Set<string>([
	IfOperatorName.IsEmpty,
	IfOperatorName.IsNotEmpty,
	IfOperatorName.IsNull,
	IfOperatorName.IsNotNull,
]);

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
