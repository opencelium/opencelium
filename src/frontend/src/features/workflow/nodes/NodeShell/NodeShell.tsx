import type { MouseEvent } from 'react';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { NodeToolbar } from '../../components/node/NodeToolbar/NodeToolbar';
import { useBindingLensNode } from '../../lens/BindingLensNodeContext';
import { useJointRejectionMessage } from '../../hooks/useJointRejectionMessage';
import { AddStepTrigger } from '../AddStepTrigger/AddStepTrigger';
import { BindingBadge } from '../BindingBadge/BindingBadge';
import { CommentBadge } from '../CommentBadge/CommentBadge';
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
	const isMethodNode = data.kind === 'connector' || data.kind === 'system';
	const bindingLens = useBindingLensNode();
	const isPreview = !!data.dragGhost || !!data.dropPlaceholder;
	// While one method's bindings are being read, every method outside them steps
	// back: the focused view exists because all of them at once cannot be read.
	const lensDimmed = !!bindingLens?.focusNodeId
		&& bindingLens.focusNodeId !== id
		&& !bindingLens.relatedNodeIds.has(id);
	// The card sits directly under the node and names the method in its own header,
	// so the label would be the same text twice, half of it behind the card.
	const hasBindingCard = !!bindingLens?.cardNodeIds.has(id);
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
			{/* Not gated on the node's kind: the badge is there for whatever the
			    binding graph found bindings on — a webhook step counts as a method
			    to the reference layer too (see resolveMethodIdentities) — and
			    BindingBadge renders nothing without them. */}
			{!isPreview && <BindingBadge nodeId={id} suppressTooltip={data.isAnyNodeDragging} />}
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
			className={`nodeWrap ${lensDimmed ? 'nodeWrapLensDimmed' : ''} ${data.dragGhost ? 'nodeWrapDragGhost' : ''} ${data.dropPlaceholder ? 'nodeWrapDropPlaceholder' : ''} ${data.dragSourceMoving ? 'nodeWrapDragSourceMoving' : ''} ${data.dragSourceFaint ? 'nodeWrapDragSourceFaint' : ''}`}
			onContextMenu={onContextMenu}
		>
			{selected && (
				<NodeToolbar
					canDelete={data.kind !== 'start' && !!data.onDeleteNode}
					/* Only offered while the node has no note: an existing one is shown or
					   hidden from its own badge, so this action never no-ops. */
					canComment={!data.anchoredComment && !!data.onAddComment}
					/* Only a method can be a joint's source, and only one joint per
					   node — an existing one is replaced from its own remove action,
					   so these two are never offered together. */
					canAddJoint={isMethodNode && !data.jump && !!data.onAddJoint}
					canRemoveJoint={Boolean(data.jump) && !!data.onRemoveJoint}
					onDelete={() => data.onDeleteNode?.(id)}
					onComment={() => data.onAddComment?.(id)}
					onAddJoint={() => data.onAddJoint?.(id)}
					onRemoveJoint={() => data.onRemoveJoint?.(id)}
				/>
			)}
			{topLabel && <div className='nodeTopLabel'>{topLabel}</div>}
			{jointRejection ? <Tooltip content={jointRejection}>{nodeBody}</Tooltip> : nodeBody}
			{/* Hosted here rather than per node type: the badge is the same for a
			    method, an operator or the start node. It hangs off the outer wrap's
			    top-right corner rather than the node body's, which keeps it clear of
			    the duplicate-method colour badge that hugs that same corner. */}
			{!isPreview && (
				<CommentBadge
					anchoredComment={data.anchoredComment}
					suppressTooltip={data.isAnyNodeDragging}
					testId={`workflow-node-comment-toggle-${id}`}
					onToggleComment={data.onToggleComment}
				/>
			)}
			{bottomLabel && !hasBindingCard && (
				<div className='nodeBottomLabel'>{bottomLabel}</div>
			)}
			{bottomExtra}
		</div>
	);
}
