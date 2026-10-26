import { describe, expect, it } from 'vitest';
import type { Connection, MethodWithId } from '../../types/connection';
import { collectPlaygroundInputs } from './collectPlaygroundInputs';
import type { PlaygroundDraft } from './playground.types';
import { readSampleValue } from './playgroundValues';

const upstream = {
	id: 'm1', index: '0', name: 'GetUsers', color: '#aaaaaa',
	response: { success: { status: '200', header: { 'x-total': '2' }, body: { fields: { users: [{ id: 7, name: 'Ann' }, { id: 8, name: 'Bob' }] } } } },
} as unknown as MethodWithId;

const connection = { fromConnector: { method: [upstream], operator: [] } } as unknown as Connection;

const draft = (request: Partial<PlaygroundDraft['request']>) => ({
	id: 'm2', color: '#bbbbbb', name: 'UpdateUser',
	request: { endpoint: '', method: 'POST', header: {}, body: { fields: {} }, ...request },
}) as unknown as PlaygroundDraft;

const collect = (request: Partial<PlaygroundDraft['request']>, fields: string[] = []) =>
	collectPlaygroundInputs(draft(request), connection, fields);

describe('collectPlaygroundInputs', () => {
	it('finds references in the headers and body and merges repeated ones, but not in the url', () => {
		const { references } = collect({
			endpoint: 'https://api.test/users/{%#aaaaaa.(response).body.$.users[i].id%}',
			header: { 'X-Count': '#aaaaaa.(response).header.$.x-total' },
			body: { fields: { id: '#aaaaaa.(response).body.$.users[i].id', nested: { all: '#aaaaaa.(response).body.$' } } },
		});

		expect(references.map(({ reference, targets }) => ({ reference, targets }))).toEqual([
			{ reference: '#aaaaaa.(response).header.$.x-total', targets: [{ location: 'header', property: 'X-Count' }] },
			{ reference: '#aaaaaa.(response).body.$.users[i].id', targets: [{ location: 'body', property: 'id' }] },
			{ reference: '#aaaaaa.(response).body.$', targets: [{ location: 'body', property: 'nested.all' }] },
		]);
		expect(references[1].sourceMethod).toBe(upstream);
	});

	it('names the array position a value lands in', () => {
		const { references } = collect({ body: { fields: { units: [{ id: '#aaaaaa.(response).body.$.unit' }] } } });
		expect(references.map((item) => item.targets)).toEqual([[{ location: 'body', property: 'units[0].id' }]]);
	});

	it('skips references to the method’s own request, which the backend produces', () => {
		expect(collect({ body: { fields: { copy: '#bbbbbb.(request).body.$.id' } } }).references).toEqual([]);
	});

	it('keeps a reference whose source method no longer exists, without a source', () => {
		const { references } = collect({ body: { fields: { status: '#cccccc.(response).status' } } });
		expect(references).toHaveLength(1);
		expect(references[0].sourceMethod).toBeUndefined();
	});

	it('collects webhook parameters with their declared type', () => {
		const { webhooks } = collect({
			endpoint: '/users/${userId:int}',
			body: { fields: { tags: '${tags:array}', again: '${userId:int}' } },
		});
		expect(webhooks).toEqual([
			{ name: 'userId', type: 'int', targets: [{ location: 'url', property: null }, { location: 'body', property: 'again' }] },
			{ name: 'tags', type: 'array', targets: [{ location: 'body', property: 'tags' }] },
		]);
	});

	it('collects only the connection placeholders the connector actually defines', () => {
		const { connectionFields, webhooks } = collect({
			endpoint: '{url}/api?token={token}',
			header: { Authorization: 'Basic {password}', 'X-Other': '{unknown}' },
			body: { fields: { hook: '${url}' } },
		}, ['url', 'token', 'password']);
		expect(connectionFields).toEqual([
			{ field: 'url', targets: [{ location: 'url', property: null }] },
			{ field: 'token', targets: [{ location: 'url', property: 'token' }] },
			{ field: 'password', targets: [{ location: 'header', property: 'Authorization' }] },
		]);
		expect(webhooks.map(({ name }) => name)).toEqual(['url']);
	});
});

describe('readSampleValue', () => {
	const referenceAt = (reference: string) => collect({ body: { fields: { value: reference } } }).references[0];

	it('reads the sample response, taking element 0 for an iterator', () => {
		expect(readSampleValue(referenceAt('#aaaaaa.(response).body.$.users[i].name'))).toBe('Ann');
		expect(readSampleValue(referenceAt('#aaaaaa.(response).header.$.x-total'))).toBe('2');
		expect(readSampleValue(referenceAt('#aaaaaa.(response).status'))).toBe('200');
	});

	it('has no sample for a deleted source method', () => {
		expect(readSampleValue(referenceAt('#cccccc.(response).body.$.id'))).toBeUndefined();
	});
});
