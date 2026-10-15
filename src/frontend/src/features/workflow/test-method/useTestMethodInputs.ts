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

type InputValues = Record<string, TestInputValue>;

function buildInitialValues(inputs: MethodTestInputs, stored: Record<string, StoredTestInput>): InputValues {
	const values: InputValues = {};
	const seed = (key: string, fallback: TestInputValue) => {
		values[key] = stored[key] ? { ...stored[key], source: 'stored' } : fallback;
	};
	inputs.references.forEach((reference) =>
		seed(referenceInputKey(reference), toInputValue(readSampleValue(reference), 'sample')));
	inputs.webhooks.forEach((webhook) =>
		seed(webhookInputKey(webhook), { ...EMPTY_INPUT, kind: defaultWebhookKind(webhook) }));
	return values;
}

export function useTestMethodInputs({ inputs, connection, currentMethod, storageKey }: Args) {
	const snapshot = useTestRunLiveSnapshot();
	const [values, setValues] = useState(() => buildInitialValues(inputs, readStoredTestInputs(storageKey)));
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
					setValues((current) => current[key]?.source === 'edited' ? current : { ...current, [key]: live });
				});
			});
	});

	useEffect(() => {
		let isCancelled = false;
		resolveLiveValues(() => isCancelled);
		return () => { isCancelled = true; };
	}, []);

	const updateValue = useCallback((key: string, update: (value: TestInputValue) => Partial<TestInputValue>) => {
		setValues((current) => {
			const value = current[key] ?? EMPTY_INPUT;
			return { ...current, [key]: { ...value, ...update(value), source: 'edited' } };
		});
	}, []);

	const setText = useCallback((key: string, text: string) => updateValue(key, () => ({ text })), [updateValue]);

	const toggleKind = useCallback((key: string) =>
		updateValue(key, (value) => ({ kind: value.kind === 'string' ? 'json' : 'string' })), [updateValue]);

	const persist = useCallback(() => {
		const remembered = Object.fromEntries(Object.entries(values)
			.filter(([, value]) => value.source === 'edited' || value.source === 'stored')
			.map(([key, { text, kind }]) => [key, { text, kind }]));
		writeStoredTestInputs(storageKey, remembered);
	}, [values, storageKey]);

	return { values, resolvingKeys, setText, toggleKind, persist };
}
