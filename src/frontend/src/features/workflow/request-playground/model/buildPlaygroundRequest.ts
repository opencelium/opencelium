import { serializeWorkflowFieldBindings } from '../../api/connectionPayload.fieldBindings';
import { parseEnhancementArg } from '../../components/request-editor/utils/parseEnhancementArg';
import type { PlaygroundInputs } from './collectPlaygroundInputs';
import type { PlaygroundDraft, PlaygroundRequest, PlaygroundSettings, PrefillSource } from './playground.types';
import {
	emptyInput,
	parseInputValue,
	readJsonError,
	referenceInputKey,
	webhookInputKey,
	type InputValue,
} from './playgroundValues';

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

export const listInputKeys = (inputs: PlaygroundInputs) => [
	...inputs.references.map(referenceInputKey),
	...inputs.webhooks.map(webhookInputKey),
];

type BuildArgs = {
	connectionId: number | null;
	connectorId: number | null;
	draft: PlaygroundDraft;
	fieldBindings: readonly unknown[] | undefined;
	inputs: PlaygroundInputs;
	values: Record<string, InputValue>;
	prefillSource: PrefillSource;
	requestData: Record<string, string>;
	settings: PlaygroundSettings;
};

export function buildPlaygroundRequest({ connectionId, connectorId, draft, fieldBindings, inputs, values,
	prefillSource, requestData, settings }: BuildArgs): PlaygroundRequest {
	const runUpstream = prefillSource === 'upstream';
	const valueOf = (key: string) => values[key] ?? emptyInput();
	return {
		connectionId,
		connectorId,
		method: draft,
		fieldBindings: selectMethodFieldBindings(fieldBindings, draft.color),
		// With a fresh upstream run only the values the user typed replace what that run produces.
		references: inputs.references
			.map((reference) => ({ key: referenceInputKey(reference), reference: reference.reference }))
			.filter(({ key }) => !runUpstream || valueOf(key).source === 'edited')
			.map(({ key, reference }) => ({
				reference,
				value: parseInputValue(valueOf(key)),
				isOverridden: valueOf(key).source === 'edited',
			})),
		webhooks: inputs.webhooks.map((webhook) => ({
			name: webhook.name,
			value: parseInputValue(valueOf(webhookInputKey(webhook))),
		})),
		requestData,
		runUpstream,
		settings: {
			timeoutSec: settings.timeoutSec,
			retries: settings.retries,
			proxyMode: settings.proxyMode,
			proxyUrl: settings.proxyUrl,
			followRedirects: settings.followRedirects,
			verifySsl: settings.verifySsl,
			logToHistory: settings.logToHistory,
		},
	};
}

export function findMissingInputKeys(inputs: PlaygroundInputs, values: Record<string, InputValue>,
	prefillSource: PrefillSource): string[] {
	if (prefillSource === 'upstream') return [];
	return listInputKeys(inputs).filter((key) => !(values[key]?.text ?? '').trim());
}

export function findInvalidJsonInputKeys(inputs: PlaygroundInputs, values: Record<string, InputValue>): string[] {
	return listInputKeys(inputs).filter((key) => values[key] && readJsonError(values[key]) !== null);
}
