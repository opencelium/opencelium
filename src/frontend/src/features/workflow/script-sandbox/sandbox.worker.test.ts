import { describe, expect, it } from 'vitest';
import { execute } from './sandbox.worker.testSupport';

const run = (script: string, args: Record<string, unknown> = {}) => execute({ script, args });

describe('sandbox worker', () => {
	it('returns RESULT_VAR with the server type', () => {
		expect(run('RESULT_VAR = VAR_1.items.length;', { VAR_1: { items: [1, 2, 3] } })).toEqual({
			kind: 'value',
			value: 3,
			serverType: 'Number',
			console: [],
		});
	});

	it('exposes XML attributes under @-keys inside the script', () => {
		expect(
			run('RESULT_VAR = VAR_1["@id"];', {
				VAR_1: { '__oc__attributes.id': '5', __oc__value: 'x' },
			}),
		).toMatchObject({ kind: 'value', value: '5', serverType: 'String' });
	});

	it('returns the value of the last statement even without RESULT_VAR', () => {
		expect(run('var a = 2; a * 21;')).toMatchObject({ kind: 'value', value: 42 });
	});

	it('converts object and array results like the server', () => {
		expect(run('RESULT_VAR = { a: 1, f: function () {} };')).toMatchObject({
			value: { a: 1 },
			serverType: 'Map',
		});
		expect(run('RESULT_VAR = [1, undefined];')).toMatchObject({
			value: [1, null],
			serverType: 'List',
		});
	});

	it('fails ES2015+ built-ins with the server-engine message at the script position', () => {
		expect(run('var x = 1;\nRESULT_VAR = [1, 2].find(function (x) { return x; });')).toMatchObject({
			kind: 'error',
			message: 'find is not available on the server engine (Nashorn ES5.1)',
			line: 2,
		});
	});

	it('removes network and worker APIs before running the script', () => {
		const stub = () => 'reachable';
		const result = execute(
			{
				script:
					'RESULT_VAR = [typeof fetch, typeof importScripts, typeof XMLHttpRequest, typeof WebSocket];',
				args: {},
			},
			1000,
			false,
			{ fetch: stub, importScripts: stub, XMLHttpRequest: stub, WebSocket: stub },
		);

		expect(result).toMatchObject({
			kind: 'value',
			value: ['undefined', 'undefined', 'undefined', 'undefined'],
		});
	});

	it('captures print and console.log output', () => {
		expect(run('print("a", 1); console.log("b"); RESULT_VAR = 1;')).toMatchObject({
			kind: 'value',
			console: ['a 1', 'b'],
		});
	});

	it('marks Java.* as a server-only failure', () => {
		expect(run('Java.type("java.util.UUID");')).toMatchObject({
			kind: 'error',
			message: 'serverOnly:Java.type',
		});
	});

	it('refuses to run code that does not parse as ES5', () => {
		expect(run('var f = x => x;')).toMatchObject({ kind: 'error', message: 'syntax', line: 1 });
	});

	it('reports a blocked eval as a CSP failure', () => {
		expect(execute({ script: 'RESULT_VAR = 1;', args: {} }, 1000, true)).toMatchObject({
			kind: 'error',
			message: 'csp',
		});
	});

	it('rejects argument names other than VAR_n', () => {
		expect(run('1;', { fetch: 'x' })).toMatchObject({ kind: 'error', message: 'invalidArgument' });
	});
});
