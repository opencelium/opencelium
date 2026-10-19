import { describe, expect, it } from 'vitest';
import { nashornParityCases } from './nashornParity.cases';
import { execute } from './sandbox.worker.testSupport';

type ServerResult =
	| { kind: 'value'; value: unknown }
	| { kind: 'error'; message: string; line: number; column?: number };

// Recorded 2026-10-19 by running every case through a real backend (Nashorn 15.4,
// default ES5.1 mode) with nashornServer.test.ts. Re-record with that suite when the
// engine or NashornEngine.java changes.
//
// Confirmed server behaviour:
// a. ES5 mode rejects `const` ("Expected an operand but found const").
// b. A top-level Java Long argument is a java.lang.Long object: `typeof` is 'object'.
const serverResults: Record<string, ServerResult> = {
	integer: { kind: 'value', value: 43 },
	double: { kind: 'value', value: 3 },
	'long-typeof': { kind: 'value', value: 'object' },
	string: { kind: 'value', value: 'HELLO' },
	boolean: { kind: 'value', value: false },
	null: { kind: 'value', value: null },
	'items-length': { kind: 'value', value: 3 },
	map: { kind: 'value', value: { a: 1 } },
	list: { kind: 'value', value: [1, 2] },
	'object-function': { kind: 'value', value: { a: 1 } },
	'array-undefined': { kind: 'value', value: [1, null] },
	'last-expression': { kind: 'value', value: 3 },
	'xml-attribute': { kind: 'value', value: { '@id': '5', __oc__value: 'x' } },
	'xml-text-replacement': { kind: 'value', value: { field: 'text @id' } },
	'missing-reference': { kind: 'value', value: ['string', 0] },
	'es5-map': { kind: 'value', value: [2, 4] },
	print: { kind: 'value', value: 1 },
	arrow: { kind: 'error', message: 'Expected ; but found =>', line: 1, column: 10 },
	let: { kind: 'error', message: 'Expected ; but found x', line: 1, column: 4 },
	'const-confirm': {
		kind: 'error',
		message: 'Expected an operand but found const',
		line: 1,
		column: 0,
	},
	template: { kind: 'error', message: 'Expected an operand but found error', line: 1, column: 13 },
	class: { kind: 'error', message: 'Expected an operand but found class', line: 1, column: 0 },
	find: { kind: 'error', message: 'TypeError: [1, 2].find is not a function', line: 1 },
	assign: { kind: 'error', message: 'TypeError: Object.assign is not a function', line: 1 },
	includes: { kind: 'error', message: 'TypeError: "hello".includes is not a function', line: 1 },
};

// Differences we accept instead of simulating. They are asserted below, so a change on
// either side shows up as a failing test instead of a silent drift.
const knownValueDifferences: Record<string, unknown> = {
	// JSON input has no Long type, so the browser receives a plain JS number.
	'long-typeof': 'number',
};
const knownColumnDifferences: Record<string, number> = {
	// acorn in ES5 mode reads `=>` as `=` and reports the unexpected `>` one column later.
	arrow: 11,
};

describe('sandbox parity with recorded Nashorn results', () => {
	it('records a server result for every parity case', () => {
		expect(Object.keys(serverResults).sort()).toEqual(
			nashornParityCases.map((parityCase) => parityCase.id).sort(),
		);
	});

	it.each(nashornParityCases)('$id', (parityCase) => {
		const server = serverResults[parityCase.id];
		const browser = execute(parityCase);

		if (server.kind === 'value') {
			const expected =
				parityCase.id in knownValueDifferences
					? knownValueDifferences[parityCase.id]
					: server.value;
			expect(browser).toMatchObject({ kind: 'value', value: expected });
			return;
		}
		expect(browser).toMatchObject({ kind: 'error', line: server.line });
		if (server.column !== undefined) {
			expect(browser).toMatchObject({
				column: knownColumnDifferences[parityCase.id] ?? server.column,
			});
		}
	});
});
