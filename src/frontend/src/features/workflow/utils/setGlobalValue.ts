import { isGlobalReference } from '@entities/globalVariable/lib/globalReference';
import { valueToText } from '@entities/globalVariable/model/form';
import type { JsonValue } from '@entities/globalVariable/model/types';

const METHOD_REFERENCE_RE = /^\{?%?\s*#?[A-Fa-f0-9]{6}\.\((?:request|response)\)\./;
const WEBHOOK_RE = /^\$\{[^{}]+\}$/;

/** A Set step value that names where the value comes from, rather than spelling it. */
export const isSetGlobalReference = (value: string) => {
	const trimmed = value.trim();
	return METHOD_REFERENCE_RE.test(trimmed) || WEBHOOK_RE.test(trimmed) || isGlobalReference(trimmed);
};

/** The editor's text for a saved value: references as they are, literals as JSON text. */
export const setGlobalValueToText = (value: unknown): string =>
	typeof value === 'string' && isSetGlobalReference(value) ? value : valueToText((value ?? null) as JsonValue);
