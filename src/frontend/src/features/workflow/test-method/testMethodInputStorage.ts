import type { TestInputKind } from './testMethodInputValue';

export type StoredTestInput = { text: string; kind: TestInputKind };

const STORAGE_PREFIX = 'oc_test_method_inputs';

export const buildTestInputStorageKey = (connectionId: number | null, methodColor: string) =>
	`${STORAGE_PREFIX}:${connectionId ?? 'unsaved'}:${methodColor.toLowerCase()}`;

const isStoredInput = (value: unknown): value is StoredTestInput =>
	!!value && typeof value === 'object'
	&& typeof (value as StoredTestInput).text === 'string'
	&& ((value as StoredTestInput).kind === 'string' || (value as StoredTestInput).kind === 'json');

export function readStoredTestInputs(storageKey: string): Record<string, StoredTestInput> {
	try {
		const raw = sessionStorage.getItem(storageKey);
		const parsed: unknown = raw ? JSON.parse(raw) : null;
		if (!parsed || typeof parsed !== 'object') return {};
		return Object.fromEntries(Object.entries(parsed as Record<string, unknown>)
			.filter((entry): entry is [string, StoredTestInput] => isStoredInput(entry[1])));
	} catch {
		return {};
	}
}

export function writeStoredTestInputs(storageKey: string, inputs: Record<string, StoredTestInput>) {
	try {
		if (Object.keys(inputs).length === 0) sessionStorage.removeItem(storageKey);
		else sessionStorage.setItem(storageKey, JSON.stringify(inputs));
	} catch {
		// Storage can be unavailable (private window, blocked site data); the
		// inputs then simply are not remembered for the next test.
	}
}
