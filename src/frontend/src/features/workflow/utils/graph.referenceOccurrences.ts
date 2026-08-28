import type { ParsedArg } from '../components/request-editor/utils/parseEnhancementArg';
import { parseEnhancementArg } from '../components/request-editor/utils/parseEnhancementArg';

/* The two wrappers a stored reference can arrive in: an operator condition
   keeps its references inside `{%…%}`, and a field value holds either one
   reference or a `;`-separated list of them. Everything else is a whole value.
   Kept in step with graph.referenceRemap, which takes the same three apart. */
const CONDITION_TOKEN_RE = /\{%(#?[A-Fa-f0-9]{6}\.\((?:request|response)\)\.[^%]*)%\}/g;

const parseAll = (value: string): ParsedArg[] => {
	const conditions = [...value.matchAll(CONDITION_TOKEN_RE)]
		.map(([, inner]) => parseEnhancementArg(inner.startsWith('#') ? inner : `#${inner}`));
	const parts = value.replace(CONDITION_TOKEN_RE, '').split(';')
		.map((part) => parseEnhancementArg(part.trim()));
	return [...conditions, ...parts].filter((parsed): parsed is ParsedArg => !!parsed);
};

/**
 * Every reference inside a value, taken apart — colour, direction, message
 * property and field path — rather than only its colour, which is all
 * collectReferenceColors ever needed to answer "does this name a method that is
 * going away". Re-pointing needs the other half: which field of it is read.
 */
export const collectParsedReferences = (value: unknown): ParsedArg[] => {
	if (typeof value === 'string') return parseAll(value);
	if (Array.isArray(value)) return value.flatMap((item) => collectParsedReferences(item));
	if (value && typeof value === 'object') {
		return Object.values(value as Record<string, unknown>)
			.flatMap((nested) => collectParsedReferences(nested));
	}
	return [];
};
