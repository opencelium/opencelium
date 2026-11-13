import type { LoggedExecution } from '@features/logs';
import { readExecutionReference } from '../model/readExecutionReference';
import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import {
	canInspectLiveReference,
	resolveLiveReferenceValue,
	useTestRunLiveSnapshot,
	type LiveReferenceMethodContext,
} from '../../components/request-editor/utils/useLiveReferenceValue';
import type { Connection } from '../../types/connection';
import type { CollectedReference, PlaygroundInputs } from '../model/collectPlaygroundInputs';
import type { PrefillSource } from '../model/playground.types';
import { readStoredInputs, writeStoredInputs, type StoredInput } from '../model/playgroundStorage';
import {
	defaultWebhookKind,
	emptyInput,
	readSampleValue,
	referenceInputKey,
	toInputValue,
	webhookInputKey,
	type InputValue,
} from '../model/playgroundValues';

type Args = {
	inputs: PlaygroundInputs;
	connection: Connection;
	currentMethod: LiveReferenceMethodContext | undefined;
	storageKey: string;
	execution?: LoggedExecution;
	// Every value key /refs asks for; the ones the editor's own scan does not
	// produce (pagination, script results, URL references…) get a plain input.
	staticKeys: readonly string[];
};

const fromStored = (stored: StoredInput | undefined): InputValue | undefined =>
	stored && { ...stored, source: 'lastTest' };

export function usePlaygroundValues({ inputs, connection, currentMethod, storageKey, staticKeys, execution }: Args) {
	const snapshot = useTestRunLiveSnapshot();
	const [stored] = useState(() => readStoredInputs(storageKey));
	const isInspectable = (reference: CollectedReference) =>
		canInspectLiveReference(reference.parsed, connection, currentMethod, snapshot);
	const canUseTestRun = inputs.references.some(isInspectable);
	const [prefillSource, setPrefillSource] = useState<PrefillSource>(() => {
		if (execution) return 'execution';
		if (canUseTestRun) return 'testRun';
		return Object.keys(stored).length ? 'lastTest' : 'sample';
	});
	const [overrides, setOverrides] = useState<Record<string, InputValue>>({});
	const [requestData, setRequestData] = useState<Record<string, string>>({});
	const [live, setLive] = useState<Record<string, InputValue>>({});
	const [recorded, setRecorded] = useState<Record<string, InputValue>>({});
	const recordedKeys = useEffectEvent(() => recorded);
	useEffect(() => {
		if (prefillSource !== 'execution' || !execution) return;
		let cancelled = false;
		const loaded = recordedKeys();
		for (const reference of inputs.references) {
			const key = referenceInputKey(reference);
			if (loaded[key]) continue;
			void readExecutionReference(reference, execution).catch(() => emptyInput()).then((value) => {
				if (!cancelled) setRecorded((current) => ({ ...current, [key]: value }));
			});
		}
		return () => { cancelled = true; };
	}, [execution, inputs.references, prefillSource]);

	// A reference inside a loop reads the iteration the paused run is in.
	const resolveLive = useEffectEvent((isCancelled: () => boolean) => {
		inputs.references.filter(isInspectable).forEach((reference) => {
			const key = referenceInputKey(reference);
			void resolveLiveReferenceValue(reference.parsed, connection, currentMethod, snapshot)
				.then(({ value, hasValue }) => {
					if (isCancelled()) return;
					setLive((current) => ({ ...current, [key]: hasValue ? toInputValue(value, 'testRun') : emptyInput() }));
				});
		});
	});

	useEffect(() => {
		if (prefillSource !== 'testRun') return;
		let isCancelled = false;
		resolveLive(() => isCancelled);
		return () => { isCancelled = true; };
	}, [prefillSource]);

	const baseReferenceValue = (reference: CollectedReference): InputValue => {
		const key = referenceInputKey(reference);
		// A step the paused run or the last test has no value for still gets its sample.
		const sample = () => toInputValue(readSampleValue(reference), 'sample');
		switch (prefillSource) {
			case 'testRun': {
				const liveValue = live[key];
				return liveValue && liveValue.source !== 'empty' ? liveValue : sample();
			}
			case 'lastTest': return fromStored(stored[key]) ?? sample();
			case 'sample': return sample();
			case 'execution': return recorded[key] ?? emptyInput();
			case 'manual': return emptyInput();
			default: {
				const _exhaustive: never = prefillSource;
				return _exhaustive;
			}
		}
	};

	const values: Record<string, InputValue> = {};
	inputs.references.forEach((reference) => {
		const key = referenceInputKey(reference);
		values[key] = overrides[key] ?? baseReferenceValue(reference);
	});
	const remembered = (key: string) => prefillSource === 'lastTest' ? fromStored(stored[key]) : undefined;
	inputs.webhooks.forEach((webhook) => {
		const key = webhookInputKey(webhook);
		values[key] = overrides[key] ?? remembered(key) ?? emptyInput(defaultWebhookKind(webhook));
	});
	staticKeys.filter((key) => !values[key])
		.forEach((key) => { values[key] = overrides[key] ?? remembered(key) ?? emptyInput(); });

	const updateOverride = useCallback((key: string, value: InputValue, update: Partial<InputValue>) =>
		setOverrides((current) => ({ ...current, [key]: { ...(current[key] ?? value), ...update, source: 'edited' } })), []);

	const resetValue = useCallback((key: string) => setOverrides((current) => {
		const next = { ...current };
		delete next[key];
		return next;
	}), []);

	const setRequestDataValue = useCallback((field: string, value: string | undefined) =>
		setRequestData((current) => {
			const next = { ...current };
			if (value === undefined) delete next[field];
			else next[field] = value;
			return next;
		}), []);

	const resetAll = useCallback(() => {
		setOverrides({});
		setRequestData({});
	}, []);

	const persist = () => writeStoredInputs(storageKey, Object.fromEntries(Object.entries(values)
		.filter(([, value]) => value.source === 'edited' || value.source === 'lastTest')
		.map(([key, { text, kind }]) => [key, { text, kind }])));

	return {
		values,
		resolvingKeys: prefillSource === 'testRun'
			? inputs.references.filter(isInspectable).map(referenceInputKey).filter((key) => !live[key])
			: prefillSource === 'execution'
				? inputs.references.map(referenceInputKey).filter((key) => !recorded[key])
				: [],
		executionId: execution?.location.executionId,
		prefillSource,
		// Picking a source re-fills every value from it; otherwise a typed value would hide its effect.
		setPrefillSource: (source: PrefillSource) => {
			setOverrides({});
			setPrefillSource(source);
		},
		canUseTestRun,
		hasStoredValues: Object.keys(stored).length > 0,
		setText: (key: string, text: string) => updateOverride(key, values[key], { text }),
		toggleKind: (key: string) => updateOverride(key, values[key],
			{ kind: values[key]?.kind === 'string' ? 'json' : 'string' }),
		resetValue,
		requestData,
		setRequestDataValue,
		changedCount: Object.keys(overrides).length + Object.keys(requestData).length,
		resetAll,
		persist,
	};
}

export type PlaygroundValues = ReturnType<typeof usePlaygroundValues>;
