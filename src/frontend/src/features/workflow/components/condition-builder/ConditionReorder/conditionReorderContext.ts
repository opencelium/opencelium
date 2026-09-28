import { createContext, useContext } from 'react';
import type { ConditionDropTarget } from '../conditionBuilder.utils';

export const CONDITION_ID_ATTRIBUTE = 'data-condition-id';

export type ConditionReorderState = {
	canReorder: boolean;
	rootId: string;
	draggedId: string | null;
	dropTarget: ConditionDropTarget | null;
	startDrag: (id: string) => void;
	endDrag: () => void;
	updateDropTarget: (target: ConditionDropTarget | null) => void;
	isValidTarget: (target: ConditionDropTarget) => boolean;
	drop: () => void;
};

export const ConditionReorderContext = createContext<ConditionReorderState | null>(null);

export const useConditionReorderState = () => useContext(ConditionReorderContext);
