import type { NotificationFact, NotificationMessageValues } from '../model/notification.types';

export const textValue = (values: NotificationMessageValues, key: string): string => {
	const value = values[key];
	return typeof value === 'string' ? value : '';
};

export const flagValue = (values: NotificationMessageValues, key: string): boolean => values[key] === true;

export const factsValue = (values: NotificationMessageValues, key = 'facts'): NotificationFact[] => {
	const value = values[key];
	return Array.isArray(value) ? value : [];
};

export const filledFacts = (values: NotificationMessageValues, key = 'facts') =>
	factsValue(values, key).filter((fact) => fact.label || fact.value);

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
