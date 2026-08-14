import { BaseEdge } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { WorkflowEdgeModel } from '../../types/workflow.types';
import { WorkflowEdgeMarkers } from './WorkflowEdgeMarkers';
import { getWorkflowEdgePath, getWorkflowEdgeStyle } from './workflowEdge.utils';

export function WorkflowEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	data,
    ...pathProps
}: EdgeProps<WorkflowEdgeModel>) {
	const isIfBranch = data?.branch === 'true' || data?.branch === 'false';
	const isHighlighted = !!data?.highlighted;
	const edgeProps = { id, sourceX, sourceY, targetX, targetY, sourcePosition,
		targetPosition, data, ...pathProps } as EdgeProps<WorkflowEdgeModel>;
	const path = getWorkflowEdgePath(edgeProps, isIfBranch);

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
				style={getWorkflowEdgeStyle(data, isHighlighted)}
			/>
			<WorkflowEdgeMarkers />
		</>
	);
}
