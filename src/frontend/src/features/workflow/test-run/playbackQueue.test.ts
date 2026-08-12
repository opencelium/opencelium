import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecutionSocketLog } from '@features/logs';
import { PlaybackQueue } from './playbackQueue';

const pendingLine = (indexPath: string): ExecutionSocketLog =>
	({ indexPath, status: 'PENDING', type: 'OPERATION', connectorName: null, properties: null, segment: null, error: null } as unknown as ExecutionSocketLog);

const completeLine = (indexPath: string): ExecutionSocketLog =>
	({ indexPath, status: 'COMPLETE', type: 'OPERATION', connectorName: null, properties: null, segment: null, error: null } as unknown as ExecutionSocketLog);

const setup = () => {
	const applied: ExecutionSocketLog[] = [];
	let drainedCount = 0;
	const queue = new PlaybackQueue({
		applyLog: (log) => applied.push(log),
		onDrained: () => {
			drainedCount += 1;
		},
	});
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

	it('clear drops buffered events without applying them and without a drain', () => {
		const { queue, applied, drained } = setup();
		queue.enqueue(pendingLine('0'));
		queue.enqueue(pendingLine('1'));
		queue.clear();
		vi.advanceTimersByTime(2000);
		expect(applied).toHaveLength(0);
		expect(drained()).toBe(0);
	});
});
