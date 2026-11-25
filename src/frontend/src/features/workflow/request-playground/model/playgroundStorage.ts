import type { InputKind } from './playgroundValues';

export type StoredInput = { text: string; kind: InputKind };

const INPUTS_PREFIX = 'oc_request_playground_inputs';

export const buildInputStorageKey = (connectionId: number | null, methodColor: string) =>
	`${INPUTS_PREFIX}:${connectionId ?? 'unsaved'}:${methodColor.toLowerCase()}`;

const isStoredInput = (value: unknown): value is StoredInput =>
	!!value && typeof value === 'object'
	&& typeof (value as StoredInput).text === 'string'
	&& ((value as StoredInput).kind === 'string' || (value as StoredInput).kind === 'json');

// Storage can be unavailable (private window, blocked site data); the playground
// then simply does not remember anything between sessions.
const readItem = (key: string) => {
	try {
		return sessionStorage.getItem(key);
	} catch {
		return null;
	}
};

const writeItem = (key: string, value: string | null) => {
	try {
		if (value === null) sessionStorage.removeItem(key);
		else sessionStorage.setItem(key, value);
	} catch {
		// See readItem.
	}
};

export function readStoredInputs(storageKey: string): Record<string, StoredInput> {
	try {
		const raw = readItem(storageKey);
		const parsed: unknown = raw ? JSON.parse(raw) : null;
		if (!parsed || typeof parsed !== 'object') return {};
		return Object.fromEntries(Object.entries(parsed as Record<string, unknown>)
			.filter((entry): entry is [string, StoredInput] => isStoredInput(entry[1])));
	} catch {
		return {};
	}
}

export function writeStoredInputs(storageKey: string, inputs: Record<string, StoredInput>) {
	writeItem(storageKey, Object.keys(inputs).length === 0 ? null : JSON.stringify(inputs));
}
