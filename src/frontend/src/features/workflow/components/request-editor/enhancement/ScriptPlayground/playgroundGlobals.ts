import type { GlobalVariable, JsonValue, ScriptParameter } from '@entities/globalVariable/model/types';
import { parseGlobalReference } from '@entities/globalVariable/lib/globalReference';
import { emptyInput, type InputValue } from './playgroundInputs';
import { resolveGlobalPath } from './playgroundScriptCalls';

// What the playground needs of a global variable an arg or a ref() points at: a value it can
// stand in for, or the script it defines as a function. A run resolves these on the backend; the
// playground only has the stored definitions.
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

export const globalOfReference = (reference: string, globals: PlaygroundGlobal[]): PlaygroundGlobal | undefined => {
	const parsed = parseGlobalReference(reference);
	return parsed ? globals.find((candidate) => candidate.name === parsed.name) : undefined;
};

// The prefilled input of a reference: the current value at its path for a global, nothing for a
// secret or a method reference, which has no value outside a run.
export function initialReferenceInput(reference: string, globals: PlaygroundGlobal[]): InputValue {
	const parsed = parseGlobalReference(reference);
	const global = globalOfReference(reference, globals);
	if (!parsed || global?.kind !== 'value' || global.isSecret) return emptyInput;
	return { mode: 'json', text: JSON.stringify(resolveGlobalPath(global.value, parsed.path), null, 2) };
}

/**
 * A script variable as a JavaScript function declaration under the arg's name, the way a run binds
 * it: its parameters in order, an optional one left out (or undefined) takes its default. Appended
 * after the code, so the line numbers of the user's own code stay right; a declaration is hoisted.
 */
export function scriptFunctionSource(name: string, global: Extract<PlaygroundGlobal, { kind: 'script' }>): string {
	const defaults = global.parameters
		.filter((parameter) => !parameter.required)
		.map((parameter) => `if (${parameter.name} === undefined) ${parameter.name} = ${JSON.stringify(parameter.default ?? null)};`);
	const body = [...defaults, global.code].join('\n');
	return `function ${name}(${global.parameters.map((parameter) => parameter.name).join(', ')}) {\n${body}\n}`;
}

export type ScriptArg = { name: string; global: Extract<PlaygroundGlobal, { kind: 'script' }> };

export const withScriptArgs = (script: string, scriptArgs: ScriptArg[]): string =>
	scriptArgs.length > 0
		? `${script}\n${scriptArgs.map(({ name, global }) => scriptFunctionSource(name, global)).join('\n')}`
		: script;
