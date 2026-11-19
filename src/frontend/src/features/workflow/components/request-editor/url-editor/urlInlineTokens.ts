import type { EndpointArg } from '../../../types/connection';
import { getReferenceDisplayLabel } from '../shared/referenceDisplay';
import { createId as createStableId } from '@shared/lib/createId';
import { GLOBAL_REFERENCE_TOKEN } from '@entities/globalVariable/lib/globalReference';

export const ARG_TOKEN_RE = /(#{%\s*([A-Za-z0-9_-]+)\s*%})/g;
const INLINE_TOKEN_RE = new RegExp(`${ARG_TOKEN_RE.source}|(${GLOBAL_REFERENCE_TOKEN})`, 'g');
// Global references stay plain text in the endpoint; they get a pill of their own, without
// `data-ref-index`, so the endpoint-arg machinery (active pill, delete by index) ignores them.
export const GLOBAL_REF_ATTRIBUTE = 'data-global-ref';
const GLOBAL_PREFIX_LENGTH = '{{global.'.length;
const globalLabel = (raw: string) => raw.slice(GLOBAL_PREFIX_LENGTH, -2);
const CARET_BOUNDARY = '\u200B';
export const createId = () => createStableId();
export const escapeHtml = (value: string) => (value || '').replace(/[&<>"]/g, (character) =>
	({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[character]);
export const isSelectionInside = (root: HTMLElement) => {
	const selection = window.getSelection?.();
	return !!selection?.rangeCount && root.contains(selection.getRangeAt(0).startContainer);
};
export const extractColorFromSourceRef = (reference?: string) =>
	reference?.match(/^#([0-9a-f]{6})\./i)?.[1]
		? `#${reference.match(/^#([0-9a-f]{6})\./i)![1]}` : null;
export const visibleFromSourceRef = (reference?: string) =>
	getReferenceDisplayLabel(reference || '');

export type InlinePart = { value: string; kind: 'text' | 'arg' | 'global'; argId?: string };
export function buildInlineParts(raw: string): InlinePart[] {
	const value = raw || '';
	const output: InlinePart[] = [];
	let index = 0;
	while (index < value.length) {
		INLINE_TOKEN_RE.lastIndex = index;
		const match = INLINE_TOKEN_RE.exec(value);
		if (!match) { output.push({ value: value.slice(index), kind: 'text' }); break; }
		if (match.index > index) output.push({ value: value.slice(index, match.index), kind: 'text' });
		output.push(match[3]
			? { value: match[3], kind: 'global' }
			: { value: match[1], kind: 'arg', argId: match[2] });
		index = match.index + match[0].length;
	}
	return output;
}

const partVisualLength = (part: InlinePart, endpointArgs?: Record<string, EndpointArg>) => {
	switch (part.kind) {
		case 'text':
			return part.value.length;
		case 'global':
			return globalLabel(part.value).length;
		case 'arg': {
			const source = endpointArgs?.[part.argId || '']?.source;
			return (source ? visibleFromSourceRef(source) : part.argId || '').length;
		}
		default: {
			const _exhaustive: never = part.kind;
			return _exhaustive;
		}
	}
};

export function getInlineVisualLength(raw: string, endpointArgs?: Record<string, EndpointArg>) {
	return buildInlineParts(raw || '').reduce((length, part) => length + partVisualLength(part, endpointArgs), 0);
}

const buildGlobalSpanHtml = (raw: string) => `<span class="oc-global-ref" ${GLOBAL_REF_ATTRIBUTE} data-main="${escapeHtml(raw)}" contenteditable="false" title="${escapeHtml(raw)}" style="display:inline-block;margin:0 2px;padding:0 6px;border-radius:4px;border:1px solid var(--color-status-info-border);background:var(--color-status-info-bg);color:var(--color-status-info-fg);font-size:12px;line-height:1.5;vertical-align:middle;user-select:none;">${escapeHtml(globalLabel(raw))}</span>`;

export function buildTokenSpanHtml(options: { className: string; dataMain: string;
	refIndex: number; color: string; label: string; cursorPointer?: boolean }) {
	const { className, dataMain, refIndex, color, label, cursorPointer } = options;
	return `<span class="${className}" data-main="${escapeHtml(dataMain)}" data-ref-index="${refIndex}" contenteditable="false" style="display:inline-block;margin:0 2px;padding:0 6px;border-radius:4px;background:${color};color:var(--color-text-on-action);font-size:12px;line-height:1.6;vertical-align:middle;user-select:none;${cursorPointer ? 'cursor:pointer;' : ''}">${escapeHtml(label)}</span>`;
}

export function buildInlineHtml(raw: string, endpointArgs?: Record<string, EndpointArg>,
	options?: { className?: string; cursorPointer?: boolean }) {
	if (!raw) return '';
	let referenceIndex = 0;
	return buildInlineParts(raw).map((part) => {
		if (part.kind === 'text') return escapeHtml(part.value);
		if (part.kind === 'global') return `${CARET_BOUNDARY}${buildGlobalSpanHtml(part.value)}${CARET_BOUNDARY}`;
		const source = endpointArgs?.[part.argId || '']?.source;
		const token = buildTokenSpanHtml({ className: options?.className || 'oc-endpoint-ref',
			dataMain: part.value, refIndex: referenceIndex++,
			color: extractColorFromSourceRef(source) ?? 'var(--color-action-primary)',
			label: source ? visibleFromSourceRef(source) : part.argId || '',
			cursorPointer: !!options?.cursorPointer });
		return `${CARET_BOUNDARY}${token}${CARET_BOUNDARY}`;
	}).join('');
}

export function parseHtmlToRaw(html: string, tokenClass: string): string {
	if (!html) return '';
	const container = document.createElement('div');
	container.innerHTML = html;
	const walk = (node: ChildNode): string => {
		if (node.nodeType === Node.TEXT_NODE) return (node.textContent || '')
			.replace(/\u200B/g, '').replace(/\u00a0/g, ' ');
		if (node.nodeType !== Node.ELEMENT_NODE) return '';
		const element = node as HTMLElement;
		if (element.classList.contains(tokenClass) || element.hasAttribute(GLOBAL_REF_ATTRIBUTE)) {
			return element.getAttribute('data-main') || '';
		}
		return Array.from(element.childNodes).map(walk).join('');
	};
	return Array.from(container.childNodes).map(walk).join('');
}

export function computeRawInsertAtFromVisualCaret(raw: string, caret: number,
	endpointArgs?: Record<string, EndpointArg>) {
	let visualPosition = 0;
	let rawPosition = 0;
	for (const part of buildInlineParts(raw || '')) {
		const length = partVisualLength(part, endpointArgs);
		if (caret <= visualPosition + length) {
			return part.kind === 'text' ? rawPosition + caret - visualPosition : rawPosition + part.value.length;
		}
		visualPosition += length;
		rawPosition += part.value.length;
	}
	return (raw || '').length;
}

export function removeInlineTokenByIndex(raw: string, tokenIndex: number) {
	let index = 0;
	return buildInlineParts(raw || '').filter((part) =>
		part.kind !== 'arg' || index++ !== tokenIndex).map((part) => part.value).join('');
}
