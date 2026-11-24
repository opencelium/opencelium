import { describe, expect, it } from 'vitest';
import { checkNashornCompatibility } from './checkNashornCompatibility';

describe('checkNashornCompatibility', () => {
	it.each([
		['arr.find(function (x) { return x; });', 'arr.find'],
		['Object.assign({}, a);', 'Object.assign'],
		['str.includes("x");', 'str.includes'],
	])('warns about the ES2015+ built-in in %s', (script, name) => {
		expect(checkNashornCompatibility(script)).toEqual([
			{ kind: 'unsupportedBuiltin', name, line: 1, column: 0 },
		]);
	});

	it('flags Java.type as server-only', () => {
		expect(checkNashornCompatibility("var U = Java.type('java.util.UUID');")).toEqual([
			{ kind: 'serverOnly', name: 'Java.type', line: 1, column: 8 },
		]);
	});

	it.each(['load', 'quit', 'exit'])('flags %s() as server-only', (name) => {
		expect(checkNashornCompatibility(`${name}("x");`)).toEqual([
			{ kind: 'serverOnly', name, line: 1, column: 0 },
		]);
	});

	it('does not flag a property that shares a server-only name', () => {
		expect(checkNashornCompatibility('RESULT_VAR = VAR_0.load + VAR_0.java;')).toEqual([]);
	});

	it('points console.log to print()', () => {
		expect(checkNashornCompatibility('console.log(VAR_0);')).toEqual([
			{ kind: 'console', line: 1, column: 0 },
		]);
	});

	it('accepts a valid ES5 script', () => {
		expect(checkNashornCompatibility('RESULT_VAR = VAR_1.items.length + 1;')).toEqual([]);
	});

	it('leaves code that does not parse to the backend syntax check', () => {
		expect(checkNashornCompatibility('var = ; arr.find(x);')).toEqual([]);
	});
});
