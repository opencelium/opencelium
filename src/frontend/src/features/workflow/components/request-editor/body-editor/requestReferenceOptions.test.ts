import { describe, expect, it } from 'vitest';
import type { MethodWithId } from '../../../types/connection';
import { buildReferenceValue, getReferenceOptions, isExpandableReferencePath,
	readLiveValueAtPath } from './requestReferenceOptions';

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

	it('lists the keys of a non-wildcard object path', () => {
		expect(labels('node.')).toEqual(['references.allKeyNames', 'name', 'object1', 'object2']);
		expect(labels('node.object2.')).toEqual(['references.allKeyNames', 'path', 'value', 'hostname']);
	});
});

const keyNamesOption = (path: string) =>
	getReferenceOptions(method, 'body', path).find(({ label }) => label === 'references.allKeyNames');

describe('getReferenceOptions — all key names', () => {
	it("offers `['*']~` on a single object", () => {
		expect(keyNamesOption('node.')?.value).toBe("node['*']~");
		expect(keyNamesOption('node.object2.hostname.')?.value).toBe("node.object2.hostname['*']~");
	});

	it('offers it on the root object and builds a backend-readable reference', () => {
		const rootValue = keyNamesOption('')?.value ?? '';
		expect(buildReferenceValue('#C77E7E', 'body', rootValue)).toBe("#C77E7E.(response).body.$.['*']~");
		expect(buildReferenceValue('#C77E7E', 'body', "node['*']~")).toBe("#C77E7E.(response).body.$.node['*']~");
	});

	it('is not offered once the path fans out, since the backend base would be a list', () => {
		expect(keyNamesOption('node.*.')).toBeUndefined();
		expect(keyNamesOption('node.*.owner.')).toBeUndefined();
	});

	it('is a leaf, not an expandable path', () => {
		expect(isExpandableReferencePath(method, 'body', "node['*']~")).toBe(false);
	});

	it('resolves to the field names in a live value', () => {
		const resolve = () => null;
		expect(readLiveValueAtPath(body, "$.node['*']~", resolve)).toEqual(['name', 'object1', 'object2']);
		expect(readLiveValueAtPath(body, "$.['*']~", resolve)).toEqual(['node']);
		expect(readLiveValueAtPath(body, "$.node.name['*']~", resolve)).toBeUndefined();
	});
});

describe('getReferenceOptions — last array element', () => {
	const servers = { servers: [{ name: 'web-01', ip: '10.0.0.1' }, { name: 'web-02', ip: '10.0.0.2' }] };
	const arrayMethod = { response: { success: { body: { type: 'object', fields: servers } } } } as unknown as MethodWithId;
	const options = (path: string) => getReferenceOptions(arrayMethod, 'body', path);

	it('offers `[-1]` next to the first element on an array', () => {
		expect(options('servers').map(({ value }) => value))
			.toEqual(['servers[0]', 'servers[-1]', 'servers[*]']);
		expect(options('servers').find(({ value }) => value === 'servers[-1]')?.label)
			.toBe('references.lastArrayElement');
	});

	it('drills into the element fields after `[-1]`', () => {
		expect(isExpandableReferencePath(arrayMethod, 'body', 'servers[-1]')).toBe(true);
		expect(options('servers[-1].').map(({ label }) => label))
			.toEqual(['references.allKeyNames', 'name', 'ip']);
	});

	it('resolves `[-1]` to the last element in a live value', () => {
		const resolve = () => null;
		expect(readLiveValueAtPath(servers, '$.servers[-1].name', resolve)).toBe('web-02');
		expect(readLiveValueAtPath({ servers: [] }, '$.servers[-1]', resolve)).toBeUndefined();
	});
});
