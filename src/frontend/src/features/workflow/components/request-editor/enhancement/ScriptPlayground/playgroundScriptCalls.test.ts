import { describe, expect, it } from 'vitest';
import { initialReferenceInput, type PlaygroundGlobal } from './playgroundGlobals';
import { findScriptRefs, refGlobalNames, resolveGlobalPath, splitGlobalWrites, withScriptCalls } from './playgroundScriptCalls';

// Runs code the way the sandbox would: the bound variables as globals, print() into the output.
const runInSandbox = (code: string, variables: Record<string, unknown>) => {
	const output: string[] = [];
	const names = Object.keys(variables);
	const run = new Function('print', ...names, `var RESULT_VAR;\n${code}\nreturn RESULT_VAR;`);
	const result: unknown = run((line: string) => output.push(line), ...names.map((name) => variables[name]));
	return { result, output: output.join('\n') };
};

const messages = { refWithoutValue: 'no value: ', setNotMutable: 'not mutable: ' };

describe('ref() and set() in the playground', () => {
	it('finds each referenced value once, ignoring member calls and non-references', () => {
		const refs = findScriptRefs(
			'var a = ref("{{global.limits.max}}"); var b = ref(\'{{global.limits.max}}\');'
			+ ' obj.ref("{{global.x}}"); ref("plain"); var c = ref("#1a2b3c.(response).body.$.id");');
		expect(refs.map((ref) => ref.reference)).toEqual(['{{global.limits.max}}', '#1a2b3c.(response).body.$.id']);
		expect(refGlobalNames(refs)).toEqual(['limits']);
	});

	it('names a ref value after its reference, so a saved input survives edits', () => {
		const [first] = findScriptRefs('ref("{{global.a}}")');
		const [same] = findScriptRefs('var x = 1;\nref("{{global.b}}"); ref("{{global.a}}")').filter(
			(ref) => ref.reference === '{{global.a}}');
		expect(first.name).toBe(same.name);
		expect(first.name).toMatch(/^OC_REF_[0-9a-z]+$/);
	});

	it('runs ref() and records set() without changing the code above them', () => {
		const script = 'var max = ref("{{global.limits.max}}");\nset("{{global.lastSync}}", { at: max + 1 });\nRESULT_VAR = max;';
		const refs = findScriptRefs(script);
		const code = withScriptCalls(script, { refs, mutableNames: ['lastSync'], messages });
		expect(code.startsWith(script)).toBe(true);
		const { result, output } = runInSandbox(code, { [refs[0].name]: 41 });
		expect(result).toBe(41);
		expect(splitGlobalWrites(`before\n${output}\nafter`)).toEqual({
			output: 'before\nafter',
			writes: [{ target: '{{global.lastSync}}', value: '{"at":42}' }],
		});
	});

	it('leaves code without ref() or set() untouched', () => {
		expect(withScriptCalls('RESULT_VAR = VAR_0;', { refs: [], mutableNames: [], messages })).toBe('RESULT_VAR = VAR_0;');
	});

	it('lets set() write only a mutable variable, named by its whole reference', () => {
		const run = (target: string) => runInSandbox(
			withScriptCalls(`set(${JSON.stringify(target)}, 1); RESULT_VAR = 'done';`, { refs: [], mutableNames: ['lastSync'], messages }), {});
		expect(run('{{global.lastSync}}').result).toBe('done');
		expect(() => run('{{global.baseUrl}}')).toThrow('not mutable: {{global.baseUrl}}');
		expect(() => run('{{global.lastSync.at}}')).toThrow('not mutable: {{global.lastSync.at}}');
		expect(() => run('global.lastSync')).toThrow('not mutable: global.lastSync');
	});

	it('prefills a global ref with the value at its path, and a secret or method ref with nothing', () => {
		const globals: PlaygroundGlobal[] = [
			{ kind: 'value', name: 'limits', value: { pages: [{ size: 50 }] }, isSecret: false },
			{ kind: 'value', name: 'apiKey', value: null, isSecret: true },
		];
		const [limits, secret, method] = findScriptRefs(
			'ref("{{global.limits.pages[0].size}}"); ref("{{global.apiKey}}"); ref("#1a2b3c.(response).body.$.id");');
		expect(initialReferenceInput(limits.reference, globals)).toEqual({ mode: 'json', text: '50' });
		expect(initialReferenceInput(secret.reference, globals).text).toBe('');
		expect(initialReferenceInput(method.reference, globals).text).toBe('');
		expect(resolveGlobalPath({ a: [1] }, '.a[3]')).toBeNull();
	});
});
