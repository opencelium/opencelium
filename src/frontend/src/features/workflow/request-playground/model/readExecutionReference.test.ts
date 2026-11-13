import { expect, it, vi } from 'vitest';
import type { LoggedExecution } from '@features/logs';
import type { MethodWithId } from '../../types/connection';
import type { CollectedReference } from './collectPlaygroundInputs';
import { readExecutionReference } from './readExecutionReference';
import { buildPlaygroundRequest } from './buildPlaygroundRequest';
import { defaultSettings } from './playgroundSettings';
import type { PlaygroundDraft } from './playground.types';
import { simulatePlaygroundRequest } from '@/mock/requestPlayground/simulatePlaygroundRequest';

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

it('sends the recorded iteration value in both the URL and request header', async () => {
	const response = { payload: JSON.stringify({ items: [{}, {}, { name: 'three' }] }) };
	const findMethod = vi.fn().mockResolvedValue({ segment: { response }, properties: {} });
	const value = await readExecutionReference(reference, createExecution(findMethod));
	const token = `{%${reference.reference}%}`;
	const request = buildPlaygroundRequest({
		connectionId: 9, connectorId: null, fieldBindings: [],
		draft: { color: '#bbbbbb', request: {
			endpoint: `https://example.test/items/${token}`, method: 'GET',
			header: { 'X-Logged-Value': token }, body: { fields: {} },
		} } as PlaygroundDraft,
		inputs: { references: [reference], webhooks: [], connectionFields: [] },
		values: { [reference.reference]: value }, prefillSource: 'execution',
		requestData: {}, settings: defaultSettings(undefined),
	});
	expect(request.runUpstream).toBe(false);
	expect(simulatePlaygroundRequest(request).request).toMatchObject({
		url: 'https://example.test/items/three', headers: { 'X-Logged-Value': 'three' },
	});
});
