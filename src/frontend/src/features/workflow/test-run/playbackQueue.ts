import type { ExecutionSocketLog } from '@features/logs';
import { isStepLine } from './playbackStep';

// Paces the test-run presentation. The backend executes at full speed and its
// socket lines arrive in a burst; applying them directly makes the canvas
// animation flash through the whole run in a blink. This queue buffers the
// lines and releases them at a STRICTLY CONSTANT, human-readable pace — the
// playback never accelerates to catch up, so a long run deliberately replays
// for as long as it takes (the "Jump to live" control on the start node is
// the escape hatch). Only presentation flows through here — the run's real
// lifecycle (terminate, storage, the one-test-per-connection block) stays on
// the real clock in TestRunProvider.

// Minimum on-screen time per node switch. Each switch is choreographed in two
// halves: the data dot travels the edge for 0.5s (WorkflowEdge.tsx, dur 0.5s)
// and only THEN the node lights up (TestRunCurrentStep.hasArrived) and stays
// lit for the remaining 0.5s until the next switch.
const NODE_ENTER_DELAY_MS = 1000;
// Everything else (operator COMPLETE lines, EXECUTION frames) rides along
// almost immediately — kept small so the visible cadence stays close to the
// 0.5s travel + 0.5s highlight choreography of the step lines.
const DEFAULT_DELAY_MS = 100;

// Step lines (see playbackStep.ts — operator PENDINGs and method COMPLETEs)
// carry the node-switch dwell; everything else is pass-through.
const baseDelayOf = (log: ExecutionSocketLog): number =>
	isStepLine(log) ? NODE_ENTER_DELAY_MS : DEFAULT_DELAY_MS;

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

	constructor(private readonly callbacks: PlaybackQueueCallbacks) {}

	get pendingCount(): number {
		return this.queue.length;
	}

	enqueue(log: ExecutionSocketLog): void {
		this.queue.push({ log, baseDelay: baseDelayOf(log) });
		this.callbacks.onQueueChange?.(this.queue.length);
		this.schedule();
	}

	// Skip-to-live: apply everything still buffered synchronously, then report
	// the drain. Also the path a stop/terminate takes, so the graph lands on
	// the exact state the run actually reached.
	flush(): void {
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
	// unplayed tail no longer reflects anything verifiable). No onDrained.
	clear(): void {
		this.cancelTimer();
		this.queue = [];
		this.callbacks.onQueueChange?.(0);
	}

	dispose(): void {
		this.cancelTimer();
		this.queue = [];
	}

	private cancelTimer(): void {
		if (this.timer !== null) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}

	private schedule(): void {
		if (this.timer !== null || this.queue.length === 0) return;
		const dueIn = Math.max(0, this.lastApplyAt + this.queue[0].baseDelay - Date.now());
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
