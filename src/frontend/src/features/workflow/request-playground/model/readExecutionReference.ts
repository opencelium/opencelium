import type { LoggedExecution } from '@features/logs';
import { loadJsonPathEnvironment } from '../../components/request-editor/body-editor/jsonPathEnvironment';
import { readLiveValueAtPath } from '../../components/request-editor/body-editor/requestReferenceOptions';
import { readLiveValueWithJsonPath } from '../../components/request-editor/body-editor/referencePathSyntax';
import type { CollectedReference } from './collectPlaygroundInputs';
import { emptyInput, toInputValue, type InputValue } from './playgroundValues';

function readLoggedValue(raw: unknown): unknown {
	if (typeof raw !== 'string') return raw;
	try {
		return JSON.parse(raw);
	} catch {
		return raw;
	}
}

export async function readExecutionReference(reference: CollectedReference, execution: LoggedExecution): Promise<InputValue> {
	const { parsed, sourceMethod } = reference;
	if (!sourceMethod?.index) return emptyInput();
	const location = execution.methodLocations?.get(parsed.color.toLowerCase());
	if (execution.methodLocations && !location) return emptyInput();
	const source = location
		? await execution.findMethod(location.indexPath, location.direction)
		: await execution.findMethod(sourceMethod.index);
	if (!source) return { ...emptyInput(), source: 'notExecuted' };
	if ((source.properties.name && source.properties.name !== sourceMethod.name)
		|| (source.properties.operationId && source.properties.operationId.toLowerCase() !== parsed.color.toLowerCase())) {
		return emptyInput();
	}
	const segment = parsed.direction === 'request' ? source.segment?.request : source.segment?.response;
	if (parsed.messageProperty === 'status') {
		return toInputValue(source.segment?.response?.status, 'execution');
	}
	const data = readLoggedValue(parsed.messageProperty === 'header' ? segment?.header : segment?.payload);
	if (data === undefined) return emptyInput();
	const environment = await loadJsonPathEnvironment();
	const result = environment && readLiveValueWithJsonPath(environment, data, parsed.path, execution.iteratorIndex);
	const value = result ? result.value : readLiveValueAtPath(data, parsed.path, execution.iteratorIndex);
	return toInputValue(value, 'execution');
}
