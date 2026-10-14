import { serializeWorkflowFieldBindings } from '../api/connectionPayload.fieldBindings';
import { parseEnhancementArg } from '../components/request-editor/utils/parseEnhancementArg';
import type { MethodTestInputs } from './collectMethodReferences';
import type { TestMethodDraft, TestMethodRequest } from './testMethod.types';
import {
	EMPTY_INPUT,
	parseInputValue,
	referenceInputKey,
	webhookInputKey,
	type TestInputValue,
} from './testMethodInputValue';

const readResultVar = (binding: unknown) => {
	if (!binding || typeof binding !== 'object') return undefined;
	const args = (binding as { enhancement?: { args?: Record<string, unknown> } }).enhancement?.args;
	return typeof args?.RESULT_VAR === 'string' ? args.RESULT_VAR : undefined;
};

export function selectMethodFieldBindings(fieldBindings: readonly unknown[] | undefined, methodColor: string): unknown[] {
	const color = methodColor.toLowerCase();
	const own = (fieldBindings ?? []).filter((binding) => {
		const resultVar = readResultVar(binding);
		const parsed = resultVar ? parseEnhancementArg(resultVar.replace(/^\{%\s*/, '').replace(/\s*%}$/, '')) : null;
		return parsed?.direction === 'request' && parsed.color.toLowerCase() === color;
	});
	const serialized: unknown = serializeWorkflowFieldBindings(own);
	return Array.isArray(serialized) ? serialized : [];
}

type BuildArgs = {
	connectionId: number | null;
	draft: TestMethodDraft;
	fieldBindings: readonly unknown[] | undefined;
	inputs: MethodTestInputs;
	values: Record<string, TestInputValue>;
};

export function buildTestMethodRequest({ connectionId, draft, fieldBindings, inputs, values }: BuildArgs): TestMethodRequest {
	const valueOf = (key: string) => parseInputValue(values[key] ?? EMPTY_INPUT);
	return {
		connectionId,
		method: draft,
		fieldBindings: selectMethodFieldBindings(fieldBindings, draft.color),
		references: inputs.references.map((reference) => ({
			reference: reference.reference,
			value: valueOf(referenceInputKey(reference)),
		})),
		webhooks: inputs.webhooks.map((webhook) => ({
			name: webhook.name,
			value: valueOf(webhookInputKey(webhook)),
		})),
	};
}

export function findMissingInputKeys(inputs: MethodTestInputs, values: Record<string, TestInputValue>): string[] {
	return [
		...inputs.references.map(referenceInputKey),
		...inputs.webhooks.map(webhookInputKey),
	].filter((key) => !(values[key]?.text ?? '').trim());
}
