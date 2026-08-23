import { BaseEdge } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import type { WorkflowEdgeModel } from '../../types/workflow.types';
import { JointEdge } from '../JointEdge/JointEdge';
import { WorkflowEdgeFlowDot } from './WorkflowEdgeFlowDot';
import { WorkflowEdgeMarkers } from './WorkflowEdgeMarkers';
import {
	getWorkflowEdgeDotPath,
	getWorkflowEdgePath,
	getWorkflowEdgeStyle,
} from './workflowEdge.utils';

export function WorkflowEdge(props: EdgeProps<WorkflowEdgeModel>) {
	const { id, sourceX, sourceY, data } = props;
	const isHighlighted = !!data?.highlighted;
	const isDropInvalid = !!data?.dropInvalid;
	const isPreviewEdge = !!data?.dragGhost || !!data?.dropPlaceholder;
	// Live test-run status takes priority over hover/path-selection highlight,
	// but never during a drag/drop preview or an invalid-drop state.
	const isTestRunActive = !!data?.testRunActive && !isDropInvalid && !isPreviewEdge;

	// A joint is drawn with the same geometry helpers as every other edge, but
	// carries its own colour and hover-to-delete control.
	if (data?.joint) return <JointEdge {...props} />;

	return (
		<>
			<circle
				cx={sourceX}
				cy={sourceY}
				r={3}
				className={`edgeStartPoint ${
					isTestRunActive
						? 'edgeStartPointActive'
						: isHighlighted
						? 'edgeStartPointHighlighted'
						: ''
				}`}
			/>

			<BaseEdge
				id={String(id)}
				path={getWorkflowEdgePath(props)}
				markerEnd={
					isTestRunActive || isHighlighted
						? 'url(#workflow-arrow-highlighted)'
						: 'url(#workflow-arrow)'
				}
				className={`workflowEdgePath ${
					isTestRunActive
						? 'workflowEdgePathActive'
						: isHighlighted
						? 'workflowEdgePathHighlighted'
						: ''
				}`}
				style={getWorkflowEdgeStyle(data, isHighlighted, isTestRunActive)}
			/>

			<WorkflowEdgeFlowDot
				isActive={isTestRunActive}
				nonce={data?.testRunNonce ?? 0}
				path={getWorkflowEdgeDotPath(props)}
			/>

			<WorkflowEdgeMarkers />
		</>
	);
}
