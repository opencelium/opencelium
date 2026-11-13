import { expect, it, vi } from 'vitest';
import type { LoggedExecution } from '@features/logs';
import type { MethodWithId } from '../../types/connection';
import type { CollectedReference } from './collectPlaygroundInputs';
import { readExecutionReference } from './readExecutionReference';
import { buildStaticValues } from './methodTestRefs';

vi.mock('../../components/request-editor/body-editor/jsonPathEnvironment', () => ({
	loadJsonPathEnvironment: async () => null,
}));

const reference: CollectedReference = {
	reference: '#aaaaaa.(response).body.$.items[i].name',
	parsed: { color: '#aaaaaa', direction: 'response', messageProperty: 'body', path: 'items[i].name' },
	sourceMethod: { index: '0' } as MethodWithId,
	targets: [],
};

function createExecution(findMethod: LoggedExecution['findMethod']) {
	return { findMethod, iteratorIndex: (name: string) => name === 'i' ? 2 : null } as LoggedExecution;
}

it('uses the selected loop index when a reference reads a response from outside the loop', async () => {
	const response = { payload: JSON.stringify({ items: [{ name: 'one' }, { name: 'two' }, { name: 'three' }] }) };
	const findMethod = vi.fn().mockResolvedValue({ segment: { response }, properties: { operationId: '#aaaaaa' } });
	expect(await readExecutionReference(reference, createExecution(findMethod)))
		.toEqual({ text: 'three', kind: 'string', source: 'execution' });
	expect(findMethod).toHaveBeenCalledWith('0');
});

it('distinguishes an unexecuted method from an empty value recorded in the logs', async () => {
	expect(await readExecutionReference(reference, createExecution(async () => null)))
		.toMatchObject({ text: '', source: 'notExecuted' });
	const response = { payload: JSON.stringify({ items: [{}, {}, { name: '' }] }) };
	const findMethod = vi.fn().mockResolvedValue({ segment: { response }, properties: {} });
	expect(await readExecutionReference(reference, createExecution(findMethod)))
		.toEqual({ text: '', kind: 'string', source: 'execution' });
});

it('supplies the recorded iteration value under both API reference spellings', async () => {
	const response = { payload: JSON.stringify({ items: [{}, {}, { name: 'three' }] }) };
	const findMethod = vi.fn().mockResolvedValue({ segment: { response }, properties: {} });
	const value = await readExecutionReference(reference, createExecution(findMethod));
	const token = `{%${reference.reference}%}`;
	expect(buildStaticValues({
		refs: { connectorReferences: [], staticReferences: [
			{ reference: token, type: 'WRAPPED_DIRECT' },
			{ reference: reference.reference, type: 'DIRECT' },
		] },
		values: { [reference.reference]: value },
		connectorOverrides: {},
	})).toEqual({ [token]: 'three', [reference.reference]: 'three' });
});
