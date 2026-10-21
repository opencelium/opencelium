import type { ActiveUrlReference } from './useActiveUrlReference';

export function highlightUrlReference(host: HTMLElement, active: ActiveUrlReference | null) {
	for (const pill of host.querySelectorAll<HTMLElement>('.oc-endpoint-ref')) {
		const selected = active?.root.contains(pill) && Number(pill.dataset.refIndex) === active.index;
		pill.classList.toggle('urlReferenceActive', !!selected);
		if (selected) pill.dataset.testid = 'workflow-url-active-reference';
		else delete pill.dataset.testid;
	}
}
export function selectUrlReference(pill: HTMLElement) {
	pill.closest<HTMLElement>('[contenteditable="true"]')?.focus();
	const range = document.createRange();
	range.selectNode(pill);
	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
}
