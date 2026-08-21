import { useLayoutEffect, useRef } from 'react';
import { useTestRun } from '../../test-run/useTestRun';
import { BASE_DOT_TRAVEL_MS, DEFAULT_ANIMATION_SPEED } from '../../test-run/animationSpeed';

type Props = {
	/** Whether this edge is the one the token is travelling right now. */
	isActive: boolean;
	/** Bumped once per playback transition — restarts the pass, including a
	 * re-entry of the same edge on the next loop iteration. */
	nonce: number;
	/** The edge extended into the target node, where the node body covers it. */
	path: string;
};

/**
 * The data dot's single directed pass: it leaves the previous node, travels the
 * dot path and parks at the target (fill=freeze) exactly when the node's ring
 * lights up — reading as the dot being absorbed into the node. Only one edge is
 * ever active (see TestRunScope), and a joint is one of the edges it can be:
 * that is what shows the process jumping rather than walking to its target.
 */
export function WorkflowEdgeFlowDot({ isActive, nonce, path }: Props) {
	// Speed slider (see animationSpeed.ts) — scales the dot's travel duration the
	// same way it scales PlaybackQueue's dwell and TestRunProvider's arrival
	// timer, so all three stay synchronized instead of drifting apart.
	const animationSpeed = useTestRun()?.animationSpeed ?? DEFAULT_ANIMATION_SPEED;

	// SMIL gotcha: an <animateMotion> inserted into an SVG that has been mounted
	// for a while is timed against the DOCUMENT's timeline — with the default
	// begin="0s" a one-shot animation is considered long since ended, so the dot
	// would appear already frozen at the target instead of visibly travelling.
	// begin="indefinite" + an explicit beginElement() on every mount/transition
	// starts the pass at the right instant. Layout effect so it begins before
	// paint (no one-frame flash of the dot at the SVG origin).
	const dotAnimationRef = useRef<SVGElement | null>(null);
	useLayoutEffect(() => {
		if (!isActive) return;
		(dotAnimationRef.current as SVGAnimationElement | null)?.beginElement();
	}, [isActive, nonce]);

	if (!isActive) return null;

	return (
		<circle key={nonce} r={10} className='workflowEdgeFlowDot'>
			<animateMotion
				ref={dotAnimationRef}
				begin='indefinite'
				dur={`${BASE_DOT_TRAVEL_MS / animationSpeed / 1000}s`}
				repeatCount='1'
				fill='freeze'
				path={path}
			/>
		</circle>
	);
}
