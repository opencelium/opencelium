const TOKEN_CLASS = 'oc-endpoint-ref';
const CARET_BOUNDARY = '\u200B';

const stripCaretBoundaries = (text: string) => text.replace(/\u200B/g, '');

const isEndpointRefElement = (node: Node): node is HTMLElement =>
	node.nodeType === Node.ELEMENT_NODE &&
	(node as HTMLElement).classList.contains(TOKEN_CLASS);

const closestEndpointRef = (node: Node | null, root: HTMLElement) => {
	const element =
		node?.nodeType === Node.ELEMENT_NODE
			? (node as HTMLElement)
			: node?.parentElement;
	const token = element?.closest?.(`.${TOKEN_CLASS}`) as HTMLElement | null;
	return token && root.contains(token) ? token : null;
};

const visibleLength = (node: Node): number => {
	if (node.nodeType === Node.TEXT_NODE) {
		return stripCaretBoundaries(node.textContent || '').length;
	}
	if (isEndpointRefElement(node)) {
		return stripCaretBoundaries(node.textContent || '').length;
	}

	let length = 0;
	node.childNodes.forEach((child) => {
		length += visibleLength(child);
	});
	return length;
};

const rawLength = (node: Node): number => {
	if (node.nodeType === Node.TEXT_NODE) {
		return stripCaretBoundaries(node.textContent || '').length;
	}
	if (isEndpointRefElement(node)) {
		return (node.getAttribute('data-main') || '').length;
	}

	let length = 0;
	node.childNodes.forEach((child) => {
		length += rawLength(child);
	});
	return length;
};

const rawLengthBeforeElementOffset = (element: Element, offset: number) =>
	Array.from(element.childNodes)
		.slice(0, Math.max(0, offset))
		.reduce((sum, child) => sum + rawLength(child), 0);

const rawLengthBeforePosition = (
	root: HTMLElement,
	container: Node,
	offset: number,
): number => {
	if (container === root) {
		return rawLengthBeforeElementOffset(root, offset);
	}

	let total = 0;
	let found = false;

	const walk = (parent: Node): void => {
		if (found) return;

		for (const child of Array.from(parent.childNodes)) {
			if (child === container) {
				if (child.nodeType === Node.TEXT_NODE) {
					total += stripCaretBoundaries(
						(child.textContent || '').slice(0, Math.max(0, offset)),
					).length;
				} else if (child.nodeType === Node.ELEMENT_NODE) {
					total += rawLengthBeforeElementOffset(child as Element, offset);
				}
				found = true;
				return;
			}

			if (
				child.nodeType === Node.ELEMENT_NODE &&
				(child as Element).contains(container)
			) {
				walk(child);
				return;
			}

			total += rawLength(child);
		}
	};

	walk(root);
	return found ? total : -1;
};

const visibleLengthBeforeElementOffset = (element: Element, offset: number) =>
	Array.from(element.childNodes)
		.slice(0, Math.max(0, offset))
		.reduce((sum, child) => sum + visibleLength(child), 0);

const visibleLengthBeforePosition = (
	root: HTMLElement,
	container: Node,
	offset: number,
): number => {
	if (container === root) {
		return visibleLengthBeforeElementOffset(root, offset);
	}

	let total = 0;
	let found = false;

	const walk = (parent: Node): void => {
		if (found) return;

		for (const child of Array.from(parent.childNodes)) {
			if (child === container) {
				if (child.nodeType === Node.TEXT_NODE) {
					total += stripCaretBoundaries(
						(child.textContent || '').slice(0, Math.max(0, offset)),
					).length;
				} else if (child.nodeType === Node.ELEMENT_NODE) {
					total += visibleLengthBeforeElementOffset(child as Element, offset);
				}
				found = true;
				return;
			}

			if (
				child.nodeType === Node.ELEMENT_NODE &&
				(child as Element).contains(container)
			) {
				walk(child);
				return;
			}

			total += visibleLength(child);
		}
	};

	walk(root);
	return found ? total : -1;
};

