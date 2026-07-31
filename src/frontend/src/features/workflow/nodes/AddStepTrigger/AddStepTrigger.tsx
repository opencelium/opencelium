import { Plus } from 'lucide-react';
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
		>
			{lineVisible && <span className='addLine' />}
			<span className='addCircle'>
				<Plus size={14} />
			</span>
		</button>
	);
}
