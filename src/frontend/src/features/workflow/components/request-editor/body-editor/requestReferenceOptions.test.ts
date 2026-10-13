import { describe, expect, it } from 'vitest';
import type { MethodWithId } from '../../../types/connection';
import { getReferenceOptions, isExpandableReferencePath } from './requestReferenceOptions';

const body = {
	node: {
		name: 'Jack',
		object1: { hostname: { ip: '182.121.1212.' }, title: 'srvtitle' },
		object2: { path: 'test11^2', value: 'tasfa', hostname: { net: { test: 'asdlfasd' } } },
	},
};

const method = { response: { success: { body: { type: 'object', fields: body } } } } as unknown as MethodWithId;

const labels = (path: string) => getReferenceOptions(method, 'body', path).map(({ label }) => label);
const values = (path: string) => getReferenceOptions(method, 'body', path).map(({ value }) => value);

describe('getReferenceOptions — object wildcard', () => {
	it('lists the combined properties of every child object after `*`', () => {
		expect(labels('node.*.')).toEqual(['hostname', 'title', 'path', 'value']);
	});

	it('keeps `*` unquoted in the generated option paths', () => {
		expect(values('node.*.')).toContain('node.*.hostname');
	});

	it('combines nested properties across all wildcard matches', () => {
		expect(labels('node.*.hostname.')).toEqual(['ip', 'net']);
	});

	it('treats a wildcard match as expandable', () => {
		expect(isExpandableReferencePath(method, 'body', 'node.*.hostname')).toBe(true);
		expect(isExpandableReferencePath(method, 'body', 'node.*.title')).toBe(false);
	});

	it('leaves non-wildcard paths unchanged', () => {
		expect(labels('node.')).toEqual(['name', 'object1', 'object2']);
		expect(labels('node.object2.')).toEqual(['path', 'value', 'hostname']);
	});
});
