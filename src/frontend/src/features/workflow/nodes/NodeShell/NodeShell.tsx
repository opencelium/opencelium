import type { MouseEvent } from 'react';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { NodeToolbar } from '../../components/node/NodeToolbar/NodeToolbar';
import { useJointRejectionMessage } from '../../hooks/useJointRejectionMessage';
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
	const jointRejection = useJointRejectionMessage(data.jointInvalidReason, data.jointBlockingLabel);
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

	const nodeBody = (
		<div
			className={`nodeBody ${selected ? 'nodeBodySelected' : ''} ${data.highlighted ? 'nodeBodyHighlighted' : ''} ${data.dropTarget ? 'nodeBodyDropTarget' : ''} ${data.dropInvalid ? 'nodeBodyDropInvalid' : ''} ${data.hasError || data.testRunFailedVisible ? 'nodeBodyError' : ''} ${data.testRunFailedVisible ? 'nodeBodyTestRunFailed' : ''} ${data.searchHighlighted ? 'nodeBodySearchHighlighted' : ''} ${data.testRunActive ? 'nodeBodyTestRunActive' : ''} ${data.jointCandidate ? 'nodeBodyJointCandidate' : ''} ${data.jointSource ? 'nodeBodyJointSource' : ''} ${jointRejection ? 'nodeBodyJointInvalid' : ''}`}
			title={data.hasError ? data.errorMessage : data.testRunFailedVisible ? data.testRunFailedMessage : undefined}
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
	);

	return (
		<div
			className={`nodeWrap ${data.dragGhost ? 'nodeWrapDragGhost' : ''} ${data.dropPlaceholder ? 'nodeWrapDropPlaceholder' : ''} ${data.dragSourceMoving ? 'nodeWrapDragSourceMoving' : ''} ${data.dragSourceFaint ? 'nodeWrapDragSourceFaint' : ''}`}
			onContextMenu={onContextMenu}
		>
			{selected && (data.onDeleteNode || data.onRemoveJoint) && (
				<NodeToolbar
					canDelete={data.kind !== 'start' && !!data.onDeleteNode}
					onDelete={() => data.onDeleteNode?.(id)}
					canRemoveJoint={Boolean(data.jump) && !!data.onRemoveJoint}
					onRemoveJoint={() => data.onRemoveJoint?.(id)}
				/>
			)}
			{topLabel && <div className='nodeTopLabel'>{topLabel}</div>}
			{jointRejection ? <Tooltip content={jointRejection}>{nodeBody}</Tooltip> : nodeBody}
			{bottomLabel && <div className='nodeBottomLabel'>{bottomLabel}</div>}
			{bottomExtra}
		</div>
	);
}
