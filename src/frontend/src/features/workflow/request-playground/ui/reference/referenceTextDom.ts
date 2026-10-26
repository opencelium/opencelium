import type { JsonPart } from '../../model/bodyPreview';

// Keeps a caret position next to a chip, which browsers cannot place one beside otherwise.
const CARET_ANCHOR = '\u200B';

const createChip = (raw: string, placeholder: string) => {
	const chip = document.createElement('span');
	chip.className = 'rpDynamic rpDynamic--missing';
	chip.contentEditable = 'false';
	chip.dataset.raw = raw;
	const label = document.createElement('span');
	label.className = 'rpJson-placeholder';
	label.textContent = placeholder;
	chip.append(label);
	return chip;
};

export function paintParts(root: HTMLElement, parts: JsonPart[], placeholder: string) {
	const nodes = parts.flatMap((part, index): Node[] => {
		if (part.kind !== 'input') return [document.createTextNode(part.text)];
		const isFollowedByText = parts[index + 1] && parts[index + 1].kind !== 'input';
		return isFollowedByText ? [createChip(part.raw, placeholder)]
			: [createChip(part.raw, placeholder), document.createTextNode(CARET_ANCHOR)];
	});
	root.replaceChildren(...nodes);
}

// A reference taken out by a click, to put back if the user leaves without typing a value.
export type RemovedChip = { raw: string; offset: number };

// Swaps a chip for a caret at its place, so the user types the value where the reference was.
export function replaceChipWithCaret(root: HTMLElement, chip: HTMLElement): RemovedChip {
	const range = document.createRange();
	range.setStart(root, 0);
	range.setEndBefore(chip);
	const removed = { raw: chip.dataset.raw ?? '', offset: readRawText(range.cloneContents()).length };
	range.collapse(false);
	chip.remove();
	const selection = window.getSelection();
	selection?.removeAllRanges();
	selection?.addRange(range);
	return removed;
}

// Puts removed references back, the latest first, so every offset matches the text it was taken from.
export const restoreChips = (text: string, removed: RemovedChip[]) => removed.reduceRight(
	(current, { raw, offset }) => current.slice(0, offset) + raw + current.slice(offset), text);

export const findChip = (target: EventTarget) =>
	target instanceof Element ? target.closest<HTMLElement>('[data-raw]') : null;

// The text the user edited, with every chip written back as the reference it stands for.
export function readRawText(root: Node): string {
	return Array.from(root.childNodes, (node) => {
		if (node.nodeType === Node.TEXT_NODE) return (node.nodeValue ?? '').replace(/[\u200B\r\n]/g, '');
		if (node instanceof HTMLElement && node.dataset.raw !== undefined) return node.dataset.raw;
		return readRawText(node);
	}).join('');
}
