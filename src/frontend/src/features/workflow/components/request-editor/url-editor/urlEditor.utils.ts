import type { EndpointArg } from '../../../types/connection';
import { createId as createStableId } from '@shared/lib/createId';
import { buildInlineHtml as buildInlineHtmlWithClass } from './urlInlineTokens';

export const PROHIBITED_ENDPOINT_CHARACTERS = ['<', '>', 'Enter'];
// Only control characters and `<>` (which the contenteditable field cannot hold as
// text) are refused. Anything else is sent as typed: the backend encodes whatever a
// URL cannot carry, so `filter[age]=5`, `a|b` or `Müller` are valid input.
export const URL_FORBIDDEN_INPUT_RE = /[\u0000-\u001F\u007F<>]/g;
const URL_FORBIDDEN_INPUT_SINGLE_RE = /[\u0000-\u001F\u007F<>]/;

export const ARG_TOKEN_RE = /(#{%\s*([A-Za-z0-9_-]+)\s*%})/g;
// Class stamped on every rendered reference pill's <span> (see buildTokenSpanHtml) —
// shared so hover-tooltip detection (EndpointArgHoverTooltip) targets the same
// elements the endpoint field and inline value editors render.
export const ENDPOINT_REF_CLASS = 'oc-endpoint-ref';
const BACKEND_REFERENCE_RE =
	/\{%\s*(#[A-Fa-f0-9]{6}\.\((?:request|response)\)\.(?:body|header|status)(?:\.[^%{}]*)?)\s*%}/g;

export const createId = () => createStableId();

export const escapeHtml = (s: string) =>
	(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);

export const isSelectionInside = (root: HTMLElement) => {
	const sel = window.getSelection?.();
	return !!sel?.rangeCount && root.contains(sel.getRangeAt(0).startContainer);
};

export const extractColorFromSourceRef = (ref?: string) =>
	ref?.match(/^#([0-9a-f]{6})\./i)?.[1] ? `#${ref.match(/^#([0-9a-f]{6})\./i)![1]}` : null;

export { visibleFromSourceRef } from './urlInlineTokens';

const referenceTokenId = (source: string) => {
	let hash = 0;
	for (let i = 0; i < source.length; i += 1) {
		hash = (hash * 31 + source.charCodeAt(i)) >>> 0;
	}
	return `ref_${hash.toString(16)}`;
};

export function deserializeBackendReferenceTokens(
	raw: string,
	endpointArgs: Record<string, EndpointArg> = {}
) {
	const nextArgs = { ...endpointArgs };
	const sourceToId = new Map<string, string>();
	Object.values(nextArgs).forEach((arg) => {
		if (arg?.source) sourceToId.set(arg.source, arg.id);
	});

	const value = String(raw || '').replace(BACKEND_REFERENCE_RE, (_match, source: string) => {
		const id = sourceToId.get(source) || referenceTokenId(source);
		sourceToId.set(source, id);
		nextArgs[id] = {
			...nextArgs[id],
			id,
			source,
		};
		return `#{%${id}%}`;
	});

	return { value, endpointArgs: nextArgs };
}

export function unwrapBackendReferences(value: unknown): unknown {
	if (typeof value === 'string') {
		return value.replace(BACKEND_REFERENCE_RE, (_match, source: string) => source);
	}
	if (Array.isArray(value)) return value.map(unwrapBackendReferences);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
				key,
				unwrapBackendReferences(nested),
			])
		);
	}
	return value;
}

export {
	buildInlineParts,
	buildTokenSpanHtml,
	computeRawInsertAtFromVisualCaret,
	getInlineVisualLength,
	parseHtmlToRaw,
	removeInlineTokenByIndex,
	type InlinePart,
} from './urlInlineTokens';

export function buildInlineHtml(
	raw: string,
	endpointArgs?: Record<string, EndpointArg>,
	opts?: Parameters<typeof buildInlineHtmlWithClass>[2]
): string {
	return buildInlineHtmlWithClass(raw, endpointArgs, { ...opts, className: opts?.className || ENDPOINT_REF_CLASS });
}

export {
	buildQueryFromParams,
	buildQueryParamsFromEndpoint,
	encodeQueryKey,
	encodeQueryValue,
	ensureTemplateRow,
	isTemplateRow,
	splitEndpoint,
	stripMockActiveFromEndpoint,
	stripMockActiveRows,
	stripTemplateRows,
	type QueryParamLite,
} from './urlQueryParams.utils';

export const normalizeReference = (ref: string) => {
	let r = (ref || '').trim();
	if (r.startsWith('{%') && r.endsWith('%}')) r = r.slice(2, -2).trim();
	return r.startsWith('#') ? r : `#${r}`;
};

export const sanitizePlainTextPaste = (s: string) => (s || '').replace(/\r?\n/g, '').replace(/\t/g, ' ');

export const sanitizeUrlInputValue = (s: string) =>
	(s || '').replace(URL_FORBIDDEN_INPUT_RE, '');

export const shouldBlockUrlKeyInput = (key: string) =>
	key.length === 1 && URL_FORBIDDEN_INPUT_SINGLE_RE.test(key);
