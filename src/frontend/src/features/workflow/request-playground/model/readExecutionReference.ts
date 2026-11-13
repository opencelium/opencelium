import type { DetailedMethodLog, LoggedExecution } from '@features/logs';
import { loadJsonPathEnvironment } from '../../components/request-editor/body-editor/jsonPathEnvironment';
import { readLiveValueAtPath } from '../../components/request-editor/body-editor/requestReferenceOptions';
import { readLiveValueWithJsonPath } from '../../components/request-editor/body-editor/referencePathSyntax';
import type { ParsedArg } from '../../components/request-editor/utils/parseEnhancementArg';
import type { MethodWithId } from '../../types/connection';
import type { CollectedReference } from './collectPlaygroundInputs';
import { emptyInput, toInputValue, type InputValue } from './playgroundValues';

export type RecordedValue =
	| { kind: 'value'; value: unknown }
	| { kind: 'notExecuted' }
	| { kind: 'unavailable' };

function readLoggedValue(raw: unknown): unknown {
	if (typeof raw !== 'string') return raw;
	try {
		return JSON.parse(raw);
	} catch {
		return raw;
	}
}

// Reads `parsed` out of a logged method: its request or response body, header or status.
export async function readLoggedMethodValue(log: DetailedMethodLog, parsed: ParsedArg,
	execution: LoggedExecution): Promise<RecordedValue> {
	if (parsed.messageProperty === 'status') {
		const status = log.segment?.response?.status;
		return status === undefined ? { kind: 'unavailable' } : { kind: 'value', value: status };
	}
	const segment = parsed.direction === 'request' ? log.segment?.request : log.segment?.response;
	const data = readLoggedValue(parsed.messageProperty === 'header' ? segment?.header : segment?.payload);
	if (data === undefined) return { kind: 'unavailable' };
	const environment = await loadJsonPathEnvironment();
	const result = environment && readLiveValueWithJsonPath(environment, data, parsed.path, execution.iteratorIndex);
	return { kind: 'value', value: result ? result.value : readLiveValueAtPath(data, parsed.path, execution.iteratorIndex) };
}

export async function readExecutionValue(parsed: ParsedArg, sourceMethod: MethodWithId | undefined,
	execution: LoggedExecution): Promise<RecordedValue> {
	if (!sourceMethod?.index) return { kind: 'unavailable' };
	const location = execution.methodLocations?.get(parsed.color.toLowerCase());
	if (execution.methodLocations && !location) return { kind: 'unavailable' };
	const source = location
		? await execution.findMethod(location.indexPath, location.direction)
		: await execution.findMethod(sourceMethod.index);
	if (!source) return { kind: 'notExecuted' };
	if ((source.properties.name && source.properties.name !== sourceMethod.name)
		|| (source.properties.operationId && source.properties.operationId.toLowerCase() !== parsed.color.toLowerCase())) {
		return { kind: 'unavailable' };
	}
	return readLoggedMethodValue(source, parsed, execution);
}

export const toRecordedInput = (recorded: RecordedValue): InputValue => {
	switch (recorded.kind) {
		case 'value': return toInputValue(recorded.value, 'execution');
		case 'notExecuted': return { ...emptyInput(), source: 'notExecuted' };
		case 'unavailable': return emptyInput();
		default: {
			const _exhaustive: never = recorded;
			return _exhaustive;
		}
	}
};

export async function readExecutionReference(reference: CollectedReference, execution: LoggedExecution): Promise<InputValue> {
	return toRecordedInput(await readExecutionValue(reference.parsed, reference.sourceMethod, execution));
}
