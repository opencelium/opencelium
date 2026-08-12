// Single source of truth for the paced test-run animation's speed. Every
// timing constant below is defined at 1x and divided by the current speed —
// PlaybackQueue's per-line dwell, TestRunProvider's arrival timer, and the
// edge dot's SVG travel duration in WorkflowEdge all derive from these, so a
// single slider keeps the whole choreography (dot travel + node highlight)
// synchronized instead of drifting out of sync with each other.

// Bounds are deliberately narrow: below the min the animation stops reading
// as "a process happening" and becomes just slow; above the max it's too
// quick to see anything travel at all — the whole point of the paced replay.
export const MIN_ANIMATION_SPEED = 0.5;
export const MAX_ANIMATION_SPEED = 2.5;
export const DEFAULT_ANIMATION_SPEED = 1;
export const ANIMATION_SPEED_STEP = 0.25;

// Base (1x) dwell for a step line (operator PENDING / method COMPLETE — see
// playbackStep.ts) — the node-switch choreography's total on-screen time.
export const BASE_NODE_ENTER_DELAY_MS = 1000;
// Base (1x) dwell for everything else (operator COMPLETEs, EXECUTION frames).
export const BASE_DEFAULT_DELAY_MS = 100;
// Base (1x) edge-dot travel time — must match the first half of
// BASE_NODE_ENTER_DELAY_MS (the dot travels, then the node stays lit for the
// remainder) and the <animateMotion dur> WorkflowEdge computes from it.
export const BASE_DOT_TRAVEL_MS = 500;

export const clampAnimationSpeed = (speed: number): number =>
	Math.min(MAX_ANIMATION_SPEED, Math.max(MIN_ANIMATION_SPEED, speed));
