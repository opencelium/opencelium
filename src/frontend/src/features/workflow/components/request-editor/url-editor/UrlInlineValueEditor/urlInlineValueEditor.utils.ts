export const INLINE_REFERENCE_CLASS = 'oc-endpoint-ref';

export const getContentRightEdge = (root: HTMLElement) => {
	const rects: DOMRect[] = [];
	root.childNodes.forEach((child) => {
		if (child instanceof HTMLElement) {
			rects.push(child.getBoundingClientRect());
			return;
		}
		if (child.nodeType === Node.TEXT_NODE) {
			const range = document.createRange();
			range.selectNodeContents(child);
			rects.push(...Array.from(range.getClientRects()));
			range.detach?.();
		}
	});
	const visibleRects = rects.filter((rect) => rect.width > 0 || rect.height > 0);
	return visibleRects.length ? Math.max(...visibleRects.map((rect) => rect.right)) : null;
};
