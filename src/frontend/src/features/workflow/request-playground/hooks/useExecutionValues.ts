import { useEffect, useRef, useState } from 'react';
import type { LoggedExecution } from '@features/logs';
import type { Connection } from '../../types/connection';
import type { CollectedReference } from '../model/collectPlaygroundInputs';
import { emptyInput, referenceInputKey, type InputValue } from '../model/playgroundValues';
import { readExecutionReference } from '../model/readExecutionReference';
import { readExecutionScriptResult, readScriptResultBindId } from '../model/readExecutionScriptResult';

type Args = {
	execution: LoggedExecution | undefined;
	isActive: boolean;
	references: readonly CollectedReference[];
	staticKeys: readonly string[];
	connection: Connection;
};

// The values the method's references and script results had in the logged run.
// Each key is read once per session; switching sources keeps what was already read.
export function useExecutionValues({ execution, isActive, references, staticKeys, connection }: Args) {
	const [recorded, setRecorded] = useState<Record<string, InputValue>>({});
	const requested = useRef(new Set<string>());
	const scriptKeys = staticKeys.filter((key) => readScriptResultBindId(key) !== null);
	const scriptKeysId = scriptKeys.join('\n');

	useEffect(() => {
		if (!isActive || !execution) return;
		const read = (key: string, load: () => Promise<InputValue>) => {
			if (requested.current.has(key)) return;
			requested.current.add(key);
			void load().catch(() => emptyInput())
				.then((value) => setRecorded((current) => ({ ...current, [key]: value })));
		};
		references.forEach((reference) =>
			read(referenceInputKey(reference), () => readExecutionReference(reference, execution)));
		scriptKeysId.split('\n').filter(Boolean).forEach((key) =>
			read(key, () => readExecutionScriptResult(readScriptResultBindId(key) ?? '', connection, execution)));
	}, [isActive, execution, references, scriptKeysId, connection]);

	const keys = [...references.map(referenceInputKey), ...scriptKeys];
	return {
		recorded,
		pendingKeys: isActive && execution ? keys.filter((key) => !recorded[key]) : [],
	};
}
