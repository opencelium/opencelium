/**
 * Diagnostics for "the suggester proposed nothing". Off unless switched on in the console:
 *
 *   localStorage.setItem('oc_debug_suggestions', '1')   // then reopen the body editor
 *   localStorage.removeItem('oc_debug_suggestions')     // off again
 *
 * Logs field *paths* — the schema key names both sides are matched on — and never the
 * values held at them, so turning this on cannot leak a request body into a console log.
 */
import type { Connection, MethodWithId } from '../types/connection';
import type { FieldBindingSuggestionRequest } from './fieldBindingSuggestion.types';
import { buildIteratorAccessors } from './loopIterators';

const FLAG = 'oc_debug_suggestions';

const isEnabled = () => {
	try {
		return localStorage.getItem(FLAG) === '1';
	} catch {
		return false;
	}
};

/**
 * Why an array resolved to [0] rather than a loop iterator: the target's position in the
 * tree, the operators that could enclose it, and what was actually matched.
 */
export const logIteratorScope = (connection: Connection | null, method: MethodWithId) => {
	if (!isEnabled()) return;
	const accessors = buildIteratorAccessors(connection, method);
	console.groupCollapsed(`[suggestions] iterator scope for ${method.label || method.name}`
		+ ` (index "${method.index}") — ${accessors.size} matched`);
	console.log('operators', (connection?.fromConnector.operator ?? []).map((operator) => ({
		index: operator.index,
		type: operator.type,
		iterator: (operator as { iterator?: string }).iterator,
		expression: operator.expression,
	})));
	console.log('accessors (colour|arrayPath → iterator)', Object.fromEntries(accessors));
	console.groupEnd();
};

export const logSuggestionRequest = (request: FieldBindingSuggestionRequest) => {
	if (!isEnabled()) return;
	console.groupCollapsed(`[suggestions] ${request.target.label}: `
		+ `${request.target.fields.length} open target fields, ${request.sources.length} sources`);
	console.log('target', request.target.fields.map((field) => `${field.path} (${field.kind})`));
	request.sources.forEach((source) => console.log(
		`source ${source.label} [${source.color}]`,
		source.fields.map((field) => `${field.path} (${field.kind})`)));
	console.groupEnd();
};

/** What came back — the half of the round trip the request log cannot show. */
export const logSuggestionResponse = (result: {
	data?: { suggestions?: unknown[] };
	error?: unknown;
	isError?: boolean;
}) => {
	if (!isEnabled()) return;
	if (result.isError || result.error) {
		console.error('[suggestions] request failed', result.error);
		return;
	}
	console.log(`[suggestions] ${result.data?.suggestions?.length ?? 0} returned`,
		result.data?.suggestions);
};