const textOffsetFromVisibleOffset = (text: string, visibleOffset: number) => {
	if (visibleOffset <= 0) return 0;

	let visible = 0;
	for (let i = 0; i < text.length; i += 1) {
		if (text[i] === CARET_BOUNDARY) continue;
		visible += 1;
		if (visible >= visibleOffset) return i + 1;
	}

	return text.length;
};

const setRangeByVisibleOffset = (
	range: Range,
	parent: Node,
	offset: number,
): boolean => {
	let remaining = Math.max(0, offset);

	for (const child of Array.from(parent.childNodes)) {
		const length = visibleLength(child);

		if (child.nodeType === Node.TEXT_NODE) {
			if (remaining <= length) {
				range.setStart(
					child,
					textOffsetFromVisibleOffset(child.textContent || '', remaining),
				);
				return true;
			}
			remaining -= length;
			continue;
		}

		if (isEndpointRefElement(child)) {
			if (remaining <= length) {
				if (remaining <= 0) range.setStartBefore(child);
				else range.setStartAfter(child);
				return true;
			}
			remaining -= length;
			continue;
		}

		if (remaining <= length && setRangeByVisibleOffset(range, child, remaining)) {
			return true;
		}
		remaining -= length;
	}

	range.setStart(parent, parent.childNodes.length);
	return true;
};

export function getCaretPositionOfDivEditable(
	editableDiv: HTMLElement
): number {
	let caretOffset = 0;
	const sel = window.getSelection();
	if (sel && sel.rangeCount > 0) {
		const range = sel.getRangeAt(0);
		if (!editableDiv.contains(range.endContainer)) return -1;
		const token = closestEndpointRef(range.endContainer, editableDiv);
		if (token) {
			const tokenParent = token.parentElement;
			if (!tokenParent) return -1;
			return visibleLengthBeforePosition(
				editableDiv,
				tokenParent,
				Array.from(tokenParent.childNodes).indexOf(token) + 1,
			);
		}
		caretOffset = visibleLengthBeforePosition(
			editableDiv,
			range.endContainer,
			range.endOffset,
		);
	} else if (
		(document as any).selection &&
		(document as any).selection.type !== 'Control'
	) {
		const textRange = (document as any).selection.createRange();
		const preCaretTextRange = (document.body as any).createTextRange();
		preCaretTextRange.moveToElementText(editableDiv);
		preCaretTextRange.setEndPoint('EndToEnd', textRange);
		caretOffset = stripCaretBoundaries(preCaretTextRange.text).length;
	}

	return caretOffset;
}

export function getRawCaretPositionOfDivEditable(
	editableDiv: HTMLElement,
): number {
	const sel = window.getSelection();
	if (!sel || sel.rangeCount === 0) return -1;

	const range = sel.getRangeAt(0);
	if (!editableDiv.contains(range.endContainer)) return -1;

	const token = closestEndpointRef(range.endContainer, editableDiv);
	if (token) {
		const tokenParent = token.parentElement;
		if (!tokenParent) return -1;
		return rawLengthBeforePosition(
			editableDiv,
			tokenParent,
			Array.from(tokenParent.childNodes).indexOf(token) + 1,
		);
	}

	return rawLengthBeforePosition(
		editableDiv,
		range.endContainer,
		range.endOffset,
	);
}

export function isCaretReportedAtEditableRootStart(
	editableDiv: HTMLElement,
): boolean {
	const sel = window.getSelection();
	if (!sel || sel.rangeCount === 0) return false;

	const range = sel.getRangeAt(0);
	return range.endContainer === editableDiv && range.endOffset === 0;
}

