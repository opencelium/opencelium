import { BaseEdge } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { useLayoutEffect, useRef } from 'react';
import type { WorkflowEdgeModel } from '../../types/workflow.types';
import { useTestRun } from '../../test-run/useTestRun';
import { BASE_DOT_TRAVEL_MS, DEFAULT_ANIMATION_SPEED } from '../../test-run/animationSpeed';
import { JointEdge } from '../JointEdge/JointEdge';
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
	// Speed slider (see animationSpeed.ts) — scales the dot's travel duration
	// the same way it scales PlaybackQueue's dwell and TestRunProvider's
	// arrival timer, so all three stay synchronized instead of drifting apart.
	const animationSpeed = useTestRun()?.animationSpeed ?? DEFAULT_ANIMATION_SPEED;
	const dotTravelDur = `${BASE_DOT_TRAVEL_MS / animationSpeed / 1000}s`;

	// SMIL gotcha: an <animateMotion> inserted into an SVG that has been
	// mounted for a while is timed against the DOCUMENT's timeline — with the
	// default begin="0s" a one-shot animation is considered long since ended,
	// so the dot would appear already frozen at the target instead of visibly
	// travelling. begin="indefinite" + an explicit beginElement() on every
	// mount/transition starts the pass at the right instant. Layout effect so
	// it begins before paint (no one-frame flash of the dot at the SVG origin).
	const dotAnimationRef = useRef<SVGElement | null>(null);
	const testRunNonce = data?.testRunNonce ?? 0;
	useLayoutEffect(() => {
		if (!isTestRunActive) return;
		(dotAnimationRef.current as SVGAnimationElement | null)?.beginElement();
	}, [isTestRunActive, testRunNonce]);

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

			{isTestRunActive && (
				// The data dot's single directed pass: it leaves the previous node,
				// travels (dotTravelDur, scaled by the speed slider — see
				// animationSpeed.ts) along the dot path (the edge extended into the
				// target node, where the node body covers it) and parks there
				// (fill=freeze) exactly when the node's ring lights up — reading as the
				// dot being absorbed into the node. On the next step transition this
				// edge deactivates and the dot re-departs from that node along the
				// newly active edge. Only one edge is active at a time (see
				// TestRunScope); the key restarts the pass per transition, including
				// re-entries of the same edge on the next loop iteration.
				<circle key={testRunNonce} r={10} className='workflowEdgeFlowDot'>
					<animateMotion
						ref={dotAnimationRef}
						begin='indefinite'
						dur={dotTravelDur}
						repeatCount='1'
						fill='freeze'
						path={getWorkflowEdgeDotPath(props)}
					/>
				</circle>
			)}

			<WorkflowEdgeMarkers />
		</>
	);
}
