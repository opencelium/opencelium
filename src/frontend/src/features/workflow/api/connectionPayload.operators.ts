import { ITERATOR_NAMES } from '../components/request-editor/body-editor/requestReferenceOptions';
import type { WorkflowNodeModel } from '../types/workflow.types';

const nodeKind = (node: WorkflowNodeModel) =>
	node.data.kind ?? node.type ?? 'connector';

const wrapExpressionReferences = (expression: string) => expression.replace(
	/(?<!\{%)(#[A-Za-z0-9]{6}\.\((?:response|request)\)\.[^\s)%]+)/g,
	'{%$1%}',
);

const unwrapWholeExpression = (expression: string) => {
	const match = expression.match(/^\{%\s*(.*)\s*%}$/);
	if (!match || match[1].includes('{%') || match[1].includes('%}')) return expression;
	return match[1].trim();
};

const normalizeOperatorExpression = (expression: string, type: string) => {
	const value = wrapExpressionReferences(unwrapWholeExpression(String(expression ?? '').trim()));
	if (!value || type !== 'if') return value;
	return value.startsWith('(') && value.endsWith(')') ? value : `(${value})`;
};

export const buildOperatorPayload = (
	node: WorkflowNodeModel,
	index: string,
	iterator?: string,
) => {
	const type = nodeKind(node);
	return {
		id: node.id,
		index,
		type,
		dataAggregator: node.data.dataAggregator ?? null,
		expression: normalizeOperatorExpression(node.data.conditionConfig?.expression ?? '', type),
		...(type === 'loop' && iterator ? { iterator } : {}),
	};
};

const getParentIndex = (index: string, depth: number) =>
	index.split('_').slice(0, -depth).join('_');

export const getLoopIterator = (
	node: WorkflowNodeModel,
	index: string,
	operators: Array<{ index: string; type: string; iterator?: string }>,
) => {
	const existing = (node.data.conditionConfig as any)?.iterator;
	if (existing) return existing;
	let result = ITERATOR_NAMES[0];
	if (index.split('_').length > 1) {
		let depth = 1;
		let previous: { type: string; iterator?: string } | undefined;
		while (true) {
			previous = operators.find((operator) => operator.index === getParentIndex(index, depth));
			if (!previous || previous.type === 'loop') break;
			depth += 1;
		}
		if (previous?.iterator) {
			const iteratorIndex = ITERATOR_NAMES.indexOf(previous.iterator);
			if (iteratorIndex >= 0) result = ITERATOR_NAMES[iteratorIndex + 1] ?? 'ii';
		}
	}
	return result;
};
