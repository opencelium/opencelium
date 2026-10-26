import type { Connector } from '@entities/connector/model/types';
import type { InvokerOperation } from '@entities/invoker/model/types';
import { createShortId } from '@shared/lib/createId';
import { ALL_COLORS } from '@features/workflow/constants/colors';
import { ITERATOR_NAMES } from '@features/workflow/components/request-editor/body-editor/requestReferenceOptions';
import { conditionTreeToExpression } from '@features/workflow/components/condition-builder/conditionBuilder.utils';
import {
	IfOperatorName, LoopOperatorName, type ConditionGroup,
} from '@features/workflow/components/condition-builder/conditionBuilder.types';
import {
	type Condition, type ConnectorSide, type DslValue, type LoopStep, type MethodStep, UNARY_CONDITION_OPS, type WorkflowDsl,
	type WorkflowStep,
} from '../model/workflowDsl.schema';
import { buildResponseReference, joinJsonPath, toArrayPath, toJsonPathTail, wrapUrlReference } from './dslReferences.utils';
import { setBodyField } from './dslRequestBody.utils';

export type DslConnectors = Record<ConnectorSide, Connector | null>;

/** The saved-connection shape `mapConnectionToWorkflowState` reads (see `connectionMapper.entries.ts`). */
export type GeneratedMethodPayload = {
	id: string;
	index: string;
	name: string;
	color: string;
	methodType: 'CONNECTOR';
	connector: { connectorId: number; title: string; icon: string | null; invoker: string };
	request: InvokerOperation['request'];
	response: InvokerOperation['response'];
};

export type GeneratedOperatorPayload = {
	id: string;
	index: string;
	type: 'if' | 'loop';
	iterator: string | null;
	expression: string;
};

export type GeneratedConnection = {
	fromConnector: { method: GeneratedMethodPayload[]; operator: GeneratedOperatorPayload[] };
	fieldBinding: [];
};

type LoopFrame = { stepId: string; color: string; elementPath: string };

type Context = {
	connectors: DslConnectors;
	createId: (prefix: string) => string;
	colors: Map<string, string>;
	methods: GeneratedMethodPayload[];
	operators: GeneratedOperatorPayload[];
};

/** A ref to an earlier method reads its response; a ref to an enclosing loop reads the current element. */
function resolveReference(ctx: Context, loops: LoopFrame[], value: DslValue): string | null {
	if ('literal' in value) return null;
	const frame = loops.find((loop) => loop.stepId === value.ref.step);
	if (frame) return buildResponseReference(frame.color, joinJsonPath(frame.elementPath, toJsonPathTail(value.ref.path)));
	const color = ctx.colors.get(value.ref.step);
	if (!color) throw new Error(`Step "${value.ref.step}" is neither an earlier method nor an enclosing loop`);
	return buildResponseReference(color, toJsonPathTail(value.ref.path));
}

function findOperation(ctx: Context, step: MethodStep): { connector: Connector; operation: InvokerOperation } {
	const connector = ctx.connectors[step.connector];
	const operation = connector?.invoker.operations.find((candidate) => candidate.name === step.operation);
	if (!connector || !operation) throw new Error(`Operation "${step.operation}" is not available on the ${step.connector} connector`);
	return { connector, operation };
}

function addMethod(ctx: Context, step: MethodStep, index: string, loops: LoopFrame[]) {
	const { connector, operation } = findOperation(ctx, step);
	const color = ALL_COLORS[ctx.methods.length % ALL_COLORS.length];
	const request = structuredClone(operation.request);
	const fields = (typeof request.body?.fields === 'object' && request.body.fields !== null ? request.body.fields : {}) as Record<string, unknown>;

	for (const field of step.fields) {
		const reference = resolveReference(ctx, loops, field.value);
		setBodyField(fields, field.name, reference ?? ('literal' in field.value ? field.value.literal : ''), reference === null);
	}
	for (const param of step.params) {
		const reference = resolveReference(ctx, loops, param.value);
		const text = reference ? wrapUrlReference(reference) : 'literal' in param.value ? param.value.literal : '';
		request.endpoint = request.endpoint.split(`{${param.name}}`).join(text);
	}
	if (request.body) request.body = { ...request.body, fields };

	ctx.colors.set(step.id, color);
	ctx.methods.push({
		id: ctx.createId('connector'), index, name: operation.name, color, methodType: 'CONNECTOR',
		connector: {
			connectorId: connector.connectorId, title: connector.title,
			icon: typeof connector.icon === 'string' ? connector.icon : null, invoker: connector.invoker.name,
		},
		request, response: structuredClone(operation.response),
	});
}

