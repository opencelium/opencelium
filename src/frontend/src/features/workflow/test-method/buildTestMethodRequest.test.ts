import { describe, expect, it } from 'vitest';
import type { MethodTestInputs } from './collectMethodReferences';
import { buildTestMethodRequest, findInvalidJsonInputKeys, findMissingInputKeys, selectMethodFieldBindings } from './buildTestMethodRequest';
import type { TestMethodDraft } from './testMethod.types';
import { parseInputValue, readJsonError, toInputValue } from './testMethodInputValue';

const binding = (resultVar: string) => ({
	enhancement: { enhanceId: 'e1', language: 'js', script: 'RESULT_VAR = VAR_0', args: { VAR_0: '#aaaaaa.(response).body.$.id', RESULT_VAR: resultVar } },
});

describe('selectMethodFieldBindings', () => {
	it('keeps only the bindings that write into this method’s request', () => {
		const selected = selectMethodFieldBindings([
			binding('#BBBBBB.(request).body.$.id'),
			binding('#cccccc.(request).body.$.id'),
		], '#bbbbbb');
		expect(selected).toHaveLength(1);
		expect(selected[0]).toMatchObject({ to: [{ color: '#BBBBBB', type: 'request' }] });
	});
});

describe('input values', () => {
	it('keeps a string sample a string even when it looks like a number', () => {
		const value = toInputValue('123', 'sample');
		expect(parseInputValue(value)).toBe('123');
	});

	it('parses JSON input and falls back to the raw text', () => {
		expect(parseInputValue({ text: '{"a":1}', kind: 'json' })).toEqual({ a: 1 });
		expect(parseInputValue({ text: '42', kind: 'json' })).toBe(42);
		expect(parseInputValue({ text: 'not json', kind: 'json' })).toBe('not json');
	});

	it('reports JSON that does not parse, but not text, empty or valid JSON', () => {
		expect(readJsonError({ text: '{"a": 1,}', kind: 'json' })).toEqual(expect.any(String));
		expect(readJsonError({ text: '{"a": 1,}', kind: 'string' })).toBeNull();
		expect(readJsonError({ text: '  ', kind: 'json' })).toBeNull();
		expect(readJsonError({ text: '[1, 2]', kind: 'json' })).toBeNull();
	});

	it('round-trips an object sample', () => {
		const value = toInputValue({ list: [1, 2] }, 'live');
		expect(value.kind).toBe('json');
		expect(parseInputValue(value)).toEqual({ list: [1, 2] });
	});
});

describe('buildTestMethodRequest', () => {
	const inputs = {
		references: [{ reference: '#aaaaaa.(response).body.$.id', targets: [{ location: 'url', property: null }] }],
		webhooks: [{ name: 'tag', type: 'string', targets: [{ location: 'body', property: 'tag' }] }],
	} as unknown as MethodTestInputs;
	const draft = { color: '#bbbbbb', request: { method: 'GET' } } as unknown as TestMethodDraft;

	it('sends every input with its parsed value', () => {
		const request = buildTestMethodRequest({
			connectionId: 5, draft, fieldBindings: [], inputs,
			values: { '#aaaaaa.(response).body.$.id': { text: '7', kind: 'json', source: 'edited' } },
		});
		expect(request.references).toEqual([{ reference: '#aaaaaa.(response).body.$.id', value: 7 }]);
		expect(request.webhooks).toEqual([{ name: 'tag', value: '' }]);
		expect(request.connectionId).toBe(5);
	});

	it('reports empty inputs as missing', () => {
		expect(findMissingInputKeys(inputs, {
			'#aaaaaa.(response).body.$.id': { text: ' ', kind: 'json', source: 'edited' },
		})).toEqual(['#aaaaaa.(response).body.$.id', 'webhook:tag']);
	});

	it('reports inputs whose JSON does not parse', () => {
		expect(findInvalidJsonInputKeys(inputs, {
			'#aaaaaa.(response).body.$.id': { text: '{"a":', kind: 'json', source: 'edited' },
			'webhook:tag': { text: '{"a":', kind: 'string', source: 'edited' },
		})).toEqual(['#aaaaaa.(response).body.$.id']);
	});
});