export function getCaretPositionOfDivEditableByPoint(
	editableDiv: HTMLElement,
	x: number,
	y: number,
): number {
	const doc = editableDiv.ownerDocument as Document & {
		caretPositionFromPoint?: (
			x: number,
			y: number,
		) => { offsetNode: Node; offset: number } | null;
		caretRangeFromPoint?: (x: number, y: number) => Range | null;
	};

	const caretPosition = doc.caretPositionFromPoint?.(x, y);
	if (caretPosition && editableDiv.contains(caretPosition.offsetNode)) {
		const token = closestEndpointRef(caretPosition.offsetNode, editableDiv);
		if (token) {
			const tokenParent = token.parentElement;
			if (!tokenParent) return -1;
			return visibleLengthBeforePosition(
				editableDiv,
				tokenParent,
				Array.from(tokenParent.childNodes).indexOf(token) + 1,
			);
		}

		return visibleLengthBeforePosition(
			editableDiv,
			caretPosition.offsetNode,
			caretPosition.offset,
		);
	}

	const caretRange = doc.caretRangeFromPoint?.(x, y);
	if (caretRange && editableDiv.contains(caretRange.endContainer)) {
		const token = closestEndpointRef(caretRange.endContainer, editableDiv);
		if (token) {
			const tokenParent = token.parentElement;
			if (!tokenParent) return -1;
			return visibleLengthBeforePosition(
				editableDiv,
				tokenParent,
				Array.from(tokenParent.childNodes).indexOf(token) + 1,
			);
		}

		return visibleLengthBeforePosition(
			editableDiv,
			caretRange.endContainer,
			caretRange.endOffset,
		);
	}

	return -1;
}

export function getRawCaretPositionOfDivEditableByPoint(
	editableDiv: HTMLElement,
	x: number,
	y: number,
): number {
	const candidates: Array<{ x: number; y: number; raw: number }> = [];
	let raw = 0;

	const addTextCandidates = (node: Text) => {
		const text = node.textContent || '';
		for (let i = 0; i <= text.length; i += 1) {
			const range = document.createRange();
			range.setStart(node, i);
			range.collapse(true);
			const rect = range.getBoundingClientRect();
			range.detach?.();
			if (!rect) continue;

			const textBefore = stripCaretBoundaries(text.slice(0, i)).length;
			candidates.push({
				x: rect.left,
				y: rect.top + rect.height / 2,
				raw: raw + textBefore,
			});
		}
		raw += stripCaretBoundaries(text).length;
	};

	const walk = (parent: Node) => {
		for (const child of Array.from(parent.childNodes)) {
			if (child.nodeType === Node.TEXT_NODE) {
				addTextCandidates(child as Text);
				continue;
			}

			if (isEndpointRefElement(child)) {
				const rect = (child as HTMLElement).getBoundingClientRect();
				const tokenRawLength = (child as HTMLElement).getAttribute('data-main')?.length || 0;
				candidates.push({
					x: rect.left,
					y: rect.top + rect.height / 2,
					raw,
				});
				candidates.push({
					x: rect.right,
					y: rect.top + rect.height / 2,
					raw: raw + tokenRawLength,
				});
				raw += tokenRawLength;
				continue;
			}

			walk(child);
		}
	};

	walk(editableDiv);
	if (!candidates.length) return 0;

	const sameLine = candidates.filter((candidate) => Math.abs(candidate.y - y) < 16);
	const scope = sameLine.length ? sameLine : candidates;
	const last = scope[scope.length - 1];
	if (x >= last.x) return last.raw;

	return scope.reduce((best, candidate) => {
		const distance = Math.abs(candidate.x - x) + Math.abs(candidate.y - y);
		const bestDistance = Math.abs(best.x - x) + Math.abs(best.y - y);
		return distance < bestDistance ? candidate : best;
	}).raw;
}

export function setFocusByCaretPositionInDivEditable(
	elem: HTMLElement | null,
	caretPosition: number
): void {
	if (!elem || caretPosition < 0) return;

	const range = document.createRange();
	const sel = window.getSelection();
	if (!sel) return;

	elem.focus();
	setRangeByVisibleOffset(range, elem, caretPosition);
	range.collapse(true);
	sel.removeAllRanges();
	sel.addRange(range);
}
