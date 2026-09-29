import type { DragEvent } from 'react';
import type { ConditionDropTarget } from '../conditionBuilder.utils';
import { CONDITION_ID_ATTRIBUTE } from './conditionReorderContext';

const GROUP_EDGE_BEFORE_PX = 16;
const GROUP_EDGE_AFTER_PX = 12;

const byMidpoint = (id: string, rect: DOMRect, clientY: number): ConditionDropTarget => ({
	id, placement: clientY < rect.top + rect.height / 2 ? 'before' : 'after',
});

export const getRuleDropTarget = (event: DragEvent<HTMLElement>, id: string) =>
	byMidpoint(id, event.currentTarget.getBoundingClientRect(), event.clientY);

// The pointer reaches a group's own handler only over its chrome (header, padding,
// gaps between children) — the children stop propagation over themselves. The top
// and bottom edges of a nested group place relative to the group itself, the header
// drops into it, and a gap between children resolves to the nearest child.
export const getGroupDropTarget = (
	event: DragEvent<HTMLElement>,
	id: string,
	isRoot: boolean,
): ConditionDropTarget => {
	const rect = event.currentTarget.getBoundingClientRect();
	const y = event.clientY;
	if (!isRoot && y < rect.top + GROUP_EDGE_BEFORE_PX) return { id, placement: 'before' };
	if (!isRoot && y > rect.bottom - GROUP_EDGE_AFTER_PX) return { id, placement: 'after' };
	const body = event.currentTarget.querySelector(':scope > .conditionGroupBody');
	if (!(body instanceof HTMLElement) || y < body.getBoundingClientRect().top) return { id, placement: 'inside' };
	const children = Array.from(body.children).filter((child): child is HTMLElement =>
		child instanceof HTMLElement && child.hasAttribute(CONDITION_ID_ATTRIBUTE));
	const next = children.find((child) => {
		const childRect = child.getBoundingClientRect();
		return y < childRect.top + childRect.height / 2;
	});
	const anchor = next ?? children[children.length - 1];
	const anchorId = anchor?.getAttribute(CONDITION_ID_ATTRIBUTE);
	if (!anchor || !anchorId) return { id, placement: 'inside' };
	return { id: anchorId, placement: next ? 'before' : 'after' };
};
