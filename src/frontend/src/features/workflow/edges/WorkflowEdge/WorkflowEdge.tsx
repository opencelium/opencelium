import { BaseEdge, getBezierPath, getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import { useLayoutEffect, useRef } from 'react';
import type { WorkflowEdgeModel } from '../../types/workflow.types';
import { useTestRun } from '../../test-run/useTestRun';
import { BASE_DOT_TRAVEL_MS, DEFAULT_ANIMATION_SPEED } from '../../test-run/animationSpeed';

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

	// The data dot's motion path deliberately overshoots the visible edge: it
	// continues past the connection point INTO the node's footprint, where the
	// node body (nodes render above edges) covers it — the dot visually enters
	// the node and parks inside it instead of stopping at the border.
	const DOT_INTO_NODE = 30;
	let dotTargetX = targetX;
	let dotTargetY = targetY;
	if (targetPosition === 'left') dotTargetX = targetX + DOT_INTO_NODE;
	if (targetPosition === 'right') dotTargetX = targetX - DOT_INTO_NODE;
	if (targetPosition === 'top') dotTargetY = targetY + DOT_INTO_NODE;
	if (targetPosition === 'bottom') dotTargetY = targetY - DOT_INTO_NODE;
	const [dotPath] = isIfBranch
		? getSmoothStepPath({
				sourceX,
				sourceY,
				targetX: dotTargetX,
				targetY: dotTargetY,
				sourcePosition,
				targetPosition,
				borderRadius: 18,
				offset: 18,
			})
		: getBezierPath({
				sourceX,
				sourceY,
				targetX: dotTargetX,
				targetY: dotTargetY,
				sourcePosition,
				targetPosition,
			});

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
				path={path}
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
				style={
					isDropInvalid
						? {
								stroke: 'var(--color-status-error-fg)',
								color: 'var(--color-status-error-fg)',
							}
						: isPreviewEdge
						? {
								opacity: data?.dragGhost ? 0.45 : 0.55,
								stroke: 'var(--color-action-primary)',
								color: 'var(--color-action-primary)',
								strokeDasharray: data?.dropPlaceholder ? '6 6' : undefined,
							}
						: isTestRunActive
						? {
								stroke: 'var(--color-action-primary)',
								color: 'var(--color-action-primary)',
							}
						: isHighlighted
						? {
								stroke: 'var(--color-action-primary)',
								color: 'var(--color-action-primary)',
							}
						: undefined
				}
			/>

			{isTestRunActive && (
				// The data dot's single directed pass: it leaves the previous node,
				// travels (dotTravelDur, scaled by the speed slider — see
				// animationSpeed.ts) along dotPath (the edge extended into the target
				// node, where the node body covers it) and parks there (fill=freeze)
				// exactly when the node's ring lights up — reading as the dot being
				// absorbed into the node. On the next step transition this edge
				// deactivates and the dot re-departs from that node along the newly
				// active edge. Only one edge is active at a time (see TestRunScope);
				// the key restarts the pass per transition, including re-entries of
				// the same edge on the next loop iteration.
				<circle key={testRunNonce} r={10} className='workflowEdgeFlowDot'>
					<animateMotion ref={dotAnimationRef} begin='indefinite' dur={dotTravelDur} repeatCount='1' fill='freeze' path={dotPath} />
				</circle>
			)}

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
