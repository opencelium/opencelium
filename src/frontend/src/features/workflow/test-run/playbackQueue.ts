import type { ExecutionSocketLog } from '@features/logs';
import { isStepLine } from './playbackStep';
import { BASE_DEFAULT_DELAY_MS, BASE_NODE_ENTER_DELAY_MS } from './animationSpeed';

// Paces the test-run presentation. The backend executes at full speed and its
// socket lines arrive in a burst; applying them directly makes the canvas
// animation flash through the whole run in a blink. This queue buffers the
// lines and releases them at a STRICTLY CONSTANT, human-readable pace — the
// playback never accelerates to catch up, so a long run deliberately replays
// for as long as it takes (the "Jump to live" control on the start node is
// the escape hatch). Only presentation flows through here — the run's real
// lifecycle (terminate, storage, the one-test-per-connection block) stays on
// the real clock in TestRunProvider.
//
// The user-facing speed slider (TestRunContext.animationSpeed) scales every
// dwell below by dividing the 1x base value — passed in as `getSpeed` rather
// than baked in, so dragging the slider takes effect on already-buffered
// lines too, not just ones enqueued after the change.

// Step lines (see playbackStep.ts — operator PENDINGs and method COMPLETEs)
// carry the node-switch dwell; everything else is pass-through. Each switch
// is choreographed in two halves at 1x: the data dot travels the edge for
// 0.5s (WorkflowEdge.tsx) and only THEN the node lights up
// (TestRunCurrentStep.hasArrived) and stays lit for the remaining 0.5s.
const baseDelayOf = (log: ExecutionSocketLog): number =>
	isStepLine(log) ? BASE_NODE_ENTER_DELAY_MS : BASE_DEFAULT_DELAY_MS;

type QueueItem = { log: ExecutionSocketLog; baseDelay: number };

// Whether the consumer should update its visible "current step" choreography
// (currentStep state + arrival timer) for this line. False for every line but
// the last one in a flush() batch — those are superseded within the same
// synchronous burst before anything ever paints, so running that bookkeeping
// for them is pure waste that scales with how large the buffered backlog is.
export type ApplyLogOpts = { updateStep: boolean };

export type PlaybackQueueCallbacks = {
	applyLog: (log: ExecutionSocketLog, opts: ApplyLogOpts) => void;
	// Fired every time the queue becomes empty — after the natural drain of the
	// last item and after every flush() (even a flush of an already-empty
	// queue, so callers can anchor "presentation is caught up" logic to it).
	onDrained: () => void;
	onQueueChange?: (pendingCount: number) => void;
};

export class PlaybackQueue {
	private queue: QueueItem[] = [];
	private timer: ReturnType<typeof setTimeout> | null = null;
	private lastApplyAt = 0;
	// The debugger's pause: freezes dequeuing without dropping anything. New
	// lines keep enqueueing (the backend runs to completion regardless) — they
	// just pile up until resume() lets the queue drain again.
	private paused = false;

	// Read fresh on every schedule() call rather than captured once, so a
	// change takes effect on the very next scheduling decision.
	constructor(
		private readonly callbacks: PlaybackQueueCallbacks,
		private readonly getSpeed: () => number,
	) {}

	get pendingCount(): number {
		return this.queue.length;
	}

	get isPaused(): boolean {
		return this.paused;
	}

	enqueue(log: ExecutionSocketLog): void {
		this.queue.push({ log, baseDelay: baseDelayOf(log) });
		this.callbacks.onQueueChange?.(this.queue.length);
		this.schedule();
	}

	// Freeze the queue exactly where it is — the in-flight arrival timer for
	// whatever step was already dequeued (see TestRunProvider) is untouched and
	// finishes on its own, so the pause lands on a cleanly "arrived" node rather
	// than a half-travelled dot. schedule() itself is what actually observes
	// the pause (see below), so a paused queue is inert until resume().
	pause(): void {
		this.paused = true;
		this.cancelTimer();
	}

	resume(): void {
		if (!this.paused) return;
		this.paused = false;
		this.schedule();
	}

	// Applies exactly the next buffered line, then stays paused — the
	// debugger's "step forward". Only meaningful while paused: schedule()
	// already guards on `this.paused`, so applyHead()'s own call to it below
	// stays a no-op and the timer never gets rearmed. A no-op if nothing is
	// buffered yet (nothing to step into) or if not currently paused (the
	// queue is already auto-advancing on its own timer; forcing an extra step
	// on top of that would double-apply and desync the pacing).
	stepForward(): void {
		if (!this.paused || this.queue.length === 0) return;
		this.applyHead();
	}

	// Skip-to-live: apply everything still buffered synchronously, then report
	// the drain. Also the path a stop/terminate takes, so the graph lands on
	// the exact state the run actually reached. Jumping to live is a deliberate
	// "stop watching the replay" override, so it also drops any pause — there
	// is nothing left buffered to stay paused on.
	flush(): void {
		this.paused = false;
		this.cancelTimer();
		while (this.queue.length > 0) {
			const item = this.queue.shift();
			if (!item) break;
			// Only the item that ends up last actually reaches the screen — every
			// earlier one in this batch is overwritten before React ever commits.
			this.callbacks.applyLog(item.log, { updateStep: this.queue.length === 0 });
		}
		this.lastApplyAt = Date.now();
		this.callbacks.onQueueChange?.(0);
		this.callbacks.onDrained();
	}

	// Drop everything buffered without applying it (socket died mid-run — the
	// unplayed tail no longer reflects anything verifiable, or a fresh run is
	// starting). No onDrained.
	clear(): void {
		this.paused = false;
		this.cancelTimer();
		this.queue = [];
		this.callbacks.onQueueChange?.(0);
	}

	dispose(): void {
		this.cancelTimer();
		this.queue = [];
	}

	// The slider changed while a line was already mid-wait — cancel and
	// reschedule from the same lastApplyAt so the new speed applies to the
	// REMAINING wait immediately, rather than only from the next line onward.
	// A no-op while paused: there is no armed timer to reschedule, and
	// schedule() would refuse to arm one anyway.
	rescheduleForSpeedChange(): void {
		if (this.timer === null) return;
		this.cancelTimer();
		this.schedule();
	}

	private cancelTimer(): void {
		if (this.timer !== null) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}

	private schedule(): void {
		if (this.paused || this.timer !== null || this.queue.length === 0) return;
		const scaledDelay = this.queue[0].baseDelay / this.getSpeed();
		const dueIn = Math.max(0, this.lastApplyAt + scaledDelay - Date.now());
		this.timer = setTimeout(() => {
			this.timer = null;
			this.applyHead();
		}, dueIn);
	}

	private applyHead(): void {
		const item = this.queue.shift();
		if (!item) return;
		this.lastApplyAt = Date.now();
		this.callbacks.applyLog(item.log, { updateStep: true });
		this.callbacks.onQueueChange?.(this.queue.length);
		if (this.queue.length === 0) {
			this.callbacks.onDrained();
		} else {
			this.schedule();
		}
	}
}
