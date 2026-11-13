import type { InputLocation } from './collectPlaygroundInputs';
import type { MethodTestRefs, PlaygroundDraft } from './playground.types';
import { parseInputValue, readJsonError, webhookInputKey, type InputValue } from './playgroundValues';

const WRAPPED_RE = /^\{%\s*([\s\S]*?)\s*%\}$/;
const WEBHOOK_RE = /^\$\{([^}:\s]+)(?::[a-z]+)?\}$/;

// The backend lists a reference exactly as written (`{%#c0ffee.(response).id%}`,
// `${orderId:int}`); the playground keys a reference by its unwrapped text and a
// webhook parameter by its name, so both spellings of one reference share a value.
export function inputKeyOfStaticReference(reference: string): string {
	const webhook = WEBHOOK_RE.exec(reference);
	if (webhook) return webhookInputKey({ name: webhook[1] });
	return WRAPPED_RE.exec(reference)?.[1] ?? reference;
}

export const connectorReferenceKey = (reference: string) => `connection:${reference}`;

export function locateReference(draft: PlaygroundDraft, reference: string): InputLocation {
	const { endpoint, header } = draft.request;
	if (endpoint.includes(reference)) return 'url';
	if (JSON.stringify(header ?? {}).includes(reference)) return 'header';
	return 'body';
}

export const listStaticInputKeys = (refs: MethodTestRefs) =>
	Array.from(new Set(refs.staticReferences.map(({ reference }) => inputKeyOfStaticReference(reference))));

export const isWriteMethod = (method: string) => !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());

type StaticValuesArgs = {
	refs: MethodTestRefs;
	values: Record<string, InputValue>;
	// Connector values the user typed over, keyed by the connector reference.
	connectorOverrides: Record<string, string>;
};

export function buildStaticValues({ refs, values, connectorOverrides }: StaticValuesArgs): Record<string, unknown> {
	const staticValues: Record<string, unknown> = Object.fromEntries(refs.staticReferences.map(({ reference }) => {
		const value = values[inputKeyOfStaticReference(reference)];
		return [reference, value ? parseInputValue(value) : ''];
	}));
	refs.connectorReferences.forEach(({ reference }) => {
		if (connectorOverrides[reference] !== undefined) staticValues[reference] = connectorOverrides[reference];
	});
	return staticValues;
}

export const findMissingInputKeys = (keys: readonly string[], values: Record<string, InputValue>) =>
	keys.filter((key) => values[key]?.source !== 'execution' && !(values[key]?.text ?? '').trim());

export const findInvalidJsonInputKeys = (keys: readonly string[], values: Record<string, InputValue>) =>
	keys.filter((key) => values[key] && readJsonError(values[key]) !== null);
