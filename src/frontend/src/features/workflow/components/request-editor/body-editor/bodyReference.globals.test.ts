import { describe, expect, it } from 'vitest';
import {
	buildBodyEnhancement,
	getBindingArguments,
	hasMixedReferenceValue,
	hasOnlyReferences,
} from './bodyReference';
import { mergeReferenceValue } from './bodyValue';

const METHOD = '#1a2b3c.(response).body.$.url';
const GLOBAL = '{{global.baseUrl}}';

describe('global references next to method references in one field', () => {
	it('treats a method reference plus a global as references only, not a mixed value', () => {
		const value = `${METHOD};${GLOBAL}`;
		expect(hasMixedReferenceValue(value)).toBe(false);
		expect(hasOnlyReferences(value)).toBe(true);
	});

	it('still rejects plain text next to a method reference', () => {
		expect(hasMixedReferenceValue(`${METHOD};some text`)).toBe(true);
	});

	it('leaves a field with only a global as a plain value', () => {
		expect(hasOnlyReferences(GLOBAL)).toBe(false);
		expect(getBindingArguments(GLOBAL)).toEqual([]);
	});

	it('appends a global to method references and a method reference to a global', () => {
		expect(mergeReferenceValue(METHOD, GLOBAL)).toBe(`${METHOD};${GLOBAL}`);
		expect(mergeReferenceValue(GLOBAL, METHOD)).toBe(`${GLOBAL};${METHOD}`);
	});

	it('replaces a global with another global, since globals alone would be sent as text', () => {
		expect(mergeReferenceValue(GLOBAL, '{{global.other}}')).toBe('{{global.other}}');
	});

	it('gives each reference its own arg in field order', () => {
		const enhancement = buildBodyEnhancement('enh-1', '#ffffff.(request).body.$.name',
			getBindingArguments(`${GLOBAL};${METHOD}`));
		expect(enhancement.args).toEqual({
			RESULT_VAR: '#ffffff.(request).body.$.name',
			VAR_0: GLOBAL,
			VAR_1: METHOD,
		});
	});
});
