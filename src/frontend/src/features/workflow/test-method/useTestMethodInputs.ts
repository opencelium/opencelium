import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import {
	canInspectLiveReference,
	resolveLiveReferenceValue,
	useTestRunLiveSnapshot,
	type LiveReferenceMethodContext,
} from '../components/request-editor/utils/useLiveReferenceValue';
import type { Connection } from '../types/connection';
import type { MethodTestInputs } from './collectMethodReferences';
import { readStoredTestInputs, writeStoredTestInputs, type StoredTestInput } from './testMethodInputStorage';
import {
	defaultWebhookKind,
	EMPTY_INPUT,
	readSampleValue,
	referenceInputKey,
	toInputValue,
	webhookInputKey,
	type TestInputValue,
} from './testMethodInputValue';

type Args = {
	inputs: MethodTestInputs;
	connection: Connection;
	currentMethod: LiveReferenceMethodContext | undefined;
	storageKey: string;
};

type InputState = {
	values: Record<string, TestInputValue>;
	// What "reset" returns a row to: the best value not typed by the user.
	fallbacks: Record<string, TestInputValue>;
};

function buildInitialState(inputs: MethodTestInputs, stored: Record<string, StoredTestInput>): InputState {
	const state: InputState = { values: {}, fallbacks: {} };
	const seed = (key: string, fallback: TestInputValue) => {
		state.fallbacks[key] = fallback;
		state.values[key] = stored[key] ? { ...stored[key], source: 'stored' } : fallback;
	};
	inputs.references.forEach((reference) =>
		seed(referenceInputKey(reference), toInputValue(readSampleValue(reference), 'sample')));
	inputs.webhooks.forEach((webhook) =>
		seed(webhookInputKey(webhook), { ...EMPTY_INPUT, kind: defaultWebhookKind(webhook) }));
	return state;
}

export function useTestMethodInputs({ inputs, connection, currentMethod, storageKey }: Args) {
	const snapshot = useTestRunLiveSnapshot();
	const [state, setState] = useState(() => buildInitialState(inputs, readStoredTestInputs(storageKey)));
	const [resolvingKeys, setResolvingKeys] = useState<string[]>(() => inputs.references
		.filter((reference) => canInspectLiveReference(reference.parsed, connection, currentMethod, snapshot))
		.map(referenceInputKey));

	// A paused test run holds the real upstream responses, which beat both a
	// remembered value and the connector's sample — unless the user is already
	// typing into that row. Resolved once per dialog session: a run that moves on
	// afterwards does not overwrite what the user is looking at.
	const resolveLiveValues = useEffectEvent((isCancelled: () => boolean) => {
		inputs.references
			.filter((reference) => resolvingKeys.includes(referenceInputKey(reference)))
			.forEach((reference) => {
				const key = referenceInputKey(reference);
				void resolveLiveReferenceValue(reference.parsed, connection, currentMethod, snapshot).then(({ value, hasValue }) => {
					if (isCancelled()) return;
					setResolvingKeys((keys) => keys.filter((item) => item !== key));
					if (!hasValue) return;
					const live = toInputValue(value, 'live');
					setState((current) => ({
						fallbacks: { ...current.fallbacks, [key]: live },
						values: current.values[key]?.source === 'edited' ? current.values : { ...current.values, [key]: live },
					}));
				});
			});
	});

	useEffect(() => {
		let isCancelled = false;
		resolveLiveValues(() => isCancelled);
		return () => { isCancelled = true; };
	}, []);

	const updateValue = useCallback((key: string, update: (value: TestInputValue) => Partial<TestInputValue>) => {
		setState((current) => {
			const value = current.values[key] ?? EMPTY_INPUT;
			return { ...current, values: { ...current.values, [key]: { ...value, ...update(value), source: 'edited' } } };
		});
	}, []);

	const setText = useCallback((key: string, text: string) => updateValue(key, () => ({ text })), [updateValue]);

	const toggleKind = useCallback((key: string) =>
		updateValue(key, (value) => ({ kind: value.kind === 'string' ? 'json' : 'string' })), [updateValue]);

	const reset = useCallback((key: string) => setState((current) => ({
		...current,
		values: { ...current.values, [key]: current.fallbacks[key] ?? EMPTY_INPUT },
	})), []);

	const persist = useCallback(() => {
		const remembered = Object.fromEntries(Object.entries(state.values)
			.filter(([, value]) => value.source === 'edited' || value.source === 'stored')
			.map(([key, { text, kind }]) => [key, { text, kind }]));
		writeStoredTestInputs(storageKey, remembered);
	}, [state.values, storageKey]);

	return { values: state.values, resolvingKeys, setText, toggleKind, reset, persist };
}
