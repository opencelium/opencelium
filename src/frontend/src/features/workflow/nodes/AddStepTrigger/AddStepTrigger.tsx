import { Plus } from 'lucide-react';
import { buildTestId } from '@shared/testing/testId';
import type { MouseEvent } from 'react';
import type { AddStepTriggerProps } from './AddStepTrigger.types';

export function AddStepTrigger({
	direction,
	action,
	showAlways,
	lineVisible = true,
	locked = false,
	onAdd,
}: AddStepTriggerProps) {
	const onClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		onAdd(action);
	};
	const triggerClass = direction === 'right' ? 'addTriggerRight' : 'addTriggerBottom';
	const displayClass = showAlways ? 'always' : 'hoverOnly';
	const modeClass = lineVisible ? 'withLine' : 'circleOnly';
	const lockedClass = locked ? 'addTriggerLocked' : '';

	return (
		<button
			className={`addTrigger nodrag nopan ${triggerClass} ${displayClass} ${modeClass} ${lockedClass}`}
			onClick={onClick}
			type='button'
			// One of these exists per insertion point, so the direction is part of the
			// id: on an operator, `bottom` is the one that adds *into* its scope while
			// `right` continues past it. Scope it to a node's own id to address one.
			data-testid={buildTestId('workflow-add-step', direction)}
		>
			{lineVisible && <span className='addLine' />}
			<span className='addCircle'>
				<Plus size={14} />
			</span>
		</button>
	);
}
