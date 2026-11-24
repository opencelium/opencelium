import { describe, expect, it } from 'vitest';
import { JSONPathEnvironment } from 'json-p3';
import { checkReferencePathSyntax, readLiveValueWithJsonPath, toJsonPathQuery } from './referencePathSyntax';

const environment = new JSONPathEnvironment();
const check = (path: string) => checkReferencePathSyntax(environment, path);

describe('toJsonPathQuery', () => {
	it.each([
		['', '$'],
		['$', '$'],
		['$.', '$'],
		['items[0].name', '$.items[0].name'],
		['[0].name', '$[0].name'],
		['$.items[i].name', '$.items[0].name'],
		['$.items[].name', '$.items[*].name'],
		["$.node['*']~", "$.node['*']"],
		['$.text[i]~', '$.text[0]'],
		['$.items.length()', '$.items'],
		['length()', '$'],
	])('%s → %s', (path, query) => {
		expect(toJsonPathQuery(path).text).toBe(query);
	});
});

describe('checkReferencePathSyntax', () => {
	it.each([
		'$.items[0].name', '$.items[-1]', '$.items[*].name', '$.node.*.title', "$.node['my key']",
		"$.node['*']~", '$.items[i].name', "$.obj['i']", '$.items.length()', '$.items[?(@.x > 1)]', 'items[0]',
	])('accepts %s', (path) => {
		expect(check(path)).toEqual({ status: 'valid' });
	});

	it('points at the offending character of the original path', () => {
		expect(check('$.a b')).toEqual({ status: 'syntaxError', position: 4, character: 'b' });
		expect(check('a b')).toEqual({ status: 'syntaxError', position: 2, character: 'b' });
		expect(check('$.items[i] x')).toEqual({ status: 'syntaxError', position: 11, character: 'x' });
	});

	it('reports an unfinished path as incomplete', () => {
		expect(check('$.items[')).toMatchObject({ status: 'syntaxError', character: null });
		expect(check("$.items['x'")).toMatchObject({ status: 'syntaxError', character: null });
	});

	it('rejects OpenCelium tail operators anywhere but the end', () => {
		expect(check("$.node['*']~.name")).toMatchObject({ status: 'syntaxError', character: '~' });
		expect(check('$.items.length().x')).toMatchObject({ status: 'syntaxError' });
	});
});

describe('readLiveValueWithJsonPath', () => {
	const source = { node: { a: { title: 'x' }, b: { title: 'y' } }, items: [{ id: 1 }, { id: 2 }] };
	const noIterators = () => null;

	it('returns every match of an indefinite path as a list', () => {
		expect(readLiveValueWithJsonPath(environment, source, '$.node.*.title', noIterators)).toEqual({ value: ['x', 'y'] });
		expect(readLiveValueWithJsonPath(environment, source, 'items[*].id', noIterators)).toEqual({ value: [1, 2] });
	});

	it('leaves definite paths and tail operators to the hand-written walker', () => {
		expect(readLiveValueWithJsonPath(environment, source, '$.items[0].id', noIterators)).toBeNull();
		expect(readLiveValueWithJsonPath(environment, source, "$.node['*']~", noIterators)).toBeNull();
		expect(readLiveValueWithJsonPath(environment, source, "$.node['a*b']", noIterators)).toBeNull();
	});

	it('substitutes the current iterator index and bails on an unknown iterator', () => {
		const nested = { rows: [{ cells: [1, 2] }, { cells: [3, 4] }] };
		expect(readLiveValueWithJsonPath(environment, nested, '$.rows[i].cells[*]', () => 1)).toEqual({ value: [3, 4] });
		expect(readLiveValueWithJsonPath(environment, nested, '$.rows[i].cells[*]', noIterators)).toBeNull();
	});
});
