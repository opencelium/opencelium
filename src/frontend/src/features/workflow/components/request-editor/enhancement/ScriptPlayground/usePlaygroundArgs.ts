import type { Enhancement } from '@features/workflow/types/connection';
import { emptyInput, parseInput, type InputValue, type InputValues } from './playgroundInputs';
import { initialGlobalInput, type PlaygroundGlobal } from './playgroundGlobals';

export type GlobalInputRow = { name: string; input: InputValue };

/** The variables a playground run sends: the enhancement's VAR_n args and the imported global values. */
export function usePlaygroundArgs(enhancement: Enhancement, inputs: InputValues, globals: PlaygroundGlobal[]) {
	const names = Object.keys(enhancement.args).filter((name) => /^VAR_\d+$/.test(name));
	const globalRows: GlobalInputRow[] = globals.flatMap((global) => (global.kind === 'value'
		? [{ name: global.name, input: inputs[global.name] ?? initialGlobalInput(global) }]
		: []));
	const args: Record<string, unknown> = {};
	const invalid: string[] = [];
	const add = (name: string, input: InputValue) => {
		try {
			args[name] = parseInput(input);
		} catch {
			invalid.push(name);
		}
	};
	names.forEach((name) => add(name, inputs[name] ?? emptyInput));
	globalRows.forEach((row) => add(row.name, row.input));
	const unavailable = globals.flatMap((global) => (global.kind === 'unavailable' ? [global.name] : []));
	return { names, globalRows, args, invalid, unavailable };
}
