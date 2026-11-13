import type { LoggedExecution } from '@features/logs';
import { findMethodByColor } from '../../components/request-editor/body-editor/requestReferenceOptions';
import { parseEnhancementArg } from '../../components/request-editor/utils/parseEnhancementArg';
import { executeScript } from '../../script-sandbox/langCodeApi';
import type { Connection } from '../../types/connection';
import type { InputValue } from './playgroundValues';
import { readExecutionValue, readLoggedMethodValue, toRecordedInput, type RecordedValue } from './readExecutionReference';

// `#{%<bindId>%}` stands for the result of the field binding with that id.
const SCRIPT_RESULT_RE = /^#\{%([A-Fa-f0-9]{24})%\}$/;

export const readScriptResultBindId = (key: string) => SCRIPT_RESULT_RE.exec(key)?.[1] ?? null;

const parseArg = (value: string) => parseEnhancementArg(value.trim().replace(/^\{%\s*/, '').replace(/\s*%}$/, ''));

// What the logged request of the selected method carried where the script writes its result.
async function readLoggedResult(resultVar: string | undefined, execution: LoggedExecution): Promise<RecordedValue> {
	const parsed = resultVar ? parseArg(resultVar) : null;
	return parsed ? readLoggedMethodValue(execution.method, parsed, execution) : { kind: 'unavailable' };
}

async function runWithRecordedVariables(script: string, args: Record<string, string>, connection: Connection,
	execution: LoggedExecution): Promise<RecordedValue> {
	const variables: Record<string, unknown> = {};
	for (const [name, arg] of Object.entries(args)) {
		if (!/^VAR_\d+$/.test(name)) continue;
		const parsed = parseArg(arg);
		if (!parsed) return { kind: 'unavailable' };
		const recorded = await readExecutionValue(parsed, findMethodByColor(connection.fromConnector.method, parsed.color), execution);
		if (recorded.kind !== 'value') return recorded;
		variables[name] = recorded.value;
	}
	const run = await executeScript({ language: 'js', script, variables });
	return run.kind === 'response' && run.response.success
		? { kind: 'value', value: run.response.result }
		: { kind: 'unavailable' };
}

// The script runs on the backend (same engine as an execution) with the values its
// variables had in this run. When a variable cannot be recovered or the run fails,
// the value the logged request actually carried is used instead.
export async function readExecutionScriptResult(bindId: string, connection: Connection,
	execution: LoggedExecution): Promise<InputValue> {
	const binding = connection.fieldBindings?.find((item) => item.id === bindId);
	if (!binding) return toRecordedInput({ kind: 'unavailable' });
	const { script, language, args = {} } = binding.enhancement;
	const computed = (language ?? 'js') === 'js' && script?.trim()
		? await runWithRecordedVariables(script, args, connection, execution)
		: { kind: 'unavailable' } as const;
	if (computed.kind === 'value') return toRecordedInput(computed);
	const logged = await readLoggedResult(args.RESULT_VAR, execution);
	return toRecordedInput(logged.kind === 'value' ? logged : computed);
}
