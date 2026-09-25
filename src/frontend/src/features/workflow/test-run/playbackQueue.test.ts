import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecutionSocketLog } from '@features/logs';
import { PlaybackQueue } from './playbackQueue';

const pendingLine = (indexPath: string): ExecutionSocketLog =>
	({ indexPath, status: 'PENDING', type: 'OPERATION', connectorName: null, properties: null, segment: null, error: null } as unknown as ExecutionSocketLog);

const completeLine = (indexPath: string): ExecutionSocketLog =>
	({ indexPath, status: 'COMPLETE', type: 'OPERATION', connectorName: null, properties: null, segment: null, error: null } as unknown as ExecutionSocketLog);

const setup = (speed = 1) => {
	const applied: ExecutionSocketLog[] = [];
	let drainedCount = 0;
	const queue = new PlaybackQueue(
		{
			applyLog: (log) => applied.push(log),
			onDrained: () => {
				drainedCount += 1;
			},
		},
		() => speed,
	);
	return { queue, applied, drained: () => drainedCount };
};

describe('PlaybackQueue', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('applies a lone event immediately (live pace, no artificial start delay)', () => {
		const { queue, applied } = setup();
		queue.enqueue(pendingLine('0'));
		vi.advanceTimersByTime(0);
		expect(applied).toHaveLength(1);
	});

	it('paces buffered node entries by the dwell time instead of applying them at once', () => {
		const { queue, applied } = setup();
		queue.enqueue(pendingLine('0'));
		queue.enqueue(pendingLine('1'));
		queue.enqueue(pendingLine('2'));
		vi.advanceTimersByTime(0);
		expect(applied).toHaveLength(1);
		vi.advanceTimersByTime(999);
		expect(applied).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(applied).toHaveLength(2);
		vi.advanceTimersByTime(1000);
		expect(applied).toHaveLength(3);
	});

	it('keeps live pace when events arrive slower than the dwell', () => {
		const { queue, applied } = setup();
		queue.enqueue(pendingLine('0'));
		vi.advanceTimersByTime(0);
		expect(applied).toHaveLength(1);
		vi.advanceTimersByTime(2000);
		queue.enqueue(completeLine('0'));
		vi.advanceTimersByTime(0);
		expect(applied).toHaveLength(2);
	});

	it('holds a strictly constant pace regardless of backlog size — no catch-up acceleration', () => {
		const { queue, applied } = setup();
		// 100 node entries × 1000ms base = 100s of playback, replayed in full.
		for (let i = 0; i < 100; i += 1) queue.enqueue(pendingLine(String(i)));
		vi.advanceTimersByTime(0);
		expect(applied).toHaveLength(1);
		vi.advanceTimersByTime(1000 * 10);
		expect(applied).toHaveLength(11);
		vi.advanceTimersByTime(1000 * 89);
		expect(applied).toHaveLength(100);
	});

	it('flush applies everything synchronously and reports the drain', () => {
		const { queue, applied, drained } = setup();
		queue.enqueue(pendingLine('0'));
		queue.enqueue(completeLine('0'));
		queue.enqueue(pendingLine('1'));
		queue.flush();
		expect(applied).toHaveLength(3);
		expect(drained()).toBe(1);
	});

	it('flush of an empty queue still reports a drain (stop with nothing buffered)', () => {
		const { queue, applied, drained } = setup();
		queue.flush();
		expect(applied).toHaveLength(0);
		expect(drained()).toBe(1);
	});

	it('reports the drain when the queue empties naturally', () => {
		const { queue, drained } = setup();
		queue.enqueue(pendingLine('0'));
		queue.enqueue(completeLine('0'));
		vi.advanceTimersByTime(2000);
		expect(drained()).toBe(1);
	});

	it('scales the dwell by the current speed — 2x halves the 1000ms base delay', () => {
		const { queue, applied } = setup(2);
		queue.enqueue(pendingLine('0'));
		queue.enqueue(pendingLine('1'));
		vi.advanceTimersByTime(0);
		expect(applied).toHaveLength(1);
		vi.advanceTimersByTime(499);
		expect(applied).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(applied).toHaveLength(2);
	});

	it('rescheduleForSpeedChange applies the new speed to the line already mid-wait', () => {
		let speed = 1;
		const applied: ExecutionSocketLog[] = [];
		const queue = new PlaybackQueue(
			{ applyLog: (log) => applied.push(log), onDrained: () => {} },
			() => speed,
		);
		queue.enqueue(pendingLine('0'));
		queue.enqueue(pendingLine('1'));
		vi.advanceTimersByTime(0);
		expect(applied).toHaveLength(1);
		// 500ms of the 1000ms 1x dwell has elapsed; speeding up to 2x should make
		// the remaining wait resolve in (1000/2 - 500) = 0ms once rescheduled.
		vi.advanceTimersByTime(500);
		speed = 2;
		queue.rescheduleForSpeedChange();
		vi.advanceTimersByTime(0);
		expect(applied).toHaveLength(2);
	});

	it('clear drops buffered events without applying them and without a drain', () => {
		const { queue, applied, drained } = setup();
		queue.enqueue(pendingLine('0'));
		queue.enqueue(pendingLine('1'));
		queue.clear();
		vi.advanceTimersByTime(2000);
		expect(applied).toHaveLength(0);
		expect(drained()).toBe(0);
	});

	it('pause freezes the queue exactly where it is — buffered lines wait, new ones still enqueue', () => {
		const { queue, applied } = setup();
		queue.enqueue(pendingLine('0'));
		vi.advanceTimersByTime(0);
		expect(applied).toHaveLength(1);
		queue.pause();
		queue.enqueue(pendingLine('1'));
		vi.advanceTimersByTime(5000);
		expect(applied).toHaveLength(1);
		expect(queue.pendingCount).toBe(1);
	});

	it('resume continues dequeuing from where it left off', () => {
		const { queue, applied } = setup();
		queue.enqueue(pendingLine('0'));
		vi.advanceTimersByTime(0);
		queue.pause();
		queue.enqueue(pendingLine('1'));
		vi.advanceTimersByTime(5000);
		expect(applied).toHaveLength(1);
		queue.resume();
		vi.advanceTimersByTime(0);
		expect(applied).toHaveLength(2);
	});

	it('flush drops an active pause — nothing is left buffered to stay paused on', () => {
		const { queue, applied } = setup();
		queue.enqueue(pendingLine('0'));
		vi.advanceTimersByTime(0);
		queue.pause();
		queue.enqueue(pendingLine('1'));
		queue.flush();
		expect(applied).toHaveLength(2);
		expect(queue.isPaused).toBe(false);
		queue.enqueue(pendingLine('2'));
		vi.advanceTimersByTime(1000);
		expect(applied).toHaveLength(3);
	});

	it('clear drops an active pause too', () => {
		const { queue, applied } = setup();
		queue.pause();
		queue.clear();
		expect(queue.isPaused).toBe(false);
		queue.enqueue(pendingLine('0'));
		vi.advanceTimersByTime(0);
		expect(applied).toHaveLength(1);
	});

	it('stepForward applies exactly one buffered line and stays paused', () => {
		const { queue, applied } = setup();
		queue.enqueue(pendingLine('0'));
		vi.advanceTimersByTime(0);
		queue.pause();
		queue.enqueue(pendingLine('1'));
		queue.enqueue(pendingLine('2'));
		queue.stepForward();
		expect(applied).toHaveLength(2);
		expect(queue.pendingCount).toBe(1);
		expect(queue.isPaused).toBe(true);
		vi.advanceTimersByTime(5000);
		expect(applied).toHaveLength(2);
		queue.stepForward();
		expect(applied).toHaveLength(3);
		expect(queue.pendingCount).toBe(0);
	});

	it('stepForward is a no-op while not paused', () => {
		const { queue, applied } = setup();
		queue.enqueue(pendingLine('0'));
		queue.enqueue(pendingLine('1'));
		queue.stepForward();
		vi.advanceTimersByTime(0);
		expect(applied).toHaveLength(1);
	});

	it('stepForward is a no-op with nothing buffered', () => {
		const { queue, applied } = setup();
		queue.pause();
		queue.stepForward();
		expect(applied).toHaveLength(0);
	});
});
