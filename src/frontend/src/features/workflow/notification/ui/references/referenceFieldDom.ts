import { ANY_REFERENCE_TOKEN_RE } from '../../model/notificationBody';
import type { ReferenceDescription } from './referenceDescription';
import '../../../components/reference-chip/referenceChip.css';

// The shared reference chip (components/reference-chip): one look for references everywhere.
export const CHIP_CLASS = 'wfReferenceChip';
const REMOVE_CLASS = 'wfReferenceChipRemove';

export const isChipRemoveButton = (target: EventTarget | null): target is HTMLElement =>
	target instanceof HTMLElement && target.classList.contains(REMOVE_CLASS);

const createChip = (token: string, describe: (token: string) => ReferenceDescription, removeLabel: string) => {
	const info = describe(token);
	const chip = document.createElement('span');
	chip.className = CHIP_CLASS;
	chip.contentEditable = 'false';
	chip.dataset.token = token;
	chip.title = info.token;
	chip.dataset.source = info.source;
	chip.style.setProperty('--wf-ref-color', info.color);
	const text = document.createElement('span');
	text.className = 'wfReferenceChipText';
	text.textContent = info.path;
	const remove = document.createElement('button');
	remove.type = 'button';
	remove.className = REMOVE_CLASS;
	remove.tabIndex = -1;
	remove.setAttribute('aria-label', removeLabel);
	remove.textContent = '×';
	chip.append(text, remove);
	return chip;
};

/** Paints `value` into the editable root: plain text as text nodes, each reference token as an atomic chip. */
export const paintReferenceValue = (
	root: HTMLElement,
	value: string,
	describe: (token: string) => ReferenceDescription,
	removeLabel: string,
) => {
	root.replaceChildren();
	let lastIndex = 0;
	for (const match of value.matchAll(new RegExp(ANY_REFERENCE_TOKEN_RE.source, 'g'))) {
		if (match.index > lastIndex) root.append(document.createTextNode(value.slice(lastIndex, match.index)));
		root.append(createChip(match[0], describe, removeLabel));
		lastIndex = match.index + match[0].length;
	}
	if (lastIndex < value.length) root.append(document.createTextNode(value.slice(lastIndex)));
};

/** Inverse of paintReferenceValue, tolerant of the `<div>`/`<br>` a browser inserts while editing. */
export const readReferenceValue = (node: Node): string => {
	let value = '';
	node.childNodes.forEach((child) => {
		if (child.nodeType === Node.TEXT_NODE) value += child.nodeValue ?? '';
		else if (child instanceof HTMLElement && child.classList.contains(CHIP_CLASS)) value += child.dataset.token ?? '';
		else if (child.nodeName === 'BR') value += '\n';
		else if (child.nodeName === 'DIV' || child.nodeName === 'P') {
			value += `${value && !value.endsWith('\n') ? '\n' : ''}${readReferenceValue(child)}`;
		} else value += readReferenceValue(child);
	});
	return value.replace(/\u00a0/g, ' ').replace(/\u200b/g, '');
};

export const insertChipAt = (
	root: HTMLElement,
	range: Range | null,
	token: string,
	describe: (token: string) => ReferenceDescription,
	removeLabel: string,
) => {
	const target = range && root.contains(range.startContainer) ? range : (() => {
		const end = document.createRange();
		end.selectNodeContents(root);
		end.collapse(false);
		return end;
	})();
	target.deleteContents();
	const chip = createChip(token, describe, removeLabel);
	target.insertNode(chip);
	const spacer = document.createTextNode(' ');
	chip.after(spacer);
	const caret = document.createRange();
	caret.setStartAfter(spacer);
	caret.collapse(true);
	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(caret);
};
