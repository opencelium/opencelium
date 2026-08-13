import { createContext } from 'react';
import type { LiveLogTree } from '@features/logs';
import type { SocketStatus } from '@shared/api/socket/types';
import type { LiveGraphStatus } from './liveGraphStatus';

export type TestRunPhase = 'idle' | 'starting' | 'running' | 'stopping';

// The single step the paced playback is showing RIGHT NOW — the workflow
// tree-path index of the most recently applied PENDING line. Execution is
// consecutive, so exactly one element is "current" at any moment; the canvas
// highlights it (and animates the edge feeding it) alone. `nonce` increments
// on every applied PENDING — including re-entries of the SAME element on the
// next loop iteration — so the edge dot animation restarts per transition.
// `hasArrived` is the step's two-phase choreography, driven by the provider's
// clock (NOT by CSS delays, which silently restart when a node re-renders):
// false while the data dot travels the edge (first 0.5s), true from the
// moment the dot reaches the node — only then does the node highlight.
export type TestRunCurrentStep = {
	indexPath: string;
	// The step's comma-separated enclosing-loop iteration context (outermost
	// first), same shape as a LiveLogNode's loopIndex — already computed by
	// getNextStep (see playbackStep.ts) for every step, just threaded through
	// here too. Lets the debugger pause target identify exactly which loop
	// iteration it paused in, not just which structural node.
	loopIndex: string;
	nonce: number;
	hasArrived: boolean;
};

// Outcome of the last run, shown under the logs view. `executionTimeMs` is
// measured from the moment the user pressed "Test run". The error details are
// shown on the failing row inside the tree, not here.
export type TestRunResult =
	| { kind: 'finished'; executionTimeMs: number }
	| { kind: 'stopped' }
	| { kind: 'failed' };

export type TestRunContextValue = {
	socketStatus: SocketStatus;
	phase: TestRunPhase;
	// Log tree of the current (or last finished) test run, assembled entirely
	// from the socket stream — no REST requests happen during a run.
	logTree: LiveLogTree;
	// Flat per-node run status (not memory-bounded like logTree — see
	// liveGraphStatus.ts) driving the canvas's live edge/node/iteration
	// animation, keyed by workflow tree-path index.
	liveGraphStatus: LiveGraphStatus;
	// Every indexPath's enclosing-LOOP-ancestor indexPaths (outermost first) —
	// the same map the provider already uses internally to reduce socket
	// lines into liveGraphStatus, exposed so any descendant can resolve a
	// node's current loop-iteration context (see
	// liveGraphStatus.resolveCurrentLoopIndex) without needing it threaded
	// through as a prop from index.tsx. Empty map outside a real graph.
	loopAncestorsByIndexPath: Map<string, string[]>;
	// The one element the paced playback is currently showing as executing.
	currentStep: TestRunCurrentStep | null;
	result: TestRunResult | null;
	// True when the running state was resumed from a previous page session: the
	// test was started before the page was reloaded/reopened, so its logs are no
	// longer available. The stop button stays active, but the panel shows a
	// notice instead of logs (the user must stop and re-run to see fresh logs).
	isOrphaned: boolean;
	// True when a test run for a *different* workflow is currently executing on
	// the backend. Only one workflow test may run at a time system-wide, so this
	// blocks starting a test here until the other one finishes.
	isOtherTestRunning: boolean;
	// True once the run finished on the BACKEND while the paced playback (see
	// playbackQueue.ts) may still be animating — phase stays non-idle until the
	// playback drains. Lets the UI quietly show "it's done" during the replay.
	isBackendDone: boolean;
	// True while socket lines are still buffered for paced playback — the
	// animation is running behind the real test. Drives the "jump to live"
	// control on the start node.
	isPlaybackBehind: boolean;
	// User preference, toggled from the logs panel: true shows every log line
	// and canvas update the instant it arrives (no pacing, no dot/ring
	// choreography); false (default) runs everything through the paced
	// playback described above. Takes effect immediately, including mid-run —
	// flipping it on flushes whatever is currently buffered.
	isLiveAnimation: boolean;
	setLiveAnimation: (value: boolean) => void;
	// User-controlled pace of the paced (non-live) animation — a multiplier on
	// every dwell in the choreography (see animationSpeed.ts). 1 is the
	// original fixed pace; takes effect immediately, including on a line
	// already mid-wait. Meaningless while isLiveAnimation is true (no pacing
	// to speed up).
	animationSpeed: number;
	setAnimationSpeed: (speed: number) => void;
	// The replay debugger's pause: freezes the paced playback (see
	// PlaybackQueue.pause) exactly where it is — the backend keeps running to
	// completion regardless, lines just keep buffering. Meaningless while
	// isLiveAnimation is true (nothing is ever queued in live mode) or while
	// idle (nothing playing to pause).
	isPaused: boolean;
	pauseAnimation: () => void;
	resumeAnimation: () => void;
	// Applies exactly the next buffered line, then stays paused (see
	// PlaybackQueue.stepForward) — a no-op while not paused or with nothing
	// buffered yet. Re-warms the tree structure down to the new current node
	// and bumps pauseRevealNonce below, same as pauseAnimation, so the logs
	// panel follows each step.
	stepForward: () => void;
	// Bumped once pausing has finished warming the tree structure down to the
	// paused-on node (see prefetchPauseTracePath) — the logs panel expands its
	// ancestors and scrolls it into view, mirroring errorRevealNonce below but
	// without touching the paused node's own (collapsed) detail: that's still
	// fetched only when the user opens it.
	pauseRevealNonce: number;
	// Bumped once per failed run so the logs panel can auto-expand and scroll to
	// the element where the error happened. 0 means no failure to reveal yet.
	errorRevealNonce: number;
	// True from a failure until the reveal starts: first a short pause gives
	// the backend time to persist the run, then every REST call the reveal
	// will need gets silently prefetched (see prefetchErrorTracePath) so the
	// eventual expand-down cascade never blocks on the network. The panel
	// freezes the log tree behind a loading overlay for the whole span.
	revealPending: boolean;
	startTest: () => Promise<void>;
	stopTest: () => Promise<void>;
	// Skip-to-live: apply everything still buffered for paced playback right
	// now, snapping the animation to the run's actual current state.
	skipToLive: () => void;
	// Clears the locally collected logs (and the result line). No-op while a
	// run is active — incoming lines need their connector roots.
	clearLogs: () => void;
};

export const TestRunContext = createContext<TestRunContextValue | null>(null);