function conditionOperator(condition: Condition, left: string): IfOperatorName {
	// OpenCelium's Contains tests list membership; on a single value the model means a substring. Only `[]`/`[*]`
	// select a whole list — `[0]` or a loop iterator `[i]` pick one element.
	const isList = /\[\*?]/.test(left);
	switch (condition.op) {
		case 'eq': return IfOperatorName.Equal;
		case 'ne': return IfOperatorName.NotEqual;
		case 'gt': return IfOperatorName.GreaterThan;
		case 'lt': return IfOperatorName.LessThan;
		case 'contains': return isList ? IfOperatorName.Contains : IfOperatorName.ContainsSubStr;
		case 'not_contains': return isList ? IfOperatorName.NotContains : IfOperatorName.NotContainsSubStr;
		case 'exists': return IfOperatorName.IsNotEmpty;
		case 'empty': return IfOperatorName.IsEmpty;
		default: {
			const _exhaustive: never = condition.op;
			return _exhaustive;
		}
	}
}

function singleRuleTree(ctx: Context, leftField: string, operator: string, rightField?: string): ConditionGroup {
	return {
		id: ctx.createId('group'), type: 'group', properties: { not: false },
		items: [{ id: ctx.createId('rule'), type: 'rule', properties: { leftField, operator: operator as IfOperatorName, rightField } }],
	};
}

function valueText(ctx: Context, loops: LoopFrame[], value: DslValue): string {
	return resolveReference(ctx, loops, value) ?? ('literal' in value ? value.literal : '');
}

function addIf(ctx: Context, step: Extract<WorkflowStep, { kind: 'if' }>, index: string, loops: LoopFrame[]) {
	const left = valueText(ctx, loops, step.condition.left);
	const operator = conditionOperator(step.condition, left);
	const right = UNARY_CONDITION_OPS.has(step.condition.op) ? undefined : valueText(ctx, loops, step.condition.right);
	const tree = singleRuleTree(ctx, left, operator, right);
	ctx.operators.push({ id: ctx.createId('if'), index, type: 'if', iterator: null, expression: conditionTreeToExpression(tree, 'if') });
}

function addLoop(ctx: Context, step: LoopStep, index: string, loops: LoopFrame[]): LoopFrame {
	const outer = loops.find((loop) => loop.stepId === step.over.step);
	const color = outer?.color ?? ctx.colors.get(step.over.step);
	if (!color) throw new Error(`Loop source "${step.over.step}" is neither an earlier method nor an enclosing loop`);
	const arrayPath = joinJsonPath(outer?.elementPath ?? '', toArrayPath(step.over.path));
	const iterator = ITERATOR_NAMES[loops.length] ?? `i${loops.length}`;
	const tree = singleRuleTree(ctx, buildResponseReference(color, `${arrayPath}[]`), LoopOperatorName.For);
	ctx.operators.push({ id: ctx.createId('loop'), index, type: 'loop', iterator, expression: conditionTreeToExpression(tree, 'loop') });
	return { stepId: step.id, color, elementPath: `${arrayPath}[${iterator}]` };
}

function walk(ctx: Context, steps: WorkflowStep[], parentIndex: string | null, loops: LoopFrame[]) {
	steps.forEach((step, position) => {
		const index = parentIndex === null ? String(position) : `${parentIndex}_${position}`;
		switch (step.kind) {
			case 'method':
				addMethod(ctx, step, index, loops);
				break;
			case 'if':
				addIf(ctx, step, index, loops);
				walk(ctx, step.then, index, loops);
				break;
			case 'loop':
				walk(ctx, step.body, index, [...loops, addLoop(ctx, step, index, loops)]);
				break;
			default: {
				const _exhaustive: never = step;
				return _exhaustive;
			}
		}
	});
}

/**
 * Converts generated DSL into the saved-connection payload, so the regular loader lays it out, links it and
 * assigns node data exactly as for a stored workflow. Throws when a step names something the connectors lack.
 */
export function dslToConnection(
	dsl: WorkflowDsl,
	connectors: DslConnectors,
	createId: (prefix: string) => string = createShortId,
): GeneratedConnection {
	const ctx: Context = { connectors, createId, colors: new Map(), methods: [], operators: [] };
	walk(ctx, dsl.steps, null, []);
	return { fromConnector: { method: ctx.methods, operator: ctx.operators }, fieldBinding: [] };
}
