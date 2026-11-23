import type { GlobalVariable, JsonValue, ScriptParameter } from '@entities/globalVariable/model/types';
import type { InputValue } from './playgroundInputs';

// What the playground needs of an imported global variable: a value it can stand in for, or the
// script it defines as a function. A run resolves these on the backend; the playground only has
// the stored definitions.
export type PlaygroundGlobal =
	| { kind: 'value'; name: string; value: JsonValue; isSecret: boolean }
	| { kind: 'script'; name: string; code: string; parameters: ScriptParameter[] }
	| { kind: 'unavailable'; name: string };

export function toPlaygroundGlobal(name: string, variable: GlobalVariable | null): PlaygroundGlobal {
	if (!variable) return { kind: 'unavailable', name };
	switch (variable.kind) {
		case 'CONSTANT':
			return { kind: 'value', name, value: variable.secret ? null : variable.value, isSecret: variable.secret };
		case 'MUTABLE':
			return { kind: 'value', name, value: variable.mutable.currentValue, isSecret: false };
		case 'SCRIPT':
			return { kind: 'script', name, code: variable.script.code, parameters: variable.script.parameters };
		default: {
			const _exhaustive: never = variable;
			return _exhaustive;
		}
	}
}

// The prefilled input of a value import: its current value as JSON, or nothing for a secret.
export const initialGlobalInput = (global: Extract<PlaygroundGlobal, { kind: 'value' }>): InputValue =>
	global.isSecret ? { mode: 'json', text: '' } : { mode: 'json', text: JSON.stringify(global.value, null, 2) };

/**
 * A script import as a JavaScript function declaration, the way a run imports it: its parameters
 * in order, an optional one left out (or undefined) takes its default. Appended after the code, so
 * the line numbers of the user's own code stay right; a declaration is hoisted, so calls before it work.
 */
export function scriptFunctionSource(global: Extract<PlaygroundGlobal, { kind: 'script' }>): string {
	const defaults = global.parameters
		.filter((parameter) => !parameter.required)
		.map((parameter) => `if (${parameter.name} === undefined) ${parameter.name} = ${JSON.stringify(parameter.default ?? null)};`);
	const body = [...defaults, global.code].join('\n');
	return `function ${global.name}(${global.parameters.map((parameter) => parameter.name).join(', ')}) {\n${body}\n}`;
}

export const withScriptImports = (script: string, globals: PlaygroundGlobal[]): string => {
	const functions = globals.flatMap((global) => (global.kind === 'script' ? [scriptFunctionSource(global)] : []));
	return functions.length > 0 ? `${script}\n${functions.join('\n')}` : script;
};
