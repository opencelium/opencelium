import {
	closestEndpointRef,
	lengthBeforePosition,
	setRangeByVisibleOffset,
	stripCaretBoundaries,
} from './contentEditableDom';

const getTokenEndPosition = (root: HTMLElement, token: HTMLElement, mode: 'visible' | 'raw') => {
	const parent = token.parentElement;
	if (!parent) return -1;
	return lengthBeforePosition(root, parent, Array.from(parent.childNodes).indexOf(token) + 1, mode);
};

export function getCaretPositionOfDivEditable(editableDiv: HTMLElement): number {
	let caretOffset = 0;
	const selection = window.getSelection();
	if (selection && selection.rangeCount > 0) {
		const range = selection.getRangeAt(0);
		if (!editableDiv.contains(range.endContainer)) return -1;
		const token = closestEndpointRef(range.endContainer, editableDiv);
		if (token) return getTokenEndPosition(editableDiv, token, 'visible');
		caretOffset = lengthBeforePosition(editableDiv, range.endContainer, range.endOffset, 'visible');
	} else if ((document as any).selection && (document as any).selection.type !== 'Control') {
		const textRange = (document as any).selection.createRange();
		const preCaretTextRange = (document.body as any).createTextRange();
		preCaretTextRange.moveToElementText(editableDiv);
		preCaretTextRange.setEndPoint('EndToEnd', textRange);
		caretOffset = stripCaretBoundaries(preCaretTextRange.text).length;
	}
	return caretOffset;
}

export function getRawCaretPositionOfDivEditable(editableDiv: HTMLElement): number {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return -1;
	const range = selection.getRangeAt(0);
	if (!editableDiv.contains(range.endContainer)) return -1;
	const token = closestEndpointRef(range.endContainer, editableDiv);
	if (token) return getTokenEndPosition(editableDiv, token, 'raw');
	return lengthBeforePosition(editableDiv, range.endContainer, range.endOffset, 'raw');
}

export function isCaretReportedAtEditableRootStart(editableDiv: HTMLElement): boolean {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return false;
	const range = selection.getRangeAt(0);
	return range.endContainer === editableDiv && range.endOffset === 0;
}

export function setFocusByCaretPositionInDivEditable(
	element: HTMLElement | null,
	caretPosition: number,
): void {
	if (!element || caretPosition < 0) return;
	const range = document.createRange();
	const selection = window.getSelection();
	if (!selection) return;
	element.focus();
	setRangeByVisibleOffset(range, element, caretPosition);
	range.collapse(true);
	selection.removeAllRanges();
	selection.addRange(range);
}
