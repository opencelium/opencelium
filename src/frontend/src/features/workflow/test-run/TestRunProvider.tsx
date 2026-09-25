import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { message } from 'antd';
import type { IMessage } from '@stomp/stompjs';
import { useSocket } from '@shared/api/socket/useSocket';
import { useStompSubscription } from '@shared/api/socket/useStompSubscription';
import { apiExecutor } from '@shared/api/apiExecutor';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import {
	EMPTY_LIVE_LOG_TREE,
	failPendingNodes,
	prefetchErrorTracePath,
	prefetchPauseTracePath,
	reduceLiveLog,
	type ExecutionSocketLog,
} from '@features/logs';
import { apiFetchWithHeaders } from '@shared/api/apiFetch';
import { testConnectionExecution } from '../api/connectionApi';
import {
	TestRunContext,
	type TestRunContextValue,
	type TestRunCurrentStep,
	type TestRunPhase,
	type TestRunResult,
} from './TestRunContext';
import { clearActiveTestRun, getActiveTestRun, saveActiveTestRun } from './testRunStorage';
import { handleExecutionLogFrame } from './executionLogFrame';
import { useTestRunLeaveGuard } from './useTestRunLeaveGuard';
import {createId} from "@shared/lib/createId.ts";
import { EMPTY_LIVE_GRAPH_STATUS, failPendingGraphStatus, reduceLiveGraphStatus, type LiveGraphStatus } from './liveGraphStatus';
import { PlaybackQueue, type ApplyLogOpts } from './playbackQueue';
import { getNextStep, type StepMeta } from './playbackStep';
import { BASE_DOT_TRAVEL_MS, DEFAULT_ANIMATION_SPEED, clampAnimationSpeed } from './animationSpeed';
import { notifyError } from '@shared/ui/feedback/notifyError';

const TIMEOUT_TO_COLLECT_LOGS = 3000;

// antd message key for the loading toast shown during the reveal pause (the
// TIMEOUT_TO_COLLECT_LOGS window between a failure/stop and the error reveal).
// Keyed so it can be replaced/destroyed from wherever the pause ends.
const REVEAL_LOADING_MESSAGE_KEY = 'test-run-error-reveal';
// Backend names every temporary test scheduler "!*test_schedule_<millis>_<title>"
// (ConnectionController.test). The running-jobs feed lists them while they run.
const TEST_SCHEDULE_TITLE_PREFIX = '!*test_schedule_';

type RunningJob = { schedulerId: number; title?: string };

// The feed exposes no connectionId, so the scheduler title is the only
// available discriminator. Pull out the exact title portion (after the fixed
// prefix and the numeric millis) instead of a suffix check — `endsWith` would
// also match an unrelated connection whose title happens to be a suffix of
// this one's (e.g. "Test" vs. someone else's "Sync Test"), falsely blocking
// this connection's start button for a conflict that isn't actually here.
const extractTestScheduleTitle = (title: string): string | null => {
	if (!title.startsWith(TEST_SCHEDULE_TITLE_PREFIX)) return null;
	const match = /^\d+_(.*)$/.exec(title.slice(TEST_SCHEDULE_TITLE_PREFIX.length));
	return match ? match[1] : null;
};

// A running job conflicts with starting/running a test on this connection only
// when it is a test scheduler for the SAME connection (exact title match).
// `excludeSchedulerId` is our own run's scheduler, which must not count as a
// conflict — neither while it executes nor during the lag window after we stop
// it, before the running-jobs feed drops it.
const isConflictingTest = (job: RunningJob, connectionTitle: string): boolean =>
	typeof job?.title === 'string' && extractTestScheduleTitle(job.title) === connectionTitle;

const hasConflictingTest = (
	jobs: unknown,
	connectionTitle: string,
	excludeSchedulerId: number | null,
): boolean =>
	!!connectionTitle &&
	Array.isArray(jobs) &&
	jobs.some(
		(job) =>
			isConflictingTest(job as RunningJob, connectionTitle) &&
			(job as RunningJob).schedulerId !== excludeSchedulerId,
	);

const isOwnJobListed = (jobs: unknown, ownSchedulerId: number | null): boolean =>
	ownSchedulerId != null &&
	Array.isArray(jobs) &&
	jobs.some((job) => (job as RunningJob)?.schedulerId === ownSchedulerId);

type Props = {
	connectionId?: string;
	// This connection's title — the backend keys the single-test-per-connection
	// rule on it (see hasConflictingTest). Must be the same value sent as the
	// payload title so the conflict prediction matches the backend's decision.
	connectionTitle?: string;
	// Returns the save-shaped connection body, or null when the graph is not
	// testable (the builder is responsible for surfacing the reason).
	buildTestPayload: () => unknown | null;
	// Recognizes known backend validation error codes and, when it does, highlights
	// the offending node and returns a specific translated message. Returns null for
	// errors it doesn't recognize, so the generic "failed to start" message is used.
	onResolveStartError?: (error: unknown) => string | null;
	// Precomputed once per graph (see buildLoopAncestorsByIndexPath) — lets
	// liveGraphStatus attribute a socket line's loopIndex components to the
	// right enclosing loop nodes without this provider knowing the graph shape.
	loopAncestorsByIndexPath?: Map<string, string[]>;
	children: ReactNode;
};

const EMPTY_LOOP_ANCESTORS = new Map<string, string[]>();

