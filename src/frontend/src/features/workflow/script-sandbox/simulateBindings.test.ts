import { describe, expect, it } from 'vitest';
import { toServerArg, toServerResult } from './simulateBindings';

describe('toServerArg', () => {
	it.each([['text'], [42], [1.5], [true], [''], [null]])('passes %j through unchanged', (value) => {
		expect(toServerArg(value)).toBe(value);
	});

	it('rewrites XML attribute keys to @-prefixed keys', () => {
		expect(toServerArg({ '__oc__attributes.id': '5', __oc__value: 'x' })).toEqual({
			'@id': '5',
			__oc__value: 'x',
		});
	});

	it('applies the replacement to the whole JSON text, values included, like the server', () => {
		expect(
			toServerArg({ 'field.__oc__value': 'text.__oc__value __oc__attributes.id' }),
		).toEqual({ field: 'text @id' });
	});

	it('round-trips arrays through JSON', () => {
		expect(toServerArg([{ '__oc__attributes.a': 1 }, undefined])).toEqual([{ '@a': 1 }, null]);
	});
});

describe('toServerResult', () => {
	it.each([
		['hello', 'String'],
		[3, 'Number'],
		[false, 'Boolean'],
	] as const)('returns %j unchanged as %s', (value, serverType) => {
		expect(toServerResult(value)).toEqual({ value, serverType });
	});

	it.each([null, undefined])('maps %s to Null', (value) => {
		expect(toServerResult(value)).toEqual({ value: null, serverType: 'Null' });
	});

	it('drops functions from an object result and reports a Map', () => {
		expect(toServerResult({ a: 1, f: function () {} })).toEqual({
			value: { a: 1 },
			serverType: 'Map',
		});
	});

	it('turns undefined array items into null and reports a List', () => {
		expect(toServerResult([1, undefined])).toEqual({ value: [1, null], serverType: 'List' });
	});

	it.each([
		['a function', function () {}],
		['a Date', new Date(0)],
	])('rejects %s, which the server cannot read back', (_, value) => {
		expect(() => toServerResult(value)).toThrow('invalidResult');
	});
});
