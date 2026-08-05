import type { MouseEvent } from 'react';
import { NodeToolbar } from '../../components/node/NodeToolbar/NodeToolbar';
import { AddStepTrigger } from '../AddStepTrigger/AddStepTrigger';
import type { NodeShellProps } from './NodeShell.types';

export function NodeShell({
	id,
	data,
	selected,
	topLabel,
	bottomLabel,
	bottomExtra,
	rightAdd,
	bottomAdd,
	children,
}: NodeShellProps) {
	const onAddStep = data.onAddStep;
	const onContextMenu = (event: MouseEvent<HTMLDivElement>) => {
		if (data.dragGhost || data.dropPlaceholder) return;
		if (event.ctrlKey) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		if (data.kind === 'start') return;
		event.preventDefault();
		data.onOpenContextMenu?.({ nodeId: id, x: event.clientX, y: event.clientY, kind: data.kind });
	};
	const showRightAddTrigger =
		!!rightAdd &&
		!!onAddStep &&
		(!data.hideAddControls || rightAdd.showAlways) &&
		!(data.suppressHoverAddControls && !rightAdd.showAlways);
	const showBottomAddTrigger =
		!!bottomAdd &&
		!!onAddStep &&
		(!data.hideAddControls || bottomAdd.showAlways) &&
		!(data.suppressHoverAddControls && !bottomAdd.showAlways);

	return (
		<div
			className={`nodeWrap ${data.dragGhost ? 'nodeWrapDragGhost' : ''} ${data.dropPlaceholder ? 'nodeWrapDropPlaceholder' : ''} ${data.dragSourceMoving ? 'nodeWrapDragSourceMoving' : ''} ${data.dragSourceFaint ? 'nodeWrapDragSourceFaint' : ''}`}
			onContextMenu={onContextMenu}
		>
			{selected && <NodeToolbar canDelete={data.kind !== 'start'} onDelete={() => data.onDeleteNode?.(id)} />}
			{topLabel && <div className='nodeTopLabel'>{topLabel}</div>}
			<div
				className={`nodeBody ${selected ? 'nodeBodySelected' : ''} ${data.highlighted ? 'nodeBodyHighlighted' : ''} ${data.dropTarget ? 'nodeBodyDropTarget' : ''} ${data.dropInvalid ? 'nodeBodyDropInvalid' : ''} ${data.hasError || data.testRunFailed ? 'nodeBodyError' : ''} ${data.searchHighlighted ? 'nodeBodySearchHighlighted' : ''} ${data.testRunActive ? 'nodeBodyTestRunActive' : data.testRunInScope ? 'nodeBodyTestRunScope' : ''}`}
				title={data.hasError ? data.errorMessage : data.testRunFailed ? data.testRunFailedMessage : undefined}
			>
				{children}
				{showRightAddTrigger && rightAdd && onAddStep && (
					<AddStepTrigger
						direction='right'
						action={rightAdd.action}
						showAlways={rightAdd.showAlways}
						lineVisible={rightAdd.lineVisible}
						locked={data.lockVisibleAddControls && !!rightAdd.showAlways}
						onAdd={onAddStep}
					/>
				)}
				{showBottomAddTrigger && bottomAdd && onAddStep && (
					<AddStepTrigger
						direction='bottom'
						action={bottomAdd.action}
						showAlways={bottomAdd.showAlways}
						lineVisible={bottomAdd.lineVisible}
						locked={data.lockVisibleAddControls && !!bottomAdd.showAlways}
						onAdd={onAddStep}
					/>
				)}
			</div>
			{bottomLabel && <div className='nodeBottomLabel'>{bottomLabel}</div>}
			{bottomExtra}
		</div>
	);
}
