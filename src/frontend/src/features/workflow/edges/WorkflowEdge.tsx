import { BaseEdge, getBezierPath, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { WorkflowEdgeModel } from '../types/workflow.types';

export function WorkflowEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	data,
}: EdgeProps<WorkflowEdgeModel>) {
	const isIfBranch = data?.branch === 'true' || data?.branch === 'false';
	const isHighlighted = !!data?.highlighted;

	const GAP = 3;

	let adjustedTargetX = targetX;
	let adjustedTargetY = targetY;

	if (targetPosition === 'left') {
		adjustedTargetX = targetX + GAP;
	}

	if (targetPosition === 'right') {
		adjustedTargetX = targetX - GAP;
	}

	if (targetPosition === 'top') {
		adjustedTargetY = targetY + GAP;
	}

	if (targetPosition === 'bottom') {
		adjustedTargetY = targetY - GAP;
	}

	const [path] = isIfBranch
		? getSmoothStepPath({
				sourceX,
				sourceY,
				targetX: adjustedTargetX,
				targetY: adjustedTargetY,
				sourcePosition,
				targetPosition,
				borderRadius: 18,
				offset: 18,
			})
		: getBezierPath({
				sourceX,
				sourceY,
				targetX: adjustedTargetX,
				targetY: adjustedTargetY,
				sourcePosition,
				targetPosition,
			});

	return (
		<>
			<circle
				cx={sourceX}
				cy={sourceY}
				r={3}
				className={`edgeStartPoint ${isHighlighted ? 'edgeStartPointHighlighted' : ''}`}
			/>

			<BaseEdge
				id={String(id)}
				path={path}
				markerEnd={
					isHighlighted
						? 'url(#workflow-arrow-highlighted)'
						: 'url(#workflow-arrow)'
				}
				className={`workflowEdgePath ${isHighlighted ? 'workflowEdgePathHighlighted' : ''}`}
				style={
					isHighlighted
						? {
								stroke: 'var(--color-action-primary)',
								color: 'var(--color-action-primary)',
							}
						: undefined
				}
			/>

			<svg width='0' height='0'>
				<defs>
					<marker
						id='workflow-arrow'
						markerWidth='10'
						markerHeight='10'
						refX='10'
						refY='3'
						orient='auto'
						markerUnits='userSpaceOnUse'
					>
						<path d='M0,0 L0,6 L10,3 z' className='workflowArrowMarker' />
					</marker>
					<marker
						id='workflow-arrow-highlighted'
						markerWidth='10'
						markerHeight='10'
						refX='10'
						refY='3'
						orient='auto'
						markerUnits='userSpaceOnUse'
					>
						<path d='M0,0 L0,6 L10,3 z' className='workflowArrowMarkerHighlighted' />
					</marker>
				</defs>
			</svg>
		</>
	);
}
