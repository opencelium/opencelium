import { describe, expect, it } from 'vitest';
import { checkNashornCompatibility } from './checkNashornCompatibility';

const prefix = 'var ok = 1;\n';

describe('checkNashornCompatibility', () => {
	it.each([
		['arrow function', 'var f = x => x * 2;', 'arrowSyntax', 11],
		['template literal', 'var s = `a${b}`;', 'templateSyntax', 8],
		['let', 'let a = 1;', 'declarationSyntax', 4],
		['const', 'const a = 1;', 'declarationSyntax', 0],
		['class', 'class A {}', 'classSyntax', 0],
		['destructuring', 'var o = {};\nvar { a } = o;', 'destructuringSyntax', 4],
		['spread', 'f(...xs);', 'spreadSyntax', 2],
		['regex u flag', 'var r = /a/u;', 'regexSyntax', 8],
		['regex y flag', 'var r = /a/y;', 'regexSyntax', 8],
		['regex s flag', 'var r = /a/s;', 'regexSyntax', 8],
	])('reports %s as a syntax issue at its position', (_, script, message, column) => {
		const issues = checkNashornCompatibility(prefix + script);
		const lastLine = (prefix + script).split('\n').length;

		expect(issues).toHaveLength(1);
		expect(issues[0]).toMatchObject({ kind: 'syntax', message, line: lastLine });
		expect(issues[0].column).toBeGreaterThanOrEqual(column);
		expect(issues[0].column).toBeLessThanOrEqual(column + 1);
	});

	it.each([
		['arr.find(function (x) { return x; });', 'arr.find'],
		['Object.assign({}, a);', 'Object.assign'],
		['str.includes("x");', 'str.includes'],
	])('warns about the ES2015+ built-in in %s', (script, message) => {
		expect(checkNashornCompatibility(script)).toEqual([
			{ kind: 'unsupportedBuiltin', message, line: 1, column: 0 },
		]);
	});

	it('flags Java.type as server-only', () => {
		expect(checkNashornCompatibility("var U = Java.type('java.util.UUID');")).toEqual([
			{ kind: 'serverOnly', message: 'Java.type', line: 1, column: 8 },
		]);
	});

	it('flags load() as server-only', () => {
		expect(checkNashornCompatibility('load("lib.js");')).toEqual([
			{ kind: 'serverOnly', message: 'load', line: 1, column: 0 },
		]);
	});

	it.each(['var d = new Date();', 'var t = Date.now();'])('warns about time zones in %s', (script) => {
		expect(checkNashornCompatibility(script)).toEqual([
			expect.objectContaining({ kind: 'timezone', line: 1 }),
		]);
	});

	it('accepts a valid ES5 script', () => {
		expect(checkNashornCompatibility('RESULT_VAR = VAR_1.items.length + 1;')).toEqual([]);
	});

	it.each([
		['for each loop', 'for each (var x in a) print(x);'],
		['closure without braces', 'var f = function (x) x * x;'],
	])('labels a Nashorn-only %s as unverifiable instead of invalid', (_, script) => {
		expect(checkNashornCompatibility(script)).toEqual([
			expect.objectContaining({ kind: 'serverOnly', message: 'nashornSyntax' }),
		]);
	});

	it('falls back to a generic syntax issue for ES5-invalid code it cannot classify', () => {
		expect(checkNashornCompatibility('var = ;')).toEqual([
			expect.objectContaining({ kind: 'syntax', message: 'syntax', line: 1 }),
		]);
	});
});
