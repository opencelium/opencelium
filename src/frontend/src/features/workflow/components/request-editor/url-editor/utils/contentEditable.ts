export function getCaretPositionOfDivEditable(
	editableDiv: HTMLElement
): number {
	let caretOffset = 0;
	const sel = window.getSelection();
	if (sel && sel.rangeCount > 0) {
		const range = sel.getRangeAt(0);
		const preCaretRange = range.cloneRange();
		preCaretRange.selectNodeContents(editableDiv);
		preCaretRange.setEnd(range.endContainer, range.endOffset);
		caretOffset = preCaretRange.toString().length;
	} else if (
		(document as any).selection &&
		(document as any).selection.type !== 'Control'
	) {
		const textRange = (document as any).selection.createRange();
		const preCaretTextRange = (document.body as any).createTextRange();
		preCaretTextRange.moveToElementText(editableDiv);
		preCaretTextRange.setEndPoint('EndToEnd', textRange);
		caretOffset = preCaretTextRange.text.length;
	}

	return caretOffset;
}

export function setFocusByCaretPositionInDivEditable(
	elem: HTMLElement | null,
	caretPosition: number
): void {
	if (elem && caretPosition >= 0) {
		const range = document.createRange();
		const sel = window.getSelection();
		let childNodeIndex = 0;
		let elemLength = 0;

		for (let i = 0; i < elem.children.length; i++) {
			// @ts-ignore
			caretPosition -= elem.children[i].innerText.length;
			// @ts-ignore
			elemLength += elem.children[i].innerText.length;
			if (caretPosition <= 0) {
				// @ts-ignore
				caretPosition = elem.children[i].innerText.length + caretPosition;
				break;
			}
			childNodeIndex++;
		}

		const childNode = elem.childNodes[childNodeIndex];
		if (!childNode || !sel) return;

		if (childNode.nodeType === 1) {
			const firstChild: any = (childNode as any).firstChild;
			if (firstChild && caretPosition <= firstChild.length) {
				range.setStart(firstChild, caretPosition);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			}
		} else {
			const textNode: any = childNode;
			if (caretPosition <= textNode.length) {
				range.setStart(textNode, caretPosition);
				range.collapse(true);
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
	}
}
