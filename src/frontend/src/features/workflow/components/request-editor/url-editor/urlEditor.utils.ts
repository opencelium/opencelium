import type { EndpointArg } from '../../../types/connection';
import { getReferenceDisplayLabel } from '../shared/referenceDisplay';
import { createId as createStableId } from '@shared/lib/createId';

export const PROHIBITED_ENDPOINT_CHARACTERS = ['<', '>', 'Enter'];
export const URL_FORBIDDEN_INPUT_RE = /[\u0000-\u001F\u007F\s"<>`{}|\\^[\]]/g;
const URL_FORBIDDEN_INPUT_SINGLE_RE = /[\u0000-\u001F\u007F\s"<>`{}|\\^[\]]/;

export const ARG_TOKEN_RE = /(#{%\s*([A-Za-z0-9_-]+)\s*%})/g;
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

export const visibleFromSourceRef = (ref?: string) =>
	getReferenceDisplayLabel(ref || '');

export const clearHighlight = (base: ParentNode, selector: string) =>
	base.querySelectorAll<HTMLElement>(selector).forEach((s) => {
		s.style.outline = 'none';
		s.style.boxShadow = 'none';
	});

export const hasAnyTokenInString = (s: string) => /#{%\s*[A-Za-z0-9_-]+\s*%}/.test(s || '');

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

export type InlinePart = { value: string; kind: 'text' | 'arg'; argId?: string };

export function buildInlineParts(raw: string): InlinePart[] {
	const s = raw || '';
	const out: InlinePart[] = [];
	let i = 0;

	while (i < s.length) {
		ARG_TOKEN_RE.lastIndex = i;
		const m = ARG_TOKEN_RE.exec(s);
		if (!m) {
			out.push({ value: s.slice(i), kind: 'text' });
			break;
		}
		if (m.index > i) out.push({ value: s.slice(i, m.index), kind: 'text' });
		out.push({ value: m[1], kind: 'arg', argId: m[2] });
		i = m.index + m[0].length;
	}
	return out;
}

export function getInlineVisualLength(raw: string, endpointArgs?: Record<string, EndpointArg>): number {
	let v = 0;
	for (const p of buildInlineParts(raw || '')) {
		if (p.kind === 'text') v += p.value.length;
		else {
			const id = p.argId || '';
			const src = endpointArgs?.[id]?.source;
			v += (src ? visibleFromSourceRef(src) : id).length;
		}
	}
	return v;
}

export function buildTokenSpanHtml(opts: {
	className: string;
	dataMain: string;
	refIndex: number;
	color: string;
	label: string;
	cursorPointer?: boolean;
}): string {
	const { className, dataMain, refIndex, color, label, cursorPointer } = opts;
	return `<span class="${className}" data-main="${escapeHtml(dataMain)}" data-ref-index="${refIndex}" contenteditable="false" style="display:inline-block;margin:0 2px;padding:0 6px;border-radius:4px;background:${color};color:#fff;font-size:12px;line-height:1.6;vertical-align:middle;user-select:text;${cursorPointer ? 'cursor:pointer;' : ''}">${escapeHtml(label)}</span>`;
}

export function buildInlineHtml(
	raw: string,
	endpointArgs?: Record<string, EndpointArg>,
	opts?: { className?: string; cursorPointer?: boolean }
): string {
	const s = raw || '';
	if (!s) return '';

	const className = opts?.className || 'oc-endpoint-ref';
	const cursorPointer = !!opts?.cursorPointer;

	let idx = 0;
	const out: string[] = [];

	for (const p of buildInlineParts(s)) {
		if (p.kind === 'text') {
			out.push(escapeHtml(p.value));
			continue;
		}
		const id = p.argId || '';
		const src = endpointArgs?.[id]?.source;
		out.push(
			buildTokenSpanHtml({
				className,
				dataMain: p.value,
				refIndex: idx++,
				color: extractColorFromSourceRef(src) ?? '#2372ba',
				label: src ? visibleFromSourceRef(src) : id,
				cursorPointer,
			})
		);
	}
	return out.join('');
}

export function parseHtmlToRaw(html: string, tokenClass: string): string {
	if (!html) return '';
	const container = document.createElement('div');
	container.innerHTML = html;

	const walk = (n: ChildNode): string => {
		if (n.nodeType === Node.TEXT_NODE) return (n.textContent || '').replace(/\u00a0/g, ' ');
		if (n.nodeType !== Node.ELEMENT_NODE) return '';

		const el = n as HTMLElement;
		if (el.classList.contains(tokenClass)) return el.getAttribute('data-main') || '';

		let acc = '';
		el.childNodes.forEach((c) => (acc += walk(c)));
		return acc;
	};

	let res = '';
	container.childNodes.forEach((c) => (res += walk(c)));
	return res;
}

export function computeRawInsertAtFromVisualCaret(
	raw: string,
	caretVis: number,
	endpointArgs?: Record<string, EndpointArg>
): number {
	const parts = buildInlineParts(raw || '');
	let acc = 0;
	let rawPos = 0;

	for (const p of parts) {
		const segVis =
			p.kind === 'text'
				? p.value.length
				: (endpointArgs?.[p.argId || '']?.source
						? visibleFromSourceRef(endpointArgs![p.argId || ''].source!)
						: p.argId || ''
				  ).length;

		if (caretVis <= acc + segVis) return p.kind === 'text' ? rawPos + (caretVis - acc) : rawPos + p.value.length;

		acc += segVis;
		rawPos += p.value.length;
	}
	return (raw || '').length;
}

export function valueForFilter(raw: string, endpointArgs?: Record<string, EndpointArg>): string {
	let out = '';
	for (const p of buildInlineParts(raw || '')) {
		if (p.kind === 'text') out += p.value;
		else {
			const id = p.argId || '';
			const src = endpointArgs?.[id]?.source;
			out += src ? visibleFromSourceRef(src) : id;
		}
	}
	return out;
}

export function removeInlineTokenByIndex(raw: string, tokenIndex: number): string {
	let idx = 0;
	const out: string[] = [];
	for (const p of buildInlineParts(raw || '')) {
		if (p.kind === 'text') out.push(p.value);
		else if (idx++ !== tokenIndex) out.push(p.value);
	}
	return out.join('');
}

export type ParsedEndpoint = { base: string; queryRaw: string; hasQuestion: boolean };

export const splitEndpoint = (endpoint: string): ParsedEndpoint => {
	const s = endpoint || '';
	const i = s.indexOf('?');
	return i === -1 ? { base: s, queryRaw: '', hasQuestion: false } : { base: s.slice(0, i), queryRaw: s.slice(i + 1), hasQuestion: true };
};

export const parseQueryToPairs = (queryRaw: string) =>
	(queryRaw ? queryRaw.split('&') : []).filter(Boolean).map((ch) => {
		const eq = ch.indexOf('=');
		return eq === -1 ? { key: ch, value: '' } : { key: ch.slice(0, eq), value: ch.slice(eq + 1) };
	});

export type QueryParamLite = { id: string; key: string; value: string; enabled: boolean };

export const buildQueryFromParams = (params: QueryParamLite[]) =>
	params
		.filter((p) => p.enabled && p.key.trim() !== '')
		.map((p) => `${p.key}=${p.value ?? ''}`)
		.join('&');

export function ensureTemplateRow<T extends QueryParamLite>(params: T[]): T[] {
	const last = params[params.length - 1];
	const isTemplate = !!last && !last.enabled && !last.key.trim() && !last.value.trim();
	return isTemplate
		? params
		: [...(params.length ? params : []), ({ id: createId(), key: '', value: '', enabled: false } as T)];
}

export const isTemplateRow = (p: QueryParamLite) => !p.enabled && !p.key.trim() && !p.value.trim();

export const stripTemplateRows = <T extends QueryParamLite>(params: T[]) =>
	(params || []).filter((p) => !isTemplateRow(p) && p.key.trim() !== '');

export const isMockActiveRow = (p: QueryParamLite) =>
	p.key.trim().toLowerCase() === 'mock' && String(p.value ?? '').trim().toLowerCase() === 'active';

export const stripMockActiveRows = <T extends QueryParamLite>(params: T[]) =>
	(params || []).filter((p) => !isMockActiveRow(p));

export function stripMockActiveFromEndpoint(endpointStr: string) {
	const endpoint = splitEndpoint(endpointStr || '');
	if (!endpoint.hasQuestion) return endpointStr || '';
	const pairs = parseQueryToPairs(endpoint.queryRaw)
		.filter((pair) => !isMockActiveRow({ id: '', enabled: true, key: pair.key, value: pair.value }));
	const query = pairs.map((pair) => `${pair.key}=${pair.value ?? ''}`).join('&');
	return query ? `${endpoint.base}?${query}` : endpoint.base;
}

export function buildQueryParamsFromEndpoint<T extends QueryParamLite>(endpointStr: string, prev?: T[]): T[] {
	const pairs = parseQueryToPairs(splitEndpoint(stripMockActiveFromEndpoint(endpointStr || '')).queryRaw);
	const prevMeaningful = stripMockActiveRows(stripTemplateRows(prev || []));
	return ensureTemplateRow(
		pairs
			.filter((pair) => !isMockActiveRow({ id: '', enabled: true, key: pair.key, value: pair.value }))
			.map((pair, i) => ({ id: prevMeaningful[i]?.id || createId(), key: pair.key, value: pair.value, enabled: true } as T))
	);
}

export const normalizeReference = (ref: string) => {
	let r = (ref || '').trim();
	if (r.startsWith('{%') && r.endsWith('%}')) r = r.slice(2, -2).trim();
	return r.startsWith('#') ? r : `#${r}`;
};

export type QueryValueTokenPolicy = { inQuery: boolean; inValue: boolean; hasToken: boolean; isAfterToken: boolean };

export function getQueryValueTokenPolicyAtRawPos(endpointRaw: string, rawPos: number): QueryValueTokenPolicy {
	const s = endpointRaw || '';
	const qStart = s.indexOf('?');
	if (qStart === -1) return { inQuery: false, inValue: false, hasToken: false, isAfterToken: false };

	const qPos = rawPos - (qStart + 1);
	if (qPos < 0) return { inQuery: false, inValue: false, hasToken: false, isAfterToken: false };

	const queryRaw = s.slice(qStart + 1);
	const chunks = queryRaw.split('&');

	let acc = 0;
	for (const seg of chunks) {
		const segStart = acc;
		const segEnd = acc + (seg || '').length;

		if (qPos >= segStart && qPos <= segEnd) {
			const eq = (seg || '').indexOf('=');
			if (eq === -1 || qPos <= segStart + eq)
				return { inQuery: true, inValue: false, hasToken: false, isAfterToken: false };

			const valuePart = (seg || '').slice(eq + 1);
			const valueAbsStart = qStart + 1 + (segStart + eq + 1);

			const matches = Array.from(valuePart.matchAll(/#{%\s*[A-Za-z0-9_-]+\s*%}/g));
			if (!matches.length) return { inQuery: true, inValue: true, hasToken: false, isAfterToken: false };

			const last = matches[matches.length - 1];
			const lastStart = valueAbsStart + (last.index ?? 0);
			const lastEnd = lastStart + last[0].length;

			return { inQuery: true, inValue: true, hasToken: true, isAfterToken: rawPos >= lastEnd };
		}

		acc = segEnd + 1;
	}

	return { inQuery: true, inValue: false, hasToken: false, isAfterToken: false };
}

export const sanitizePlainTextPaste = (s: string) => (s || '').replace(/\r?\n/g, '').replace(/\t/g, ' ');

export const sanitizeUrlInputValue = (s: string) =>
	(s || '').replace(URL_FORBIDDEN_INPUT_RE, '');

export const shouldBlockUrlKeyInput = (key: string) =>
	key.length === 1 && URL_FORBIDDEN_INPUT_SINGLE_RE.test(key);