export function TestRunProvider({ connectionId, connectionTitle = '', buildTestPayload, onResolveStartError, loopAncestorsByIndexPath = EMPTY_LOOP_ANCESTORS, children }: Props) {
	const { client, status } = useSocket();
	const { t: tEntities } = useI18n('entities');
	const confirm = useConfirm();
	// Read from a ref inside the feed/snapshot callbacks so editing the title
	// doesn't churn the STOMP subscription (handleRunningJobs stays stable).
	const connectionTitleRef = useRef(connectionTitle);
	connectionTitleRef.current = connectionTitle;
	// Resume a run started in a previous page session that may still be executing
	// on the backend. Read once on first render, keyed by connectionId (which is
	// the STOMP channelId for a saved connection — see startTest). Seeds the
	// state and refs below so the stop button is shown without replaying logs.
	const [resumedRun] = useState(() => (connectionId ? getActiveTestRun(connectionId) : null));
	const [phase, setPhase] = useState<TestRunPhase>(resumedRun ? 'running' : 'idle');
	const [logTree, setLogTree] = useState(EMPTY_LIVE_LOG_TREE);
	// Mirrors `logTree` synchronously (kept in sync at every setLogTree call
	// site below) so applyLogToPresentation — a stable callback with `[]`
	// deps — can read/produce the tree's brand-new value within the same
	// synchronous call, before React has committed the state update. Needed
	// for the error-path prefetch below, which must see the error line that
	// was just applied, not last render's tree.
	const logTreeRef = useRef(logTree);
	const [liveGraphStatus, setLiveGraphStatus] = useState<LiveGraphStatus>(EMPTY_LIVE_GRAPH_STATUS);
	// Mirrors `liveGraphStatus` synchronously — same reasoning as logTreeRef
	// above. skipToNextIteration's predicate (see below) needs to read the
	// just-applied value the instant applyLogToPresentation returns, not
	// wait for React's next render.
	const liveGraphStatusRef = useRef(liveGraphStatus);
	const updateLiveGraphStatus = useCallback(
		(next: LiveGraphStatus | ((current: LiveGraphStatus) => LiveGraphStatus)) => {
			const resolved = typeof next === 'function' ? next(liveGraphStatusRef.current) : next;
			liveGraphStatusRef.current = resolved;
			setLiveGraphStatus(resolved);
		},
		[],
	);
	// The one element the paced playback is showing as executing right now —
	// advanced by every applied PENDING line (see TestRunCurrentStep).
	const [currentStep, setCurrentStep] = useState<TestRunCurrentStep | null>(null);
	// Read from a ref inside pauseAnimation (a stable callback) so it always
	// captures the step the animation is actually frozen on, not a stale one
	// from whichever render created the callback.
	const currentStepRef = useRef<TestRunCurrentStep | null>(currentStep);
	currentStepRef.current = currentStep;
	// Flips the current step's hasArrived after the dot's 0.5s edge travel.
	const arrivalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Monotonic step counter — gives each transition a unique nonce so a stale
	// arrival timer can never mark a newer step as arrived.
	const stepNonceRef = useRef(0);
	// The step the token currently sits on, with its loop iteration context —
	// getNextStep compares incoming lines against it (see playbackStep.ts).
	const currentStepMetaRef = useRef<StepMeta | null>(null);
	// Read from a ref so handleSocketLog (a stable callback) always sees the
	// latest graph shape without needing to be recreated when it changes.
	const loopAncestorsRef = useRef(loopAncestorsByIndexPath);
	loopAncestorsRef.current = loopAncestorsByIndexPath;
	const [result, setResult] = useState<TestRunResult | null>(null);
	const [isOrphaned, setIsOrphaned] = useState(!!resumedRun);
	// True once the run is over on the BACKEND (end line / terminated), while
	// the paced playback below may still be animating. The header/result area
	// quietly reflects this; phase flips to 'idle' only when playback drains.
	const [isBackendDone, setIsBackendDone] = useState(false);
	const backendDoneRef = useRef(false);
	// Socket lines still buffered for paced playback — > 0 means the animation
	// is running behind the real test (drives the "jump to live" control).
	const [playbackPendingCount, setPlaybackPendingCount] = useState(0);
	// User preference (see TestRunContextValue.isLiveAnimation) — read via a
	// ref inside handleSocketLog/applyLogToPresentation (both stable callbacks)
	// so toggling it doesn't need to recreate them.
	const [isLiveAnimation, setIsLiveAnimationState] = useState(false);
	const isLiveAnimationRef = useRef(isLiveAnimation);
	isLiveAnimationRef.current = isLiveAnimation;
	// User-controlled pace slider (see TestRunContextValue.animationSpeed) —
	// same ref-mirroring reason as isLiveAnimation above: read from stable
	// callbacks (the arrival timer, PlaybackQueue's getSpeed) without needing
	// to recreate them on every drag tick.
	const [animationSpeed, setAnimationSpeedState] = useState(DEFAULT_ANIMATION_SPEED);
	const animationSpeedRef = useRef(animationSpeed);
	animationSpeedRef.current = animationSpeed;
	// The replay debugger's pause (see TestRunContextValue.isPaused).
	const [isPaused, setIsPausedState] = useState(false);
	// Bumped once per pause so the logs panel reveals the paused-on node; also
	// invalidates a stale in-flight prefetch (same reasoning as revealTokenRef
	// below) — resuming, stopping, or starting a new run must never let a slow
	// prefetch from an earlier pause bump pauseRevealNonce after the fact.
	const [pauseRevealNonce, setPauseRevealNonce] = useState(0);
	const pauseTokenRef = useRef(0);
	// Called everywhere the playback queue's own pause flag gets reset out from
	// under us (flush/clear — see playbackQueue.ts) so the provider's public
	// isPaused mirrors it, and any pause-reveal prefetch still in flight from
	// before this moment is invalidated. Zero deps — safe in any callback's
	// dependency array.
	const resetPauseState = useCallback(() => {
		pauseTokenRef.current += 1;
		setIsPausedState(false);
	}, []);
	// Whether a test for THIS connection is already running elsewhere (another tab
	// or user) — the only thing that now blocks starting here. Our own run is
	// excluded (see ownSchedulerIdRef).
	const [isConflictingTestRunning, setIsConflictingTestRunning] = useState(false);
	// Bumped once per failed run so the logs panel reveals the failing element.
	const [errorRevealNonce, setErrorRevealNonce] = useState(0);
	const hasRevealedErrorRef = useRef(false);
	// Set as soon as ANY line in the run carries an error, but — unlike
	// hasRevealedErrorRef — never itself triggers the reveal. The backend keeps
	// streaming lines after the failing one (closing out every enclosing
	// loop/operator on the way back up the tree); only the top-level EXECUTION
	// line means the run has actually finished. Reacting to the failing line
	// directly raced that still-in-flight unwind, so the reveal cascade could
	// fire while the backend was still persisting/streaming later lines.
	const hasSeenErrorRef = useRef(false);
	// Invalidates a stale in-flight prefetch (see prefetchErrorTracePath below):
	// minted fresh each time a reveal starts, bumped on any reset/cleanup so a
	// slow prefetch from an already-over or already-restarted run can never
	// flip revealPending/errorRevealNonce after the fact.
	const revealTokenRef = useRef(0);
	// True during the short pause after a failure before the reveal starts — the
	// backend needs a moment to finish persisting the run before we can fetch the
	// failing element's path. The panel shows a loading state meanwhile.
	const [revealPending, setRevealPending] = useState(false);
	const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const schedulerIdRef = useRef<number | null>(resumedRun?.schedulerId ?? null);
	// The scheduler of our own run, kept alive past finishRun() so the lingering
	// entry in the running-jobs feed is not mistaken for another test. Cleared
	// only once the feed confirms our job is actually gone (see handleRunningJobs).
	const ownSchedulerIdRef = useRef<number | null>(resumedRun?.schedulerId ?? null);
	const channelIdRef = useRef<string | null>(resumedRun?.channelId ?? null);
	const unsubscribeRef = useRef<(() => void) | null>(null);
	const startTimeRef = useRef(resumedRun?.startedAt ?? 0);

	// The first outcome wins: a specific error line must not be overwritten by
	// the generic EXECUTION FAIL line that follows it. The win/lose decision is
	// made synchronously on this ref — NOT inside the setResult updater, whose
	// execution React defers to the render phase. Checking the ref there would
	// let several error-carrying lines arriving in the same synchronous burst
	// (e.g. every enclosing loop/operator's own FAIL line as an exception
	// unwinds) each see it as still unset and each fire their own toast.
	// Returns whether THIS call was the one that won, so callers can gate a
	// one-shot side effect (a toast) on it.
	const hasSettledResultRef = useRef(false);
	const settleResult = useCallback((next: TestRunResult): boolean => {
		if (hasSettledResultRef.current) return false;
		hasSettledResultRef.current = true;
		setResult(next);
		return true;
	}, []);

	// Applies one socket line to what the user SEES (log tree + canvas
	// animation). Called by the playback queue, so it runs behind the real run
	// when lines arrive faster than the pacing allows. The error reveal lives
	// here — anchored to playback reaching the run's actual end (not the real
	// failure instant, nor the failing line itself), so the pan/expand lands on
	// a graph whose animation has caught up to the failing node.
	const applyLogToPresentation = useCallback(
		(log: ExecutionSocketLog, { updateStep }: ApplyLogOpts) => {
			const nextTree = reduceLiveLog(logTreeRef.current, log);
			logTreeRef.current = nextTree;
			setLogTree(nextTree);
			updateLiveGraphStatus((current) => reduceLiveGraphStatus(current, log, loopAncestorsRef.current));
			// Execution is consecutive: every step line (operator PENDINGs and
			// method COMPLETEs — methods never emit PENDING, see playbackStep.ts)
			// IS the process departing toward that element. currentStepMetaRef
			// tracks this for EVERY line (cheap — a few string comparisons) so the
			// out-of-order guard in getNextStep always compares against the true
			// latest step. The visible choreography below (currentStep state +
			// arrival timer) only runs when updateStep is true — during a
			// PlaybackQueue.flush() burst every line but the last is superseded
			// before React ever commits, so paying for state + timer churn on
			// those is pure waste that scales with how large the backlog is.
			const nextStep = getNextStep(log, currentStepMetaRef.current);
			if (nextStep) {
				// Read before the ref advances: during a flush() burst the ref keeps
				// moving while `updateStep` is false, so this is the step actually
				// left behind even when the intermediate ones never rendered.
				const fromIndexPath = currentStepMetaRef.current?.indexPath;
				currentStepMetaRef.current = nextStep;
				if (updateStep) {
					const nonce = ++stepNonceRef.current;
					if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
					// The nonce advances even when the indexPath repeats (same node
					// re-entered on the next loop iteration) so the edge-dot animation
					// restarts per transition. In live mode there is no travel phase at
					// all — the step arrives the instant it's applied, matching "no
					// animation, just the raw feed". Otherwise it starts un-arrived (dot
					// travelling, node dark) and flips to arrived when the dot's travel
					// time elapses — driven here by the provider's clock, not by a CSS
					// animation-delay, which silently restarts (and so never fires)
					// whenever the node re-renders mid-step.
					if (isLiveAnimationRef.current) {
						setCurrentStep({ indexPath: nextStep.indexPath, loopIndex: nextStep.loopIndex, fromIndexPath, nonce, hasArrived: true });
					} else {
						setCurrentStep({ indexPath: nextStep.indexPath, loopIndex: nextStep.loopIndex, fromIndexPath, nonce, hasArrived: false });
						arrivalTimerRef.current = setTimeout(() => {
							setCurrentStep((prev) => (prev && prev.nonce === nonce ? { ...prev, hasArrived: true } : prev));
						}, BASE_DOT_TRAVEL_MS / animationSpeedRef.current);
					}
				}
			}

			if (log.error?.message) hasSeenErrorRef.current = true;

			// The run is only truly over once the top-level EXECUTION line arrives
			// — everything before that (including the failing line itself) is
			// still mid-unwind on the backend. Gate the reveal on THAT line, not
			// on the first error sighting, or the cascade below starts while the
			// backend is still streaming/persisting the rest of the run.
			const isRunEndLine = log.type === 'EXECUTION' && (log.status === 'COMPLETE' || log.status === 'FAIL');
			if (isRunEndLine && (log.status === 'FAIL' || hasSeenErrorRef.current)) {
				// First failure of the run drives the panel to expand to the error.
				// Wait ~3s before touching the backend: it needs a moment to finish
				// persisting the run, otherwise the child-fetches below would race it.
				if (!hasRevealedErrorRef.current) {
					hasRevealedErrorRef.current = true;
					const token = ++revealTokenRef.current;
					setRevealPending(true);
					// The pause (plus the prefetch below) has no visible effect of its
					// own — the reveal only happens once both finish — so show a loading
					// toast for its duration or the user is left wondering whether
					// anything is happening. The logs panel also freezes the tree behind
					// a loading overlay while revealPending is true (WorkflowLogs.tsx).
					message.loading({
						content: tEntities('connection.test.locatingError'),
						key: REVEAL_LOADING_MESSAGE_KEY,
						duration: 0,
					});
					revealTimerRef.current = setTimeout(() => {
						// Silently fetch every ElementChildren query the reveal cascade
						// will need (see prefetchErrorTracePath) BEFORE bumping the nonce,
						// so the cascade itself — unchanged, still nonce-gated in the log
						// tree components — finds a warm cache and never blocks on the
						// network mid-expand. `token` guards against a run finishing or
						// restarting while this is still in flight.
						void prefetchErrorTracePath(nextTree).finally(() => {
							if (revealTokenRef.current !== token) return;
							message.destroy(REVEAL_LOADING_MESSAGE_KEY);
							setRevealPending(false);
							setErrorRevealNonce((n) => n + 1);
						});
					}, TIMEOUT_TO_COLLECT_LOGS);
				}
			}
		},
		[tEntities, updateLiveGraphStatus],
	);
	const applyLogRef = useRef(applyLogToPresentation);
	applyLogRef.current = applyLogToPresentation;

	// Presentation-side end of run: playback has shown everything there is to
	// show. Only now does the phase go idle (releasing the edit lock), does the
	// travelling token disappear (currentStep — the canvas keeps its highlight
	// through momentary "nothing PENDING" gaps mid-run, so this is what
	// actually ends it), and do leftover spinners turn into red dots marking
	// where the run stopped.
	const finishPresentation = useCallback(() => {
		setPhase('idle');
		if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
		currentStepMetaRef.current = null;
		setCurrentStep(null);
		logTreeRef.current = failPendingNodes(logTreeRef.current);
		setLogTree(logTreeRef.current);
		updateLiveGraphStatus(failPendingGraphStatus);
	}, [updateLiveGraphStatus]);
	const finishPresentationRef = useRef(finishPresentation);
	finishPresentationRef.current = finishPresentation;

	// Paces the socket lines so the animation stays watchable however fast the
	// backend executes (see playbackQueue.ts). Created once; callbacks read
	// through refs so they always see the latest closures.
	const playbackRef = useRef<PlaybackQueue | null>(null);
	if (!playbackRef.current) {
		playbackRef.current = new PlaybackQueue(
			{
				applyLog: (log, opts) => applyLogRef.current(log, opts),
				onDrained: () => {
					if (!backendDoneRef.current) return;
					// A "jump to next iteration" skip that never finds another
					// iteration (this was the loop's last one) drains all the way to
					// the run's real end while still paused — nothing left to stay
					// paused ON, so drop the flag here too, same as flush()/stopTest().
					resetPauseState();
					finishPresentationRef.current();
				},
				onQueueChange: setPlaybackPendingCount,
			},
			() => animationSpeedRef.current,
		);
	}

	// Backend-side end of run, on the REAL clock: release the socket
	// subscription, the stored resume record and the one-test-per-connection
	// block immediately — the server is done regardless of how far the paced
	// playback has gotten. Deliberately does NOT touch phase or the trees.
	const finishBackend = useCallback(() => {
		unsubscribeRef.current?.();
		unsubscribeRef.current = null;
		if (channelIdRef.current) clearActiveTestRun(channelIdRef.current);
		channelIdRef.current = null;
		schedulerIdRef.current = null;
		setIsOrphaned(false);
		// Our run was the only test allowed for this connection, so no conflict
		// remains now. Clear the flag immediately instead of waiting for the feed to
		// drop our (briefly lingering) own job, which would otherwise flash "another
		// test running". ownSchedulerIdRef stays set so that lingering entry is
		// ignored by the snapshot/feed until the backend actually drops it.
		setIsConflictingTestRunning(false);
		backendDoneRef.current = true;
		setIsBackendDone(true);
	}, []);

	// Full immediate teardown for paths where paced playback has nothing to
	// add: orphaned runs replay no logs, a failed start never showed anything,
	// and leaving the page unmounts the canvas anyway.
	const finishRunImmediately = useCallback(() => {
		finishBackend();
		playbackRef.current?.clear();
		resetPauseState();
		finishPresentation();
	}, [finishBackend, finishPresentation, resetPauseState]);

	// Skip-to-live: apply everything still buffered right now. If the backend
	// already finished, the queue's drain callback closes the presentation too.
	// Jumping to live also drops any pause — flush() already un-pauses the
	// queue itself, this just keeps the provider's own isPaused in sync.
	const skipToLive = useCallback(() => {
		resetPauseState();
		playbackRef.current?.flush();
	}, [resetPauseState]);

	// Toggles the live/animated preference. Switching to live mid-run flushes
	// whatever the paced queue is still holding, so the two modes never fight
	// over the same buffered backlog — from this point on every new line goes
	// straight through handleSocketLog's live branch instead of the queue.
	// Switching back to animated needs no equivalent action: there is nothing
	// buffered to un-flush, future lines simply start being queued again.
	const setLiveAnimation = useCallback((value: boolean) => {
		// Update the ref synchronously, before flush() below — setIsLiveAnimationState
		// only takes effect on the next render, and flush() runs synchronously right
		// now. Without this, the whole catch-up would run applyLogToPresentation's
		// paced (non-live) branch off the stale ref, needlessly scheduling and
		// clearing an arrival timer for every buffered line.
		isLiveAnimationRef.current = value;
		setIsLiveAnimationState(value);
		if (value) {
			resetPauseState();
			playbackRef.current?.flush();
		}
	}, [resetPauseState]);

	// Shared by pauseAnimation and stepForward below: warms the tree structure
	// down to `step` (see prefetchPauseTracePath) and bumps pauseRevealNonce
	// once that resolves, so the logs panel expands straight down to it with
	// no per-level network wait. Deliberately never fetches the node's own
	// request/response detail — that stays on-demand, fetched only when the
	// user opens its row. Reused for stepForward since "the current node"
	// changes with every step exactly like it does on the initial pause.
	const revealPausedStep = useCallback((step: StepMeta) => {
		const token = ++pauseTokenRef.current;
		void prefetchPauseTracePath(logTreeRef.current, { indexPath: step.indexPath, loopIndex: step.loopIndex }).finally(() => {
			if (pauseTokenRef.current !== token) return;
			setPauseRevealNonce((n) => n + 1);
		});
	}, []);

	// Freezes the paced playback exactly where it is (see PlaybackQueue.pause).
	const pauseAnimation = useCallback(() => {
		if (isLiveAnimationRef.current) return;
		playbackRef.current?.pause();
		setIsPausedState(true);
		const step = currentStepRef.current;
		if (!step) return;
		revealPausedStep(step);
	}, [revealPausedStep]);

	const resumeAnimation = useCallback(() => {
		resetPauseState();
		playbackRef.current?.resume();
	}, [resetPauseState]);

	// Applies exactly the next buffered line, then stays paused (see
	// PlaybackQueue.stepForward — itself a no-op while not paused or with
	// nothing buffered). currentStepMetaRef, not currentStepRef: applyHead()
	// (via applyLogToPresentation) updates currentStepMetaRef synchronously,
	// but only *schedules* the currentStep state update — reading the state
	// ref here would still see the step from BEFORE this call.
	const stepForward = useCallback(() => {
		playbackRef.current?.stepForward();
		const step = currentStepMetaRef.current;
		if (!step) return;
		revealPausedStep(step);
	}, [revealPausedStep]);

	// The debugger's "jump to next iteration" (see PlaybackQueue.skipWhile):
	// captures this loop's CURRENT iteration marker as the baseline, then
	// fast-forwards until liveGraphStatus reports either a different one (a
	// real transition, mirroring reduceLiveGraphStatus's own lastIterationValue
	// bookkeeping) or the loop itself finishing (no next iteration to reach).
	const skipToNextIteration = useCallback((indexPath: string) => {
		const baselineIteration = liveGraphStatusRef.current[indexPath]?.lastIterationValue;
		playbackRef.current?.skipWhile(() => {
			const current = liveGraphStatusRef.current[indexPath];
			if (!current) return false;
			if (current.status === 'COMPLETE' || current.status === 'FAIL') return true;
			return current.lastIterationValue !== undefined && current.lastIterationValue !== baselineIteration;
		});
		const step = currentStepMetaRef.current;
		if (!step) return;
		revealPausedStep(step);
	}, [revealPausedStep]);

	// The editable form of the same jump (see LoopIterationInput): fast-forwards
	// until this loop's own iteration counter reaches `targetIteration` — the
	// 1-based number the node displays, which reduceLiveGraphStatus increments
	// per distinct loopIndex value — or the loop ends first, which is as far as
	// any target can be honoured. Callers own the "is it ahead of us" check:
	// applied lines are discarded, so the replay has no way back.
	const skipToIteration = useCallback((indexPath: string, targetIteration: number) => {
		playbackRef.current?.skipWhile(() => {
			const current = liveGraphStatusRef.current[indexPath];
			if (!current) return false;
			if (current.status === 'COMPLETE' || current.status === 'FAIL') return true;
			return (current.iterationCount ?? 0) >= targetIteration;
		});
		const step = currentStepMetaRef.current;
		if (!step) return;
		revealPausedStep(step);
	}, [revealPausedStep]);

	// Update the ref before the queue reschedules below, same reasoning as
	// setLiveAnimation above — the reschedule reads animationSpeedRef
	// synchronously, before setAnimationSpeedState's render-phase update lands.
	const setAnimationSpeed = useCallback((speed: number) => {
		const clamped = clampAnimationSpeed(speed);
		animationSpeedRef.current = clamped;
		setAnimationSpeedState(clamped);
		playbackRef.current?.rescheduleForSpeedChange();
	}, []);

	useEffect(
		() => () => {
			unsubscribeRef.current?.();
			playbackRef.current?.dispose();
			if (arrivalTimerRef.current) clearTimeout(arrivalTimerRef.current);
			if (revealTimerRef.current) {
				clearTimeout(revealTimerRef.current);
				message.destroy(REVEAL_LOADING_MESSAGE_KEY);
			}
			revealTokenRef.current += 1;
			pauseTokenRef.current += 1;
		},
		[],
	);

	// If the transport drops mid-run the backend can no longer reach this
	// channel — reset so the button doesn't stay stuck on "stop". The phase
	// reset is a render-phase adjustment; the subscription teardown stays in
	// an effect because it touches the external STOMP client. Orphaned runs are
	// exempt: their backend run outlives this page session, so we keep the stop
	// button while the socket (re)connects.
	if (status !== 'connected' && phase !== 'idle' && !isOrphaned) {
		setPhase('idle');
		// The run died with the connection — drop the unplayed playback tail (it
		// no longer reflects anything verifiable) and mark in-flight rows failed.
		playbackRef.current?.clear();
		resetPauseState();
		currentStepMetaRef.current = null;
		setCurrentStep(null);
		logTreeRef.current = failPendingNodes(logTreeRef.current);
		setLogTree(logTreeRef.current);
		updateLiveGraphStatus(failPendingGraphStatus);
		settleResult({ kind: 'stopped' });
		revealTokenRef.current += 1;
	}
	useEffect(() => {
		if (status === 'connected') return;
		// Transport down: drop the now-dead subscription so it is re-created on
		// reconnect (the orphan-resume effect re-subscribes). A normal run also
		// forgets its schedulerId; an orphaned run keeps it so the user can still
		// terminate the backend execution after the socket comes back.
		unsubscribeRef.current?.();
		unsubscribeRef.current = null;
		if (!isOrphaned) schedulerIdRef.current = null;
	}, [status, isOrphaned]);

	// Real-time side of an incoming line: presented either instantly (live
	// mode — bypasses the queue entirely) or buffered for paced playback, and
	// settle the run's OUTCOME immediately — the result line / header quietly
	// show that the run is over while the animation is still catching up. The
	// error reveal is deliberately NOT here (see applyLogToPresentation).
	const handleSocketLog = useCallback(
		(log: ExecutionSocketLog) => {
			if (isLiveAnimationRef.current) {
				applyLogRef.current(log, { updateStep: true });
			} else {
				playbackRef.current?.enqueue(log);
			}

			const isExecutionEnd =
				log.type === 'EXECUTION' && (log.status === 'COMPLETE' || log.status === 'FAIL');
			if (log.error?.message || (log.type === 'EXECUTION' && log.status === 'FAIL')) {
				// A run already stopped/finished a moment earlier must not also pop a
				// "test failed" toast just because a lagging error-carrying line is
				// still working its way through the queue — settleResult's return
				// value is exactly "did THIS call win", so it can gate the toast
				// directly without a separate before/after ref check.
				if (settleResult({ kind: 'failed' })) notifyError(tEntities('connection.test.failed'));
			} else if (log.type === 'EXECUTION' && log.status === 'COMPLETE') {
				const didFinish = settleResult({
					kind: 'finished',
					executionTimeMs: Date.now() - startTimeRef.current,
				});
				// The toast must not claim success for a run whose actual outcome,
				// shown everywhere else, is "stopped"/"failed".
				if (didFinish) message.success(tEntities('connection.test.finished'));
			}
			// Gated on the true end-of-run line only: the backend keeps streaming
			// lines after the failing one (closing out every enclosing loop/
			// operator on the way back up the tree) until this top-level EXECUTION
			// line. Unsubscribing any earlier (this used to also fire on the first
			// log.error?.message) would drop every line still in flight — including
			// this very line — since a torn-down STOMP subscription never delivers.
			if (isExecutionEnd) {
				finishBackend();
				// In live mode lines are applied the instant they arrive (see the
				// branch above) — there is no queued playback to catch up on, so
				// "backend done" already means "presentation done" too. Normally
				// this transition comes from PlaybackQueue's onDrained callback,
				// but that queue sits permanently empty once live mode is on (even
				// if the run STARTED paced and was switched to live mid-run), so
				// nothing would otherwise ever flip phase back to idle here.
				if (isLiveAnimationRef.current) finishPresentationRef.current();
			}
		},
		[settleResult, finishBackend, tEntities],
	);

	// Orphaned runs can't replay the logs they already emitted, so we don't
	// rebuild the tree — we only watch for the end line to clear the stop button.
	const handleOrphanLog = useCallback(
		(log: ExecutionSocketLog) => {
			// Same reasoning as handleSocketLog above: only the top-level EXECUTION
			// line means the backend is actually done. A stray log.error?.message
			// check here used to unsubscribe on the first failing line, before the
			// backend finished unwinding — dropping the real end line entirely.
			const isExecutionEnd =
				log.type === 'EXECUTION' && (log.status === 'COMPLETE' || log.status === 'FAIL');
			if (isExecutionEnd) finishRunImmediately();
		},
		[finishRunImmediately],
	);

	// A run that finished while the page was closed leaves a stale localStorage
	// record: its end line went to a topic nobody was subscribed to, so the
	// orphan subscription above will never receive it and the stop button would
	// hang forever. Verify liveness once on resume against the backend's
	// running-jobs list (the debug test scheduler is listed there while it runs)
	// and clear the stale state when the run is already gone.
	useEffect(() => {
		if (!isOrphaned) return;
		let cancelled = false;
		void (async () => {
			const schedulerId = schedulerIdRef.current;
			// No schedulerId means the run was never confirmed started — treat as done.
			if (schedulerId == null) {
				finishRunImmediately();
				return;
			}
			const running = (await apiExecutor({
				url: '/scheduler/running/all',
				method: 'GET',
				options: { ignoreError: true },
			})) as { schedulerId: number }[] | { status?: number; error?: unknown };
			if (cancelled) return;
			// On a failed request, keep the stop button rather than guess.
			if (!Array.isArray(running)) return;
			if (!running.some((job) => job?.schedulerId === schedulerId)) finishRunImmediately();
		})();
		return () => {
			cancelled = true;
		};
	}, [isOrphaned, finishRunImmediately]);

	// Subscribe an orphaned run once the socket is up so a still-running backend
	// execution can clear the stop button when it finishes.
	useEffect(() => {
		if (!isOrphaned || status !== 'connected' || !client) return;
		if (unsubscribeRef.current) return;
		const channelId = channelIdRef.current;
		if (!channelId) return;
		const subscription = client.subscribe(`/execution/logs/${channelId}`, (frame: IMessage) =>
			handleExecutionLogFrame(frame, handleOrphanLog));
		unsubscribeRef.current = () => subscription.unsubscribe();
	}, [isOrphaned, status, client, handleOrphanLog]);

	// Only one test per connection may run at a time (parallel tests on different
	// connections are allowed). Track whether a test for THIS connection is running
	// elsewhere: live via the running-jobs feed, plus an initial REST snapshot (the
	// feed only pushes on job start/finish, so a test already running at page load
	// wouldn't be seen otherwise). Re-snapshot whenever our own run settles so the
	// block lifts promptly.
	const handleRunningJobs = useCallback((jobs: RunningJob[]) => {
		// Once the feed no longer lists our own run, stop excluding it — a future
		// scheduler reusing the same id must then count as a real conflict.
		if (ownSchedulerIdRef.current != null && !isOwnJobListed(jobs, ownSchedulerIdRef.current)) {
			ownSchedulerIdRef.current = null;
		}
		setIsConflictingTestRunning(
			hasConflictingTest(jobs, connectionTitleRef.current, ownSchedulerIdRef.current),
		);
	}, []);
	useStompSubscription<RunningJob[]>(
		client,
		status === 'connected',
		'/scheduler/running/all',
		handleRunningJobs,
	);
	useEffect(() => {
		if (status !== 'connected' || phase !== 'idle') return;
		let cancelled = false;
		void (async () => {
			const jobs = await apiExecutor({
				url: '/scheduler/running/all',
				method: 'GET',
				options: { ignoreError: true },
			});
			if (!cancelled)
				setIsConflictingTestRunning(
					hasConflictingTest(jobs, connectionTitleRef.current, ownSchedulerIdRef.current),
				);
		})();
		return () => {
			cancelled = true;
		};
	}, [status, phase]);

	const startTest = useCallback(async () => {
		if (phase !== 'idle' || !client || status !== 'connected') return;
		// Enforce the single-test-per-connection rule (the button is also disabled,
		// this guards against a race where a test for this connection started moments ago).
		if (isConflictingTestRunning) {
			notifyError(tEntities('connection.test.otherTestRunning'));
			return;
		}
		const payload = buildTestPayload();
		if (!payload) return;

		const channelId = connectionId || createId();
		channelIdRef.current = channelId;
		const startedAt = Date.now();
		playbackRef.current?.clear();
		resetPauseState();
		backendDoneRef.current = false;
		setIsBackendDone(false);
		logTreeRef.current = EMPTY_LIVE_LOG_TREE;
		setLogTree(EMPTY_LIVE_LOG_TREE);
		updateLiveGraphStatus(EMPTY_LIVE_GRAPH_STATUS);
		currentStepMetaRef.current = null;
		setCurrentStep(null);
		setResult(null);
		hasSettledResultRef.current = false;
		setIsOrphaned(false);
		hasRevealedErrorRef.current = false;
		hasSeenErrorRef.current = false;
		revealTokenRef.current += 1;
		if (revealTimerRef.current) {
			clearTimeout(revealTimerRef.current);
			message.destroy(REVEAL_LOADING_MESSAGE_KEY);
		}
		setRevealPending(false);
		startTimeRef.current = startedAt;
		setPhase('starting');
		// Persist before the run is triggered so a page reload mid-test can still
		// detect the active run. The schedulerId is filled in once the POST returns.
		saveActiveTestRun({ channelId, schedulerId: null, startedAt });

		// Subscribe before triggering the run so the first PENDING lines are not lost.
		const subscription = client.subscribe(`/execution/logs/${channelId}`, (frame: IMessage) =>
			handleExecutionLogFrame(frame, handleSocketLog));
		unsubscribeRef.current = () => subscription.unsubscribe();

		try {
			const response = await testConnectionExecution(payload, channelId);
			schedulerIdRef.current = response.data?.schedulerId ?? null;
			ownSchedulerIdRef.current = schedulerIdRef.current;
			// The run may have finished (and cleared the record) while the POST was
			// in flight — only persist the schedulerId if this run is still active.
			if (channelIdRef.current === channelId) {
				saveActiveTestRun({ channelId, schedulerId: schedulerIdRef.current, startedAt });
			}
			// The run may already have finished while the POST was in flight.
			if (unsubscribeRef.current) setPhase('running');
		} catch (err) {
			console.error(err);
			const specificMessage = onResolveStartError?.(err);
			notifyError(specificMessage ?? tEntities('connection.test.startFailed'));
			finishRunImmediately();
		}
	}, [phase, client, status, isConflictingTestRunning, buildTestPayload, connectionId, handleSocketLog, finishRunImmediately, tEntities, onResolveStartError, resetPauseState, updateLiveGraphStatus]);

	const stopTest = useCallback(async () => {
		if (phase !== 'running' && phase !== 'starting') return;
		const schedulerId = schedulerIdRef.current;
		setPhase('stopping');
		if (schedulerId != null) {
			const response = await apiExecutor({
				url: `/scheduler/terminate/${schedulerId}`,
				method: 'GET',
				options: { ignoreError: true },
			});
			// apiExecutor returns the RTK error object instead of throwing.
			const isTerminateFailed =
				!!response && typeof response === 'object' &&
				('status' in response || 'error' in response);
			if (isTerminateFailed) {
				// The run is still alive on the backend — keep the subscription
				// and the stop button so the user can retry.
				notifyError(tEntities('connection.test.stopFailed'));
				setPhase('running');
				return;
			}
		}
		message.info(tEntities('connection.test.terminated'));
		settleResult({ kind: 'stopped' });
		finishBackend(); // unsubscribes from the socket
		resetPauseState();
		// A stop also snaps the animation to the run's actual final state — the
		// flush applies whatever was still buffered, and its drain callback
		// (backend is done by now) closes the presentation.
		playbackRef.current?.flush();
	}, [phase, settleResult, finishBackend, tEntities, resetPauseState]);

	const clearLogs = useCallback(() => {
		if (phase !== 'idle') return;
		logTreeRef.current = EMPTY_LIVE_LOG_TREE;
		setLogTree(EMPTY_LIVE_LOG_TREE);
		updateLiveGraphStatus(EMPTY_LIVE_GRAPH_STATUS);
		setResult(null);
		hasSettledResultRef.current = false;
	}, [phase, updateLiveGraphStatus]);

	// Leaving the page mid-test: confirm, then terminate the backend run before
	// the navigation proceeds. Returns whether the navigation should continue.
	const confirmLeaveDuringTest = useCallback(async () => {
		const ok = await confirm({
			title: tEntities('connection.test.leaveConfirm.title'),
			message: tEntities('connection.test.leaveConfirm.message'),
		});
		if (!ok) return false;
		// Best-effort terminate — the user has chosen to leave regardless of the
		// outcome; a survivor is picked up by the orphan-resume on return.
		const schedulerId = schedulerIdRef.current;
		if (schedulerId != null) {
			await apiExecutor({
				url: `/scheduler/terminate/${schedulerId}`,
				method: 'GET',
				options: { ignoreError: true },
			});
		}
		finishRunImmediately();
		return true;
	}, [confirm, tEntities, finishRunImmediately]);

	// Tab close / reload: the document is unloading and React state is gone, so
	// fire a best-effort keepalive terminate (outlives the page) and drop the
	// stored record so the run isn't resumed as an orphan on reopen. No await —
	// the request is sent and the page is free to die.
	const terminateOnUnload = useCallback(() => {
		const schedulerId = schedulerIdRef.current;
		if (schedulerId != null) {
			void apiFetchWithHeaders(`/scheduler/terminate/${schedulerId}`, {
				method: 'GET',
				keepalive: true,
				timeoutMs: null,
			});
		}
		if (channelIdRef.current) clearActiveTestRun(channelIdRef.current);
	}, []);

	// The leave guard protects a run that is still executing on the BACKEND.
	// Once the backend is done, only the paced playback is still going — leaving
	// then needs no confirmation and nothing to terminate.
	useTestRunLeaveGuard(phase !== 'idle' && !isBackendDone, confirmLeaveDuringTest, terminateOnUnload);

	// A test for this connection running elsewhere blocks us only when we have no
	// run of our own.
	const isOtherTestRunning = phase === 'idle' && isConflictingTestRunning;

	const isPlaybackBehind = playbackPendingCount > 0;

	const value = useMemo<TestRunContextValue>(
		() => ({
			socketStatus: status,
			phase,
			logTree,
			liveGraphStatus,
			loopAncestorsByIndexPath,
			currentStep,
			result,
			isOrphaned,
			isOtherTestRunning,
			isBackendDone,
			isPlaybackBehind,
			isLiveAnimation,
			setLiveAnimation,
			animationSpeed,
			setAnimationSpeed,
			isPaused,
			pauseAnimation,
			resumeAnimation,
			stepForward,
			skipToNextIteration,
			skipToIteration,
			pauseRevealNonce,
			errorRevealNonce,
			revealPending,
			startTest,
			stopTest,
			skipToLive,
			clearLogs,
		}),
		[status, phase, logTree, liveGraphStatus, loopAncestorsByIndexPath, currentStep, result, isOrphaned, isOtherTestRunning, isBackendDone, isPlaybackBehind, isLiveAnimation, setLiveAnimation, animationSpeed, setAnimationSpeed, isPaused, pauseAnimation, resumeAnimation, stepForward, skipToNextIteration, skipToIteration, pauseRevealNonce, errorRevealNonce, revealPending, startTest, stopTest, skipToLive, clearLogs],
	);

	return <TestRunContext.Provider value={value}>{children}</TestRunContext.Provider>;
}
