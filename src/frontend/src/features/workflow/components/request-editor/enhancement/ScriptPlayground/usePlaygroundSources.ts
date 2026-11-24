import { parseGlobalReference } from '@entities/globalVariable/lib/globalReference';
import { useGlobalVariablePicker } from '@entities/globalVariable/ui/picker/globalPicker';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { Enhancement } from '@features/workflow/types/connection';
import { parseInput, type InputValue, type InputValues } from './playgroundInputs';
import { globalOfReference, initialReferenceInput, withScriptArgs, type ScriptArg } from './playgroundGlobals';
import { findScriptRefs, withScriptCalls } from './playgroundScriptCalls';
import { usePlaygroundGlobals } from './usePlaygroundGlobals';

export type PlaygroundInputRow = { name: string; reference: string; input: InputValue };

const VAR_NAME = /^VAR_\d+$/;

/**
 * Everything a playground run is built from. A VAR_n arg that points at a global starts from the
 * variable's current value, or becomes a function when it is a script variable; each ref("...")
 * call gets an input of its own.
 */
export function usePlaygroundSources(enhancement: Enhancement, script: string, inputs: InputValues) {
	const { t } = useI18n('workflow');
	const varNames = Object.keys(enhancement.args)
		.filter((name) => VAR_NAME.test(name))
		.sort((left, right) => Number(left.slice(4)) - Number(right.slice(4)));
	const refs = findScriptRefs(script);
	const references = [...varNames.map((name) => enhancement.args[name]), ...refs.map((ref) => ref.reference)];
	const globalNames = Array.from(new Set(references.flatMap((reference) => {
		const parsed = parseGlobalReference(reference);
		return parsed ? [parsed.name] : [];
	})));
	const { globals, isLoading } = usePlaygroundGlobals(globalNames);
	const { items: pickerItems, isLoading: isLoadingPicker } = useGlobalVariablePicker();
	const mutableNames = pickerItems.flatMap((item) => (item.kind === 'MUTABLE' ? [item.name] : []));

	const scriptArgs: ScriptArg[] = varNames.flatMap((name) => {
		const global = globalOfReference(enhancement.args[name], globals);
		return global?.kind === 'script' ? [{ name, global }] : [];
	});
	const toRow = (name: string, reference: string): PlaygroundInputRow =>
		({ name, reference, input: inputs[name] ?? initialReferenceInput(reference, globals) });
	const varRows = varNames
		.filter((name) => !scriptArgs.some((arg) => arg.name === name))
		.map((name) => toRow(name, enhancement.args[name]));
	const refRows = refs.map((ref) => toRow(ref.name, ref.reference));

	const args: Record<string, unknown> = {};
	const invalid: string[] = [];
	[...varRows, ...refRows].forEach((row) => {
		try {
			args[row.name] = parseInput(row.input);
		} catch {
			invalid.push(row.name);
		}
	});
	return {
		varRows,
		refRows,
		scriptArgs,
		args,
		invalid,
		unavailable: globals.flatMap((global) => (global.kind === 'unavailable' ? [global.name] : [])),
		runScript: withScriptCalls(withScriptArgs(script, scriptArgs), {
			refs,
			mutableNames,
			messages: { refWithoutValue: t('sandbox.refWithoutValue'), setNotMutable: t('sandbox.setNotMutable', { example: '{{global.lastSync}}' }) },
		}),
		isLoading: isLoading || isLoadingPicker,
	};
}
