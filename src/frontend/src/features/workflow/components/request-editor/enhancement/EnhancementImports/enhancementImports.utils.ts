import type { PickerItem } from '@entities/globalVariable/model/types';
import type { Language } from '../../../../types/connection';

// Script variables run in their own language only; constants and mutable values work in any (FR-43).
export const isImportable = (item: PickerItem, language: Language) =>
	item.kind !== 'SCRIPT' || item.language === language;

export type ImportCall = { text: string; selection?: { start: number; end: number } };

/**
 * The code that uses an import: a value by its name, a script as a call. A call passes the
 * transformation's own args (VAR_0, VAR_1, …) to the required parameters as placeholders, and
 * selects the first so typing replaces it; optional parameters are left out and take their default.
 */
export function callOf(item: PickerItem, argNames: string[]): ImportCall {
	if (item.kind !== 'SCRIPT') return { text: item.name };
	const required = item.parameters.filter((parameter) => parameter.required);
	const placeholders = required.map((_parameter, index) => argNames[index] ?? 'null');
	const text = `${item.name}(${placeholders.join(', ')})`;
	const start = item.name.length + 1;
	return placeholders.length > 0
		? { text, selection: { start, end: start + placeholders[0].length } }
		: { text, selection: { start, end: start } };
}

// The enhancement's own args, VAR_0, VAR_1, … in order: what a call can pass on.
export const argNamesOf = (args: Record<string, string>) => Object.keys(args)
	.filter((name) => /^VAR_\d+$/.test(name))
	.sort((left, right) => Number(left.slice(4)) - Number(right.slice(4)));

type Translate = (key: string, options?: Record<string, unknown>) => string;

// A script's parameters in call order, one line each, with the optional ones and their defaults marked.
export const parameterNotes = (item: PickerItem, t: Translate) => (item.kind === 'SCRIPT'
	? item.parameters.map((parameter, index) => {
		const name = parameter.required
			? t('enhancement.imports.requiredParameter', { name: parameter.name })
			: t('enhancement.imports.optionalParameter', { name: parameter.name, value: JSON.stringify(parameter.default ?? null) });
		return `${index + 1}. ${parameter.description ? `${name}: ${parameter.description}` : name}`;
	})
	: []);
