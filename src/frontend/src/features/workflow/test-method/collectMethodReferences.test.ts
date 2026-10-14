import { describe, expect, it } from 'vitest';
import type { Connection, MethodWithId } from '../types/connection';
import { collectMethodReferences } from './collectMethodReferences';
import type { TestMethodDraft } from './testMethod.types';
import { readSampleValue } from './testMethodInputValue';

const upstream = {
	id: 'm1', index: '0', name: 'GetUsers', color: '#aaaaaa',
	response: { success: { status: '200', header: { 'x-total': '2' }, body: { fields: { users: [{ id: 7, name: 'Ann' }] } } } },
} as unknown as MethodWithId;

const connection = { fromConnector: { method: [upstream], operator: [] } } as unknown as Connection;

const draft = (request: Partial<TestMethodDraft['request']>) => ({
	id: 'm2', color: '#bbbbbb', name: 'UpdateUser',
	request: { endpoint: '', method: 'POST', header: {}, body: { fields: {} }, ...request },
}) as unknown as TestMethodDraft;

describe('collectMethodReferences', () => {
	it('finds references in the url, headers and body and merges repeated ones', () => {
		const { references } = collectMethodReferences(draft({
			endpoint: 'https://api.test/users/{%#aaaaaa.(response).body.$.users[i].id%}',
			header: { 'X-Count': '#aaaaaa.(response).header.$.x-total' },
			body: { fields: { id: '#aaaaaa.(response).body.$.users[i].id', nested: { all: '#aaaaaa.(response).body.$' } } },
		}), connection);

		expect(references.map(({ reference, locations }) => ({ reference, locations }))).toEqual([
			{ reference: '#aaaaaa.(response).body.$.users[i].id', locations: ['url', 'body'] },
			{ reference: '#aaaaaa.(response).header.$.x-total', locations: ['header'] },
			{ reference: '#aaaaaa.(response).body.$', locations: ['body'] },
		]);
		expect(references[0].sourceMethod).toBe(upstream);
	});

	it('splits `;`-joined references of one field into separate inputs', () => {
		const { references } = collectMethodReferences(draft({
			body: { fields: { name: '#aaaaaa.(response).body.$.first;#aaaaaa.(response).body.$.last' } },
		}), connection);
		expect(references.map((item) => item.reference)).toEqual([
			'#aaaaaa.(response).body.$.first',
			'#aaaaaa.(response).body.$.last',
		]);
	});

	it('skips references to the method’s own request, which the backend produces', () => {
		const { references } = collectMethodReferences(draft({
			body: { fields: { copy: '#bbbbbb.(request).body.$.id' } },
		}), connection);
		expect(references).toEqual([]);
	});

	it('keeps a reference whose source method no longer exists, without a source', () => {
		const { references } = collectMethodReferences(draft({ endpoint: '/x/{%#cccccc.(response).status%}' }), connection);
		expect(references).toHaveLength(1);
		expect(references[0].sourceMethod).toBeUndefined();
	});

	it('collects webhook parameters with their declared type', () => {
		const { webhooks } = collectMethodReferences(draft({
			endpoint: '/users/${userId:int}',
			body: { fields: { tags: '${tags:array}', again: '${userId:int}' } },
		}), connection);
		expect(webhooks).toEqual([
			{ name: 'userId', type: 'int', locations: ['url', 'body'] },
			{ name: 'tags', type: 'array', locations: ['body'] },
		]);
	});
});

describe('readSampleValue', () => {
	const sampleOf = (endpoint: string) =>
		readSampleValue(collectMethodReferences(draft({ endpoint }), connection).references[0]);

	it('reads the sample response, taking element 0 for an iterator', () => {
		expect(sampleOf('/{%#aaaaaa.(response).body.$.users[i].name%}')).toBe('Ann');
		expect(sampleOf('/{%#aaaaaa.(response).header.$.x-total%}')).toBe('2');
		expect(sampleOf('/{%#aaaaaa.(response).status%}')).toBe('200');
	});

	it('has no sample for a deleted source method', () => {
		expect(sampleOf('/{%#cccccc.(response).body.$.id%}')).toBeUndefined();
	});
});
