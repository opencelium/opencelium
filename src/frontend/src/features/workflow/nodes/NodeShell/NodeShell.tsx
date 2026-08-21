import type { MouseEvent } from 'react';
import { NodeToolbar } from '../../components/node/NodeToolbar/NodeToolbar';
import { AddStepTrigger } from '../AddStepTrigger/AddStepTrigger';
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
			{selected && (
				<NodeToolbar
					canDelete={data.kind !== 'start' && !!data.onDeleteNode}
					/* Only offered while the node has no note: an existing one is shown or
					   hidden from its own badge, so this action never no-ops. */
					canComment={!data.anchoredComment && !!data.onAddComment}
					canRemoveJoint={Boolean(data.jump) && !!data.onRemoveJoint}
					onDelete={() => data.onDeleteNode?.(id)}
					onComment={() => data.onAddComment?.(id)}
					onRemoveJoint={() => data.onRemoveJoint?.(id)}
				/>
			)}
			{topLabel && <div className='nodeTopLabel'>{topLabel}</div>}
			{jointRejection ? <Tooltip content={jointRejection}>{nodeBody}</Tooltip> : nodeBody}
			{/* Hosted here rather than per node type: the badge is the same for a
			    method, an operator or the start node. It hangs off the outer wrap's
			    top-right corner rather than the node body's, which keeps it clear of
			    the duplicate-method colour badge that hugs that same corner. */}
			{!data.dragGhost && !data.dropPlaceholder && (
				<CommentBadge
					anchoredComment={data.anchoredComment}
					suppressTooltip={data.isAnyNodeDragging}
					testId={`workflow-node-comment-toggle-${id}`}
					onToggleComment={data.onToggleComment}
				/>
			)}
			{bottomLabel && <div className='nodeBottomLabel'>{bottomLabel}</div>}
			{bottomExtra}
		</div>
	);
}
