import { describe, expect, it } from 'vitest';
import type { MethodWithId } from '../../../types/connection';
import { buildReferenceValue, getReferenceOptions, isExpandableReferencePath,
	isUnknownReferencePath, readLiveValueAtPath } from './requestReferenceOptions';

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
			.toEqual(['servers[0]', 'servers[-1]', 'servers[*]', 'servers.length()']);
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

describe('getReferenceOptions — array length', () => {
	const data = { servers: [{ name: 'web-01', tags: ['a', 'b'] }, { name: 'web-02', tags: [] }] };
	const arrayMethod = { response: { success: { body: { type: 'object', fields: data } } } } as unknown as MethodWithId;
	const rootArrayMethod = { response: { success: { body: { type: 'array', fields: [{ id: '1' }] } } } } as unknown as MethodWithId;
	const lengthOption = (target: MethodWithId, path: string) =>
		getReferenceOptions(target, 'body', path).find(({ label }) => label === 'references.arrayLength');

	it('offers `.length()` on an array without quoting it as a key', () => {
		expect(lengthOption(arrayMethod, 'servers')?.value).toBe('servers.length()');
		expect(lengthOption(arrayMethod, 'servers[0].tags')?.value).toBe('servers[0].tags.length()');
	});

	it('builds `$.length()` for a root array', () => {
		const value = lengthOption(rootArrayMethod, '')?.value ?? '';
		expect(buildReferenceValue('#C77E7E', 'body', value)).toBe('#C77E7E.(response).body.$.length()');
	});

	it('is not offered after a multi-match segment', () => {
		expect(lengthOption(arrayMethod, 'servers[*].tags')).toBeUndefined();
	});

	it('is a leaf, not an expandable path', () => {
		expect(isExpandableReferencePath(arrayMethod, 'body', 'servers.length()')).toBe(false);
	});

	it('resolves to the array size in a live value', () => {
		const resolve = () => null;
		expect(readLiveValueAtPath(data, '$.servers.length()', resolve)).toBe(2);
		expect(readLiveValueAtPath(data, '$.servers[-1].tags.length()', resolve)).toBe(0);
		expect(readLiveValueAtPath(data, '$.servers[0].name.length()', resolve)).toBeUndefined();
	});
});

describe('isUnknownReferencePath', () => {
	const shape = {
		node: { name: '', object1: { title: '' } },
		servers: [{ name: '', tags: [] }],
		declaredOnly: {},
		untypedList: [],
	};
	const shapeMethod = { response: { success: { body: { type: 'object', fields: shape } } } } as unknown as MethodWithId;
	const isUnknown = (path: string, iterators: string[] = []) =>
		isUnknownReferencePath(shapeMethod, 'body', path, iterators);

	it('flags a key the declared shape does not have', () => {
		expect(isUnknown('node.titel')).toBe(true);
		expect(isUnknown('$.node.object1.missing')).toBe(true);
		expect(isUnknown('node.name.deeper')).toBe(true);
	});

	it('accepts every path the picker can generate', () => {
		['node.object1.title', 'node.*.title', "node['*']~", 'servers[0].name', 'servers[-1].tags',
			'servers[*].name', 'servers.length()', '$', '']
			.forEach((path) => expect(isUnknown(path), path).toBe(false));
	});

	it('accepts typed array indexes and for-in iterator keys', () => {
		expect(isUnknown('servers[3].name')).toBe(false);
		expect(isUnknown('servers[j].name')).toBe(false);
		expect(isUnknown("node['i'].title", ['i'])).toBe(false);
	});

	it('does not judge paths below a field the invoker declared without children', () => {
		expect(isUnknown('declaredOnly.anything.deeper')).toBe(false);
		expect(isUnknown('untypedList[0].id')).toBe(false);
	});

	it('only checks the response body', () => {
		expect(isUnknownReferencePath(shapeMethod, 'header', 'X-Unknown')).toBe(false);
		expect(isUnknownReferencePath(undefined, 'body', 'node.titel')).toBe(false);
	});
});
