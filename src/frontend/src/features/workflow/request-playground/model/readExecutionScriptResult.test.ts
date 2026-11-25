import { beforeEach, expect, it, vi } from 'vitest';
import type { LoggedExecution } from '@features/logs';
import type { Connection } from '../../types/connection';
import { readExecutionScriptResult, readScriptResultBindId } from './readExecutionScriptResult';

const { executeScript } = vi.hoisted(() => ({ executeScript: vi.fn() }));
vi.mock('../../script-sandbox/langCodeApi', () => ({ executeScript }));
vi.mock('../../components/request-editor/body-editor/jsonPathEnvironment', () => ({
	loadJsonPathEnvironment: async () => null,
}));

const BIND_ID = 'abcdef0123456789abcdef01';
const connection = {
	fromConnector: { method: [{ color: '#aaaaaa', index: '0', name: 'GetOrder' }] },
	fieldBindings: [{
		id: BIND_ID,
		enhancement: {
			enhanceId: '1', language: 'js', script: 'RESULT_VAR = VAR_0 + 1;',
			args: { RESULT_VAR: '#bbbbbb.(request).body.$.total', VAR_0: '#aaaaaa.(response).body.$.amount' },
		},
	}],
} as unknown as Connection;

const selected = { segment: { request: { payload: JSON.stringify({ total: 99 }) } }, properties: {} };
const execution = (upstream: unknown) => ({
	method: selected,
	findMethod: vi.fn().mockResolvedValue(upstream),
	iteratorIndex: () => null,
}) as unknown as LoggedExecution;
const upstream = { segment: { response: { payload: JSON.stringify({ amount: 41 }) } }, properties: { name: 'GetOrder' } };

beforeEach(() => executeScript.mockReset());

it('recognises only binding references as script results', () => {
	expect(readScriptResultBindId(`#{%${BIND_ID}%}`)).toBe(BIND_ID);
	expect(readScriptResultBindId('#{%ref_12ab%}')).toBeNull();
});

it('runs the script on the backend with the values its variables had in the run', async () => {
	executeScript.mockResolvedValue({ kind: 'response', response: { success: true, result: 42 } });
	expect(await readExecutionScriptResult(BIND_ID, connection, execution(upstream)))
		.toEqual({ text: '42', kind: 'json', source: 'execution' });
	expect(executeScript).toHaveBeenCalledWith({ language: 'js', script: 'RESULT_VAR = VAR_0 + 1;', variables: { VAR_0: 41 } });
});

it('falls back to the value the logged request carried when the run fails', async () => {
	executeScript.mockResolvedValue({ kind: 'failure', failure: { status: 429, code: 'TOO_MANY_SCRIPT_RUNS' } });
	expect(await readExecutionScriptResult(BIND_ID, connection, execution(upstream)))
		.toEqual({ text: '99', kind: 'json', source: 'execution' });
});

it('falls back to the logged request when a variable did not run, without calling the backend', async () => {
	expect(await readExecutionScriptResult(BIND_ID, connection, execution(null)))
		.toEqual({ text: '99', kind: 'json', source: 'execution' });
	expect(executeScript).not.toHaveBeenCalled();
});

it('marks the result not executed when neither the variables nor the logged request have it', async () => {
	const noRequest = { ...execution(null), method: { segment: {}, properties: {} } } as unknown as LoggedExecution;
	expect(await readExecutionScriptResult(BIND_ID, connection, noRequest)).toMatchObject({ text: '', source: 'notExecuted' });
	expect(await readExecutionScriptResult('ffffffffffffffffffffffff', connection, noRequest)).toMatchObject({ source: 'empty' });
});
