import { BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DeleteIconButton } from '@shared/ui/actions/DeleteIconButton';
import { Tooltip } from '@shared/ui/primitives/Tooltip';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { WorkflowEdgeModel } from '../../types/workflow.types';
import { WorkflowEdgeMarkers } from '../WorkflowEdge/WorkflowEdgeMarkers';
import { getWorkflowEdgeLabelPoint, getWorkflowEdgePath } from '../WorkflowEdge/workflowEdge.utils';

// The delete control lives in the edge-label layer, i.e. outside this edge's own
// <g>, so moving the pointer from the line onto the button fires the line's
// mouseleave first and would unmount the button before it can be clicked.
// Hiding on a short delay (cancelled when the button itself is entered) keeps
// the two hover surfaces continuous.
const HIDE_DELAY_MS = 160;

/**
 * A joint (`node.data.jumpTo`) rendered with the exact path geometry, gap and
 * arrow marker of every other workflow edge, distinguished only by colour, and
 * carrying a hover-revealed delete button at its midpoint.
 */
export function JointEdge(props: EdgeProps<WorkflowEdgeModel>) {
	const { id, sourceX, sourceY, data } = props;
	const { t } = useI18n('workflow');
	const [isHovered, setIsHovered] = useState(false);
	const hideTimerRef = useRef<number | undefined>(undefined);

	const show = useCallback(() => {
		window.clearTimeout(hideTimerRef.current);
		setIsHovered(true);
	}, []);
	const hide = useCallback(() => {
		window.clearTimeout(hideTimerRef.current);
		hideTimerRef.current = window.setTimeout(() => setIsHovered(false), HIDE_DELAY_MS);
	}, []);
	useEffect(() => () => window.clearTimeout(hideTimerRef.current), []);

	const { labelX, labelY } = getWorkflowEdgeLabelPoint(props, false);
	const sourceNodeId = data?.jointSourceNodeId;
	const onRemoveJoint = data?.onRemoveJoint;
	const canRemove = !!sourceNodeId && !!onRemoveJoint;

	return (
		<g onMouseEnter={show} onMouseLeave={hide}>
			<circle cx={sourceX} cy={sourceY} r={3} className='edgeStartPoint edgeStartPointJoint' />

			<BaseEdge
				id={String(id)}
				path={getWorkflowEdgePath(props, false)}
				markerEnd='url(#workflow-arrow-joint)'
				className='workflowEdgePath workflowEdgePathJoint'
				// Inline, not only via the class: xyflow paints a selected edge with
				// its own `--xy-edge-stroke-selected` from a two-class selector that
				// would otherwise win once the joint has been clicked.
				style={{ stroke: 'var(--color-status-success-fg)' }}
				interactionWidth={24}
			/>

			{canRemove && isHovered && (
				<EdgeLabelRenderer>
					<div
						className='jointEdgeToolbar nodrag nopan'
						style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
						onMouseEnter={show}
						onMouseLeave={hide}
					>
						<Tooltip content={t('actions.removeJoint')}>
							<DeleteIconButton
								iconSize={14}
								onClick={() => onRemoveJoint?.(sourceNodeId!)}
								testId={`workflow-joint-remove-${sourceNodeId}`}
							/>
						</Tooltip>
					</div>
				</EdgeLabelRenderer>
			)}

			<WorkflowEdgeMarkers />
		</g>
	);
}
