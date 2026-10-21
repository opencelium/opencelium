import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { highlightUrlReference, selectUrlReference } from './activeUrlReference.utils';
import { buildInlineParts, parseHtmlToRaw } from '../urlInlineTokens';
import { lengthBeforePosition } from '../utils/contentEditableDom';

export type ActiveUrlReference = {
	root: HTMLElement;
	index: number;
	token: string;
	start: number;
	end: number;
	rowId?: string;
	field?: 'key' | 'value';
};
export function useActiveUrlReference(
	wrapper: RefObject<HTMLDivElement | null>,
	readOnly?: boolean,
	selectedTokenRef?: RefObject<number | null>,
) {
	const [active, setActive] = useState<ActiveUrlReference | null>(null);
	const current = useRef<ActiveUrlReference | null>(null);
	const pickerOpen = useRef(false);
	const clear = useCallback(() => {
		current.current = null;
		if (selectedTokenRef) selectedTokenRef.current = null;
		setActive(null);
	}, [selectedTokenRef]);
	useEffect(() => {
		const host = wrapper.current;
		if (!host || readOnly) return;
		const tokens = () => [...host.querySelectorAll<HTMLElement>('.oc-endpoint-ref')];
		const paint = () => highlightUrlReference(host, current.current);
		const activate = (pill: HTMLElement) => {
			const root = pill.closest<HTMLElement>('[contenteditable="true"]');
			if (!root) return;
			const raw = parseHtmlToRaw(root.innerHTML, 'oc-endpoint-ref');
			const index = Number(pill.dataset.refIndex);
			let start = 0,
				seen = 0;
			for (const part of buildInlineParts(raw)) {
				if (part.kind === 'arg' && seen++ === index) {
					const scope = root.closest<HTMLElement>('[data-url-row-id]');
					const next: ActiveUrlReference = {
						root,
						index,
						token: part.value,
						start,
						end: start + part.value.length,
						rowId: scope?.dataset.urlRowId,
						field: scope?.dataset.urlField as 'key' | 'value' | undefined,
					};
					if (selectedTokenRef) selectedTokenRef.current = scope ? null : index;
					current.current = next;
					setActive(next);
					paint();
					return;
				}
				start += part.value.length;
			}
		};
		const selection = () => {
			if (
				pickerOpen.current &&
				document.activeElement?.closest('[data-url-reference-control], .ant-select-dropdown')
			)
				return;
			const s = window.getSelection();
			if (!s?.rangeCount) return;
			const range = s.getRangeAt(0);
			const pill = tokens().find((p) => {
				if (p.contains(range.startContainer))
					return (
						range.startOffset > 0 &&
						range.startOffset < (range.startContainer.textContent?.length ?? 0)
					);
				const selected = document.createRange();
				selected.selectNode(p);
				return (
					!range.collapsed &&
					range.compareBoundaryPoints(Range.START_TO_START, selected) === 0 &&
					range.compareBoundaryPoints(Range.END_TO_END, selected) === 0
				);
			});
			if (pill) activate(pill);
			else {
				clear();
				paint();
			}
		};
		const click = (event: MouseEvent) => {
			const pill = (event.target as HTMLElement).closest<HTMLElement>('.oc-endpoint-ref');
			if (!pill || !host.contains(pill)) return;
			selectUrlReference(pill);
			activate(pill);
		};
		const key = (event: KeyboardEvent) => {
			if (event.ctrlKey || event.metaKey || event.altKey) return;
			const root = (event.target as HTMLElement).closest<HTMLElement>('[contenteditable="true"]');
			if (!root || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
			const s = window.getSelection();
			if (!s?.rangeCount) return;
			const range = s.getRangeAt(0);
			if (current.current?.root === root) {
				const pill = root.querySelector<HTMLElement>(
					'[data-testid="workflow-url-active-reference"]',
				);
				if (!pill) return;
				event.preventDefault();
				const edge = document.createRange();
				if (event.key === 'ArrowLeft') edge.setStartBefore(pill);
				else edge.setStartAfter(pill);
				edge.collapse(true);
				s.removeAllRanges();
				s.addRange(edge);
				clear();
				paint();
				return;
			}
			if (!range.collapsed || !root.contains(range.startContainer)) return;
			const offset = lengthBeforePosition(root, range.startContainer, range.startOffset, 'raw');
			let position = 0,
				index = 0;
			for (const part of buildInlineParts(parseHtmlToRaw(root.innerHTML, 'oc-endpoint-ref'))) {
				if (part.kind === 'arg') {
					if (
						(event.key === 'ArrowRight' && offset === position) ||
						(event.key === 'ArrowLeft' && offset === position + part.value.length)
					) {
						const pill = root.querySelector<HTMLElement>(`[data-ref-index="${index}"]`);
						if (pill) {
							event.preventDefault();
							const r = document.createRange();
							r.selectNode(pill);
							s.removeAllRanges();
							s.addRange(r);
							activate(pill);
						}
						return;
					}
					index++;
				}
				position += part.value.length;
			}
		};
		const blur = (event: FocusEvent) => {
			if (
				event.relatedTarget instanceof Element &&
				host.contains(event.relatedTarget) &&
				event.relatedTarget.closest('[data-url-reference-control]')
			)
				return;
			clear();
			paint();
		};
		const observer = new MutationObserver(() => {
			const item = current.current;
			if (
				item &&
				(!host.contains(item.root) ||
					parseHtmlToRaw(item.root.innerHTML, 'oc-endpoint-ref').slice(item.start, item.end) !==
						item.token)
			)
				clear();
			paint();
		});
		observer.observe(host, { childList: true, subtree: true });
		host.addEventListener('click', click);
		host.addEventListener('keydown', key, true);
		host.addEventListener('focusout', blur);
		document.addEventListener('selectionchange', selection);
		return () => {
			observer.disconnect();
			for (const pill of tokens()) {
				pill.classList.remove('urlReferenceActive');
				delete pill.dataset.testid;
			}
			clear();
			host.removeEventListener('click', click);
			host.removeEventListener('keydown', key, true);
			host.removeEventListener('focusout', blur);
			document.removeEventListener('selectionchange', selection);
		};
	}, [wrapper, readOnly, selectedTokenRef, clear]);
	return {
		active: readOnly ? null : active,
		getActive: () => current.current,
		setPickerOpen: (open: boolean) => {
			pickerOpen.current = open;
		},
		clear,
		restore: () => {
			const item = current.current;
			const pill = item?.root.querySelector<HTMLElement>(`[data-ref-index="${item.index}"]`);
			if (pill) selectUrlReference(pill);
		},
	};
}
