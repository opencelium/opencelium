export const TOKEN_CLASS = 'oc-endpoint-ref';
export const CARET_BOUNDARY = '\u200B';

export const stripCaretBoundaries = (text: string) => text.replace(/\u200B/g, '');

export const isEndpointRefElement = (node: Node): node is HTMLElement =>
	node.nodeType === Node.ELEMENT_NODE &&
	(node as HTMLElement).classList.contains(TOKEN_CLASS);

export const closestEndpointRef = (node: Node | null, root: HTMLElement) => {
	const element = node?.nodeType === Node.ELEMENT_NODE
		? node as HTMLElement
		: node?.parentElement;
	const token = element?.closest?.(`.${TOKEN_CLASS}`) as HTMLElement | null;
	return token && root.contains(token) ? token : null;
};

type LengthMode = 'visible' | 'raw';

export const contentLength = (node: Node, mode: LengthMode): number => {
	if (node.nodeType === Node.TEXT_NODE) {
		return stripCaretBoundaries(node.textContent || '').length;
	}
	if (isEndpointRefElement(node)) {
		return mode === 'raw'
			? (node.getAttribute('data-main') || '').length
			: stripCaretBoundaries(node.textContent || '').length;
	}
	return Array.from(node.childNodes)
		.reduce((sum, child) => sum + contentLength(child, mode), 0);
};

const lengthBeforeElementOffset = (element: Element, offset: number, mode: LengthMode) =>
	Array.from(element.childNodes).slice(0, Math.max(0, offset))
		.reduce((sum, child) => sum + contentLength(child, mode), 0);

export const lengthBeforePosition = (
	root: HTMLElement,
	container: Node,
	offset: number,
	mode: LengthMode,
): number => {
	if (container === root) return lengthBeforeElementOffset(root, offset, mode);
	let total = 0;
	let found = false;
	const walk = (parent: Node): void => {
		if (found) return;
		for (const child of Array.from(parent.childNodes)) {
			if (child === container) {
				if (child.nodeType === Node.TEXT_NODE) {
					total += stripCaretBoundaries((child.textContent || '').slice(0, Math.max(0, offset))).length;
				} else if (child.nodeType === Node.ELEMENT_NODE) {
					total += lengthBeforeElementOffset(child as Element, offset, mode);
				}
				found = true;
				return;
			}
			if (child.nodeType === Node.ELEMENT_NODE && (child as Element).contains(container)) {
				walk(child);
				return;
			}
			total += contentLength(child, mode);
		}
	};
	walk(root);
	return found ? total : -1;
};

const textOffsetFromVisibleOffset = (text: string, visibleOffset: number) => {
	if (visibleOffset <= 0) return 0;
	let visible = 0;
	for (let index = 0; index < text.length; index += 1) {
		if (text[index] === CARET_BOUNDARY) continue;
		visible += 1;
		if (visible >= visibleOffset) return index + 1;
	}
	return text.length;
};

export const setRangeByVisibleOffset = (range: Range, parent: Node, offset: number): boolean => {
	let remaining = Math.max(0, offset);
	for (const child of Array.from(parent.childNodes)) {
		const length = contentLength(child, 'visible');
		if (child.nodeType === Node.TEXT_NODE) {
			if (remaining <= length) {
				range.setStart(child, textOffsetFromVisibleOffset(child.textContent || '', remaining));
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
		if (remaining <= length && setRangeByVisibleOffset(range, child, remaining)) return true;
		remaining -= length;
	}
	range.setStart(parent, parent.childNodes.length);
	return true;
};
