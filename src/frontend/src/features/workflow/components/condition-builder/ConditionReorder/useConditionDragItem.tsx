import type { DragEvent, HTMLAttributes, ReactNode } from 'react';
import type { ConditionDropTarget } from '../conditionBuilder.utils';
import { ConditionDragHandle } from './ConditionDragHandle';
import { getGroupDropTarget, getRuleDropTarget } from './conditionDropPlacement';
import { CONDITION_ID_ATTRIBUTE, useConditionReorderState } from './conditionReorderContext';

type ConditionDragItemTarget = { kind: 'rule' | 'group'; id: string };

export type ConditionDragItem = {
	className: string;
	itemProps: Pick<HTMLAttributes<HTMLDivElement>, 'onDragOver' | 'onDragLeave' | 'onDrop'>
		& { [CONDITION_ID_ATTRIBUTE]: string };
	handle: ReactNode;
};

const resolveTarget = (
	event: DragEvent<HTMLElement>,
	item: ConditionDragItemTarget,
	isRoot: boolean,
): ConditionDropTarget => item.kind === 'rule'
	? getRuleDropTarget(event, item.id)
	: getGroupDropTarget(event, item.id, isRoot);

export const useConditionDragItem = (item: ConditionDragItemTarget): ConditionDragItem | undefined => {
	const state = useConditionReorderState();
	if (!state?.canReorder) return undefined;
	const { draggedId, dropTarget } = state;
	const isRoot = item.id === state.rootId;

	const onDragOver = (event: DragEvent<HTMLDivElement>) => {
		if (!draggedId) return;
		event.stopPropagation();
		const target = resolveTarget(event, item, isRoot);
		if (target.id === draggedId || !state.isValidTarget(target)) {
			state.updateDropTarget(null);
			return;
		}
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
		state.updateDropTarget(target);
	};
	// Only the root clears: leaving a nested item always lands on an ancestor,
	// whose own dragover picks the next target.
	const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
		if (!isRoot || event.currentTarget.contains(event.relatedTarget as Node | null)) return;
		state.updateDropTarget(null);
	};
	const onDrop = (event: DragEvent<HTMLDivElement>) => {
		if (!draggedId) return;
		event.preventDefault();
		event.stopPropagation();
		state.drop();
	};
	const classNames = [
		draggedId === item.id ? 'conditionDragging' : '',
		dropTarget?.id === item.id ? `conditionDrop-${dropTarget.placement}` : '',
	].filter(Boolean);
	return {
		className: classNames.join(' '),
		itemProps: { onDragOver, onDragLeave, onDrop, [CONDITION_ID_ATTRIBUTE]: item.id },
		handle: isRoot ? null
			: <ConditionDragHandle onDragStart={() => state.startDrag(item.id)} onDragEnd={state.endDrag} />,
	};
};
