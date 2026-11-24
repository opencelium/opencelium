import type { NotificationFact, NotificationMessageValues } from '../model/notification.types';

/**
 * Trimmed: the field editor leaves a spacer after an inserted reference chip, and a
 * stray space at either end of a URL or a heading only ever breaks it.
 */
export const textValue = (values: NotificationMessageValues, key: string): string => {
	const value = values[key];
	return typeof value === 'string' ? value.trim() : '';
};

export const flagValue = (values: NotificationMessageValues, key: string): boolean => values[key] === true;

export const factsValue = (values: NotificationMessageValues, key = 'facts'): NotificationFact[] => {
	const value = values[key];
	return Array.isArray(value) ? value : [];
};

export const filledFacts = (values: NotificationMessageValues, key = 'facts') => factsValue(values, key)
	.map((fact) => ({ ...fact, label: fact.label.trim(), value: fact.value.trim() }))
	.filter((fact) => fact.label || fact.value);

export const isRecord = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);

export const readRecord = (value: unknown, key: string): Record<string, unknown> => {
	if (!isRecord(value)) return {};
	const nested = value[key];
	return isRecord(nested) ? nested : {};
};

export const readArray = (value: unknown, key: string): unknown[] => {
	if (!isRecord(value)) return [];
	const nested = value[key];
	return Array.isArray(nested) ? nested : [];
};

export const readString = (value: unknown, key: string): string => {
	if (!isRecord(value)) return '';
	const nested = value[key];
	return typeof nested === 'string' ? nested : nested == null ? '' : String(nested);
};
