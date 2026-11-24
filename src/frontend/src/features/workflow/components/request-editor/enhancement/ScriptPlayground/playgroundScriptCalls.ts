import { isGlobalReference, parseGlobalReference } from '@entities/globalVariable/lib/globalReference';
import type { JsonValue } from '@entities/globalVariable/model/types';
import type { ScriptRunResult } from '@features/workflow/script-sandbox/sandbox.types';
import { parseReference } from '../../body-editor/bodyReference';

// A run binds each ref("...") call itself (backend ReferenceScanner.SCRIPT_REF) and provides set();
// the sandbox does neither, so the playground supplies both as functions appended to the code.
const REF_CALL = /(?<![\w$.])ref\s*\(\s*(["'])((?:(?!\1).)*)\1\s*\)/g;
const SET_CALL = /(?<![\w$.])set\s*\(/;
const SET_MARKER = '\u001eOC_SET\u001e';

export type ScriptRef = { name: string; reference: string };
export type GlobalWrite = { target: string; value: string };

const isReference = (text: string) => isGlobalReference(text) || parseReference(text) !== null;

// Named after the reference, not its position, so a saved test value stays with its reference
// when the code changes.
const refVariableName = (reference: string) => {
	let hash = 5381;
	for (let index = 0; index < reference.length; index += 1) {
		hash = ((hash * 33) ^ reference.charCodeAt(index)) >>> 0;
	}
	return `OC_REF_${hash.toString(36)}`;
};

export function findScriptRefs(script: string): ScriptRef[] {
	const references = Array.from(script.matchAll(REF_CALL), (match) => match[2].trim()).filter(isReference);
	return Array.from(new Set(references), (reference) => ({ name: refVariableName(reference), reference }));
}

export const refGlobalNames = (refs: ScriptRef[]): string[] =>
	Array.from(new Set(refs.flatMap((ref) => {
		const parsed = parseGlobalReference(ref.reference);
		return parsed ? [parsed.name] : [];
	})));

const refFunctionSource = (refs: ScriptRef[], missingMessage: string) => [
	'function ref(reference) {',
	...refs.map((ref) => `if (reference === ${JSON.stringify(ref.reference)}) return ${ref.name};`),
	`throw new Error(${JSON.stringify(missingMessage)} + reference);`,
	'}',
].join('\n');

// Only a mutable variable can be written, named by its whole reference without a path (backend
// GlobalVariableWriter). Any other target fails the run, and a failed enhancement writes nothing.
const setFunctionSource = (mutableNames: string[], notWritableMessage: string) => [
	'function set(target, value) {',
	`var writable = ${JSON.stringify(mutableNames.map((name) => `{{global.${name}}}`))};`,
	`if (writable.indexOf(target) < 0) throw new Error(${JSON.stringify(notWritableMessage)} + target);`,
	'var text; try { text = JSON.stringify(value); } catch (error) {}',
	`print(${JSON.stringify(SET_MARKER)} + target + ${JSON.stringify(SET_MARKER)} + (text === undefined ? String(value) : text));`,
	'}',
].join('\n');

export type ScriptCallOptions = {
	refs: ScriptRef[];
	mutableNames: string[];
	messages: { refWithoutValue: string; setNotMutable: string };
};

/** Appended after the code so its line numbers stay right; function declarations are hoisted. */
export function withScriptCalls(script: string, { refs, mutableNames, messages }: ScriptCallOptions): string {
	const functions = [
		...(refs.length > 0 ? [refFunctionSource(refs, messages.refWithoutValue)] : []),
		...(SET_CALL.test(script) ? [setFunctionSource(mutableNames, messages.setNotMutable)] : []),
	];
	return functions.length > 0 ? `${script}\n${functions.join('\n')}` : script;
}

/** Takes the writes recorded by the set() stand-in out of the printed output. */
export function splitGlobalWrites(output: string): { output: string; writes: GlobalWrite[] } {
	const writes: GlobalWrite[] = [];
	const lines = output.split('\n').filter((line) => {
		if (!line.startsWith(SET_MARKER)) return true;
		const [target = '', value = ''] = line.slice(SET_MARKER.length).split(SET_MARKER);
		writes.push({ target, value });
		return false;
	});
	return { output: lines.join('\n'), writes };
}

export function splitRunWrites(result: ScriptRunResult | null): { result: ScriptRunResult | null; writes: GlobalWrite[] } {
	if (!result || result.kind === 'rejected') return { result, writes: [] };
	const { output, writes } = splitGlobalWrites(result.output);
	return { result: { ...result, output }, writes };
}

/** The part of a global's value a reference with a path (`.a.b[0]`) points at, null when it leads nowhere. */
export function resolveGlobalPath(value: JsonValue, path: string): JsonValue {
	const steps = Array.from(path.matchAll(/\.([A-Za-z0-9_-]+)|\[(\d+)\]/g), (match) => match[1] ?? Number(match[2]));
	return steps.reduce<JsonValue>((current, step) => {
		if (typeof step === 'number') return Array.isArray(current) ? current[step] ?? null : null;
		return current && typeof current === 'object' && !Array.isArray(current) ? current[step] ?? null : null;
	}, value);
}
