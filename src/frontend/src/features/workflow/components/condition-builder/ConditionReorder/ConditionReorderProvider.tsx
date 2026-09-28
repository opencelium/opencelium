import { useState, type ReactNode } from 'react';
import type { ConditionChild, ConditionGroup } from '../conditionBuilder.types';
import {
	containsConditionId,
	findConditionChild,
	moveConditionChild,
	type ConditionDropTarget,
} from '../conditionBuilder.utils';
import { ConditionReorderContext, type ConditionReorderState } from './conditionReorderContext';

type Props = {
	tree: ConditionGroup;
	isEnabled: boolean;
	onChange: (tree: ConditionGroup) => void;
	children: ReactNode;
};

const countChildren = (items: ConditionChild[] = []): number => items.reduce(
	(total, child) => total + 1 + (child.type === 'group' ? countChildren(child.items) : 0), 0);

const isSameTarget = (a: ConditionDropTarget | null, b: ConditionDropTarget | null) =>
	a?.id === b?.id && a?.placement === b?.placement;

export function ConditionReorderProvider({ tree, isEnabled, onChange, children }: Props) {
	const [draggedId, setDraggedId] = useState<string | null>(null);
	const [dropTarget, setDropTarget] = useState<ConditionDropTarget | null>(null);
	const endDrag = () => {
		setDraggedId(null);
		setDropTarget(null);
	};
	const value: ConditionReorderState = {
		canReorder: isEnabled && countChildren(tree.items) > 1,
		rootId: tree.id,
		draggedId,
		dropTarget,
		startDrag: setDraggedId,
		endDrag,
		updateDropTarget: (target) => {
			if (!isSameTarget(target, dropTarget)) setDropTarget(target);
		},
		isValidTarget: (target) => {
			const dragged = draggedId ? findConditionChild(tree, draggedId) : undefined;
			return !!dragged && !containsConditionId(dragged, target.id);
		},
		drop: () => {
			if (draggedId && dropTarget) onChange(moveConditionChild(tree, draggedId, dropTarget));
			endDrag();
		},
	};
	return <ConditionReorderContext.Provider value={value}>{children}</ConditionReorderContext.Provider>;
}
