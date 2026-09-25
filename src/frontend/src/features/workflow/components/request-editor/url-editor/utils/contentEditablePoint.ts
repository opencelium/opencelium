import {
	closestEndpointRef,
	isEndpointRefElement,
	lengthBeforePosition,
	stripCaretBoundaries,
} from './contentEditableDom';

const positionFromRange = (root: HTMLElement, container: Node, offset: number) => {
	const token = closestEndpointRef(container, root);
	if (!token) return lengthBeforePosition(root, container, offset, 'visible');
	const parent = token.parentElement;
	return parent
		? lengthBeforePosition(root, parent, Array.from(parent.childNodes).indexOf(token) + 1, 'visible')
		: -1;
};

export function getCaretPositionOfDivEditableByPoint(
	editableDiv: HTMLElement,
	x: number,
	y: number,
): number {
	const doc = editableDiv.ownerDocument as Document & {
		caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
		caretRangeFromPoint?: (x: number, y: number) => Range | null;
	};
	const position = doc.caretPositionFromPoint?.(x, y);
	if (position && editableDiv.contains(position.offsetNode)) {
		return positionFromRange(editableDiv, position.offsetNode, position.offset);
	}
	const range = doc.caretRangeFromPoint?.(x, y);
	if (range && editableDiv.contains(range.endContainer)) {
		return positionFromRange(editableDiv, range.endContainer, range.endOffset);
	}
	return -1;
}

type PointCandidate = { x: number; y: number; raw: number };

export function getRawCaretPositionOfDivEditableByPoint(
	editableDiv: HTMLElement,
	x: number,
	y: number,
): number {
	const candidates: PointCandidate[] = [];
	let raw = 0;
	const addTextCandidates = (node: Text) => {
		const text = node.textContent || '';
		for (let index = 0; index <= text.length; index += 1) {
			const range = document.createRange();
			range.setStart(node, index);
			range.collapse(true);
			const rect = range.getBoundingClientRect();
			range.detach?.();
			if (!rect) continue;
			candidates.push({
				x: rect.left,
				y: rect.top + rect.height / 2,
				raw: raw + stripCaretBoundaries(text.slice(0, index)).length,
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
				const rect = child.getBoundingClientRect();
				const tokenLength = child.getAttribute('data-main')?.length || 0;
				candidates.push({ x: rect.left, y: rect.top + rect.height / 2, raw });
				candidates.push({ x: rect.right, y: rect.top + rect.height / 2, raw: raw + tokenLength });
				raw += tokenLength;
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
