import type { DragEvent } from 'react';
import { Icon } from '@shared/ui/primitives/Icon';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { CONDITION_ID_ATTRIBUTE } from './conditionReorderContext';

type Props = {
	onDragStart: () => void;
	onDragEnd: () => void;
};

export function ConditionDragHandle({ onDragStart, onDragEnd }: Props) {
	const { t } = useI18n('workflow');
	const handleDragStart = (event: DragEvent<HTMLSpanElement>) => {
		event.stopPropagation();
		event.dataTransfer.effectAllowed = 'move';
		// Firefox refuses to start a drag without any payload.
		event.dataTransfer.setData('text/plain', '');
		const row = event.currentTarget.closest(`[${CONDITION_ID_ATTRIBUTE}]`);
		if (row instanceof HTMLElement) {
			const handleRect = event.currentTarget.getBoundingClientRect();
			const rowRect = row.getBoundingClientRect();
			event.dataTransfer.setDragImage(row, handleRect.left - rowRect.left + 7, handleRect.top - rowRect.top + 7);
		}
		onDragStart();
	};
	const label = t('conditionBuilder.dragToReorder');
	// A native title instead of the Tooltip primitive: an antd tooltip stays pinned
	// over the dialog for the whole drag because no mouseleave fires until drop.
	return (
		<span
			className="conditionDragHandle"
			draggable
			title={label}
			aria-label={label}
			data-testid="workflow-condition-drag-handle"
			onDragStart={handleDragStart}
			onDragEnd={onDragEnd}
		>
			<Icon name="drag-handle" size={14} isSubtle />
		</span>
	);
}
