import { describe, expect, it } from 'vitest';
import { fromEditText, setBodyValue, toEditText } from './bodyEdit';

describe('setBodyValue', () => {
	it('writes into nested objects and arrays without touching siblings', () => {
		const body = { data: { title: 'a', tags: ['x', 'y'] }, id: 1 };
		expect(setBodyValue(body, ['data', 'tags', 1], 'z')).toEqual({ data: { title: 'a', tags: ['x', 'z'] }, id: 1 });
		expect(body.data.tags[1]).toBe('y');
	});

	it('writes into the fields of a payload-wrapped body', () => {
		const body = { type: 'object', format: 'json', fields: { name: '' } };
		expect(setBodyValue(body, ['name'], 'Bremen')).toEqual({ ...body, fields: { name: 'Bremen' } });
	});
});

describe('edit text', () => {
	it('keeps strings as text and reads other scalars back as JSON', () => {
		expect(fromEditText('42', 'old')).toBe('42');
		expect(fromEditText('42', 1)).toBe(42);
		expect(fromEditText('true', false)).toBe(true);
		expect(fromEditText('not json', 1)).toBe('not json');
		expect(toEditText(null)).toBe('null');
	});
});
