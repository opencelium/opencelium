import type { SandboxRequest } from './sandbox.types';

export type ParityCase = SandboxRequest & { id: string; backendInput?: string };
export const nashornParityCases: ParityCase[] = [
	{ id: 'integer', args: { VAR_1: 42 }, script: 'RESULT_VAR = VAR_1 + 1;' },
	{
		id: 'double',
		args: { VAR_1: 1.5 },
		script: 'RESULT_VAR = VAR_1 * 2;',
		backendInput: 'Java Double',
	},
	{
		id: 'long-typeof',
		args: { VAR_1: 42 },
		script: 'RESULT_VAR = typeof VAR_1;',
		backendInput: 'Java Long',
	},
	{
		id: 'string',
		args: { VAR_1: 'hello' },
		script: 'RESULT_VAR = VAR_1.toUpperCase();',
	},
	{ id: 'boolean', args: { VAR_1: true }, script: 'RESULT_VAR = !VAR_1;' },
	{ id: 'null', args: {}, script: 'RESULT_VAR = null;' },
	{
		id: 'items-length',
		args: { VAR_1: { items: [1, 2, 3] } },
		script: 'RESULT_VAR = VAR_1.items.length;',
	},
	{ id: 'map', args: {}, script: 'RESULT_VAR = { a: 1 };' },
	{ id: 'list', args: {}, script: 'RESULT_VAR = [1, 2];' },
	{
		id: 'object-function',
		args: {},
		script: 'RESULT_VAR = { a: 1, f: function() {} };',
	},
	{ id: 'array-undefined', args: {}, script: 'RESULT_VAR = [1, undefined];' },
	{ id: 'last-expression', args: {}, script: 'RESULT_VAR = 9; 1 + 2;' },
	{
		id: 'xml-attribute',
		args: { VAR_1: { '__oc__attributes.id': '5', __oc__value: 'x' } },
		script: 'RESULT_VAR = VAR_1;',
	},
	{
		id: 'xml-text-replacement',
		args: {
			VAR_1: { 'field.__oc__value': 'text.__oc__value __oc__attributes.id' },
		},
		script: 'RESULT_VAR = VAR_1;',
	},
	{
		id: 'missing-reference',
		args: { VAR_1: '' },
		script: 'RESULT_VAR = [typeof VAR_1, VAR_1.length];',
		backendInput: 'Reference that produced no data',
	},
	{
		id: 'es5-map',
		args: { VAR_1: [1, 2] },
		script: 'RESULT_VAR = VAR_1.map(function(x) { return x * 2; });',
	},
	{ id: 'print', args: {}, script: 'print("hello"); RESULT_VAR = 1;' },
	{ id: 'arrow', args: {}, script: 'var f = x => x * 2; RESULT_VAR = f(2);' },
	{ id: 'let', args: {}, script: 'let x = 1; RESULT_VAR = x;' },
	{ id: 'const-confirm', args: {}, script: 'const x = 1; RESULT_VAR = x;' },
	{ id: 'template', args: { VAR_1: 'x' }, script: 'RESULT_VAR = `a${VAR_1}`;' },
	{ id: 'class', args: {}, script: 'class A {} RESULT_VAR = 1;' },
	{
		id: 'find',
		args: {},
		script: 'RESULT_VAR = [1, 2].find(function(x) { return x === 2; });',
	},
	{
		id: 'assign',
		args: {},
		script: 'RESULT_VAR = Object.assign({}, { a: 1 });',
	},
	{ id: 'includes', args: {}, script: 'RESULT_VAR = "hello".includes("he");' },
];
