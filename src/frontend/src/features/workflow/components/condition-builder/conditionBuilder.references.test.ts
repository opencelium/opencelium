import { describe, expect, it } from 'vitest';
import { parsePathFromReference, parseResponseTypeFromReference } from './conditionBuilder.utils';

describe('parseResponseTypeFromReference', () => {
	it('reads the message property from the segment after (response), not from the path', () => {
		expect(parseResponseTypeFromReference('#3F8AB4.(response).body.$.issues[i].fields.status'))
			.toBe('body');
		expect(parseResponseTypeFromReference('#3F8AB4.(response).body.$.data.header.value'))
			.toBe('body');
		expect(parseResponseTypeFromReference('#3F8AB4.(response).status')).toBe('status');
		expect(parseResponseTypeFromReference('#3F8AB4.(response).header.Authorization')).toBe('header');
	});

	it('unwraps the {% %} form and tolerates a missing #', () => {
		expect(parseResponseTypeFromReference('{% #3F8AB4.(response).body.$.a %}')).toBe('body');
		expect(parseResponseTypeFromReference('3F8AB4.(response).status')).toBe('status');
	});

	it('returns undefined for anything that is not a method reference', () => {
		expect(parseResponseTypeFromReference('issues[i].fields.status')).toBeUndefined();
		expect(parseResponseTypeFromReference('')).toBeUndefined();
		expect(parseResponseTypeFromReference(undefined)).toBeUndefined();
	});
});

describe('parsePathFromReference', () => {
	it('strips the reference head and the $ root', () => {
		expect(parsePathFromReference('#3F8AB4.(response).body.$.issues[i].fields.status'))
			.toBe('issues[i].fields.status');
		expect(parsePathFromReference('#3F8AB4.(response).body.$')).toBe('$');
		expect(parsePathFromReference('#3F8AB4.(response).header.Authorization')).toBe('Authorization');
		expect(parsePathFromReference('#3F8AB4.(response).status')).toBe('status');
	});

	it('leaves a bare path untouched even when it contains body/header segments', () => {
		expect(parsePathFromReference('issues[i].fields.status')).toBe('issues[i].fields.status');
		expect(parsePathFromReference('data.body.x')).toBe('data.body.x');
		expect(parsePathFromReference('$')).toBe('$');
	});
});
